import type {
  DerivativesResponse,
  InitUploadResponse,
  RegisterMediaRequest,
  SignPartsResponse,
  UploadedPart,
  UploadItem,
} from "@/types/upload";
import { checkFile } from "@/lib/media-rules";
import { AbortedError, apiPost, UploadError } from "./errors";
import { readMediaInfo, type MediaInfo } from "./media-info";
import { clearResume, fingerprint, loadResume, saveResume, type ResumeState } from "./resume-store";
import { putWithProgress } from "./xhr";

/**
 * FILA DE UPLOAD
 * - envia até FILE_CONCURRENCY arquivos ao mesmo tempo;
 * - arquivos grandes vão em partes (Multipart), PART_CONCURRENCY partes por vez;
 * - cada parte tem novas tentativas automáticas;
 * - funciona fora do React, então os envios continuam enquanto a pessoa navega pelo painel.
 */
const FILE_CONCURRENCY = 4;
const PART_CONCURRENCY = 3;
const PART_RETRIES = 4;
const SIGN_BATCH = 20;
const EMIT_INTERVAL = 150;

type Listener = () => void;
type DoneListener = (item: UploadItem) => void;

export interface Rejected {
  name: string;
  reason: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class UploadManager {
  private items: UploadItem[] = [];
  private snapshot: UploadItem[] = [];
  private listeners = new Set<Listener>();
  private doneListeners = new Set<DoneListener>();
  private controllers = new Map<string, AbortController>();
  private active = 0;
  private emitTimer: ReturnType<typeof setTimeout> | null = null;
  private seq = 0;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  onItemDone(listener: DoneListener) {
    this.doneListeners.add(listener);
    return () => {
      this.doneListeners.delete(listener);
    };
  }

  hasActiveUploads() {
    return this.items.some((i) => i.status !== "done" && i.status !== "error");
  }

  add(albumId: string, files: File[]): Rejected[] {
    const rejected: Rejected[] = [];
    for (const file of files) {
      const check = checkFile(file.name, file.size, file.type);
      if (!check.ok) {
        rejected.push({ name: file.name, reason: check.reason });
        continue;
      }
      const duplicate = this.items.some(
        (i) =>
          i.albumId === albumId &&
          i.name === file.name &&
          i.size === file.size &&
          i.file.lastModified === file.lastModified &&
          i.status !== "error",
      );
      if (duplicate) {
        rejected.push({ name: file.name, reason: "Este arquivo já está na lista." });
        continue;
      }
      this.items.push({
        id: `u${Date.now().toString(36)}${(this.seq++).toString(36)}`,
        albumId,
        file,
        name: file.name,
        size: file.size,
        kind: check.kind,
        status: "queued",
        loaded: 0,
        localPreview: check.kind === "photo" ? URL.createObjectURL(file) : undefined,
      });
    }
    this.emit(true);
    this.pump();
    return rejected;
  }

  retry(id: string) {
    const item = this.find(id);
    if (!item || item.status !== "error") return;
    this.patch(id, { status: "queued", error: undefined, loaded: 0 });
    this.pump();
  }

  retryAllFailed(albumId?: string) {
    for (const i of this.items) {
      if (i.status === "error" && (!albumId || i.albumId === albumId)) {
        i.status = "queued";
        i.error = undefined;
        i.loaded = 0;
      }
    }
    this.emit(true);
    this.pump();
  }

  cancel(id: string) {
    this.controllers.get(id)?.abort();
    const item = this.find(id);
    if (item && item.status === "queued") this.patch(id, { status: "error", error: "Cancelado." });
  }

  /** Remove da lista. Se ainda não terminou, cancela e descarta o envio em partes no R2. */
  remove(id: string) {
    const item = this.find(id);
    if (!item) return;
    this.controllers.get(id)?.abort();
    if (item.status !== "done") {
      const fp = fingerprint(item.albumId, item.file);
      const state = loadResume(fp);
      if (state) {
        clearResume(fp);
        apiPost("/api/upload/multipart/abort", { key: state.key, uploadId: state.uploadId }).catch(() => undefined);
      }
    }
    if (item.localPreview) URL.revokeObjectURL(item.localPreview);
    this.items = this.items.filter((i) => i.id !== id);
    this.emit(true);
  }

  clearFinished(albumId?: string) {
    this.items = this.items.filter((i) => {
      const drop = i.status === "done" && (!albumId || i.albumId === albumId);
      if (drop && i.localPreview) URL.revokeObjectURL(i.localPreview);
      return !drop;
    });
    this.emit(true);
  }

  // ─── internos ───────────────────────────────────────────────────

  private find(id: string) {
    return this.items.find((i) => i.id === id);
  }

  private patch(id: string, patch: Partial<UploadItem>, immediate = true) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    this.items[idx] = { ...this.items[idx], ...patch };
    this.emit(immediate);
  }

  private emit(immediate: boolean) {
    const flush = () => {
      this.emitTimer = null;
      this.snapshot = [...this.items];
      this.listeners.forEach((l) => l());
    };
    if (immediate) {
      if (this.emitTimer) clearTimeout(this.emitTimer);
      flush();
    } else if (!this.emitTimer) {
      this.emitTimer = setTimeout(flush, EMIT_INTERVAL);
    }
  }

  private pump() {
    while (this.active < FILE_CONCURRENCY) {
      const next = this.items.find((i) => i.status === "queued");
      if (!next) break;
      this.active++;
      next.status = "preparing";
      this.emit(true);
      void this.run(next.id).finally(() => {
        this.active--;
        this.pump();
      });
    }
  }

  private async run(id: string) {
    const item = this.find(id);
    if (!item) return;
    const controller = new AbortController();
    this.controllers.set(id, controller);
    const { signal } = controller;
    const fp = fingerprint(item.albumId, item.file);

    try {
      const info = await readMediaInfo(item.file, item.kind);
      if (signal.aborted) throw new AbortedError();
      this.patch(id, { status: "uploading" });

      // 1) Original (retomando, se possível)
      const target = await this.uploadOriginal(item, fp, signal);

      // 2) Miniaturas (falha aqui não impede o arquivo de ser registrado)
      this.patch(id, { status: "finishing", loaded: item.size });
      const derived = await this.uploadDerivatives(item.albumId, target.mediaId, info, signal);

      // 3) Registro no banco
      const payload: RegisterMediaRequest = {
        albumId: item.albumId,
        mediaId: target.mediaId,
        key: target.key,
        filename: item.name,
        contentType: target.contentType,
        size: item.size,
        width: info.width,
        height: info.height,
        duration: info.duration,
        thumbKey: derived.thumbKey,
        previewKey: derived.previewKey,
      };
      await this.withRetries(() => apiPost("/api/media", payload, signal), signal, 3);
      clearResume(fp);
      this.patch(id, { status: "done", loaded: item.size, error: undefined });
      const done = this.find(id);
      if (done) this.doneListeners.forEach((l) => l(done));
    } catch (err) {
      const message =
        err instanceof AbortedError
          ? "Envio cancelado."
          : err instanceof UploadError
            ? err.message
            : "Erro inesperado no envio. Tente novamente.";
      this.patch(id, { status: "error", error: message });
    } finally {
      this.controllers.delete(id);
    }
  }

  private async uploadOriginal(
    item: UploadItem,
    fp: string,
    signal: AbortSignal,
  ): Promise<{ mediaId: string; key: string; contentType: string }> {
    // Existe um envio em partes interrompido deste mesmo arquivo?
    const saved = loadResume(fp);
    if (saved) {
      try {
        const { parts } = await apiPost<{ parts: (UploadedPart & { Size: number })[] }>(
          "/api/upload/multipart/list-parts",
          { key: saved.key, uploadId: saved.uploadId },
          signal,
        );
        this.patch(item.id, { resumed: parts.length > 0 });
        await this.uploadMultipart(item, saved, parts, signal);
        return { mediaId: saved.mediaId, key: saved.key, contentType: saved.contentType };
      } catch (err) {
        if (err instanceof AbortedError) throw err;
        if (err instanceof UploadError && err.message.includes("não encontrado")) {
          clearResume(fp); // expirou: começa do zero
        } else {
          throw err;
        }
      }
    }

    const init = await apiPost<InitUploadResponse>(
      "/api/upload/init",
      { albumId: item.albumId, filename: item.name, size: item.size, contentType: item.file.type },
      signal,
    );

    if (init.mode === "single") {
      await this.withRetries(
        () =>
          putWithProgress(
            init.url,
            item.file,
            init.headers,
            (loaded) => this.patch(item.id, { loaded }, false),
            signal,
          ),
        signal,
        2,
      );
      return { mediaId: init.mediaId, key: init.key, contentType: init.contentType };
    }

    const state: ResumeState = {
      mediaId: init.mediaId,
      key: init.key,
      uploadId: init.uploadId,
      partSize: init.partSize,
      contentType: init.contentType,
      kind: init.kind,
      createdAt: Date.now(),
    };
    saveResume(fp, state);
    await this.uploadMultipart(item, state, [], signal);
    return { mediaId: init.mediaId, key: init.key, contentType: init.contentType };
  }

  private async uploadMultipart(
    item: UploadItem,
    state: ResumeState,
    alreadyUploaded: (UploadedPart & { Size?: number })[],
    signal: AbortSignal,
  ) {
    const { file } = item;
    const totalParts = Math.ceil(file.size / state.partSize);
    const done = new Map<number, string>();
    const progress = new Map<number, number>();

    for (const p of alreadyUploaded) {
      const expected = Math.min(state.partSize, file.size - (p.PartNumber - 1) * state.partSize);
      if (p.PartNumber <= totalParts && (p.Size === undefined || p.Size === expected)) {
        done.set(p.PartNumber, p.ETag);
        progress.set(p.PartNumber, expected);
      }
    }

    const report = () => {
      let loaded = 0;
      progress.forEach((v) => (loaded += v));
      this.patch(item.id, { loaded: Math.min(loaded, file.size) }, false);
    };
    report();

    const pending: number[] = [];
    for (let n = 1; n <= totalParts; n++) if (!done.has(n)) pending.push(n);

    const urls = new Map<number, string>();
    const getUrl = async (n: number) => {
      if (!urls.has(n)) {
        const batch = pending.filter((p) => p >= n && !done.has(p) && !urls.has(p)).slice(0, SIGN_BATCH);
        const res = await apiPost<SignPartsResponse>(
          "/api/upload/multipart/sign-parts",
          { key: state.key, uploadId: state.uploadId, partNumbers: batch.length ? batch : [n] },
          signal,
        );
        for (const [k, v] of Object.entries(res.urls)) urls.set(Number(k), v);
      }
      return urls.get(n)!;
    };

    let cursor = 0;
    let failed = false;
    const worker = async () => {
      try {
        await partLoop();
      } catch (err) {
        failed = true; // os outros "trabalhadores" param de pegar novas partes
        throw err;
      }
    };
    const partLoop = async () => {
      while (!failed && cursor < pending.length) {
        const n = pending[cursor++];
        const start = (n - 1) * state.partSize;
        const blob = file.slice(start, Math.min(start + state.partSize, file.size));
        const etag = await this.withRetries(
          async () => {
            progress.set(n, 0);
            const url = await getUrl(n);
            try {
              const res = await putWithProgress(
                url,
                blob,
                {},
                (loaded) => {
                  progress.set(n, loaded);
                  report();
                },
                signal,
              );
              if (!res.etag) {
                throw new UploadError(
                  "O R2 não devolveu o identificador da parte. Confira se o CORS expõe o cabeçalho ETag.",
                  false,
                );
              }
              return res.etag;
            } catch (err) {
              urls.delete(n); // na próxima tentativa, pede uma URL nova
              throw err;
            }
          },
          signal,
          PART_RETRIES,
        );
        done.set(n, etag);
        progress.set(n, blob.size);
        report();
      }
    };

    await Promise.all(Array.from({ length: Math.min(PART_CONCURRENCY, pending.length) }, worker));

    const parts: UploadedPart[] = Array.from(done.entries()).map(([PartNumber, ETag]) => ({ PartNumber, ETag }));
    await this.withRetries(
      () => apiPost("/api/upload/multipart/complete", { key: state.key, uploadId: state.uploadId, parts }, signal),
      signal,
      3,
    );
  }

  private async uploadDerivatives(albumId: string, mediaId: string, info: MediaInfo, signal: AbortSignal) {
    const result = { thumbKey: null as string | null, previewKey: null as string | null };
    if (!info.thumb && !info.preview) return result;
    try {
      const res = await apiPost<DerivativesResponse>(
        "/api/upload/derivatives",
        { albumId, mediaId, thumb: Boolean(info.thumb), preview: Boolean(info.preview) },
        signal,
      );
      const jobs: Promise<void>[] = [];
      if (res.thumb && info.thumb) {
        const t = res.thumb;
        jobs.push(
          putWithProgress(t.url, info.thumb, t.headers, () => undefined, signal).then(() => {
            result.thumbKey = t.key;
          }),
        );
      }
      if (res.preview && info.preview) {
        const p = res.preview;
        jobs.push(
          putWithProgress(p.url, info.preview, p.headers, () => undefined, signal).then(() => {
            result.previewKey = p.key;
          }),
        );
      }
      await Promise.allSettled(jobs);
    } catch (err) {
      if (err instanceof AbortedError) throw err;
      // sem miniatura: a galeria usa um ícone no lugar
    }
    return result;
  }

  private async withRetries<T>(fn: () => Promise<T>, signal: AbortSignal, attempts: number): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (err instanceof AbortedError || signal.aborted) throw new AbortedError();
        if (err instanceof UploadError && !err.retryable) throw err;
        if (i < attempts - 1) await sleep(Math.min(8000, 800 * 2 ** i));
      }
    }
    throw lastError;
  }
}

/** Uma única fila para todo o painel. */
export const uploadManager = new UploadManager();
