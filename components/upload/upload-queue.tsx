"use client";

import { AlertCircle, CheckCircle2, Film, Loader2, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { summarize, useUploads } from "@/hooks/use-uploads";
import { uploadManager } from "@/lib/upload/upload-manager";
import type { UploadItem, UploadStatus } from "@/types/upload";
import { cn } from "@/utils/cn";
import { formatBytes } from "@/utils/format";

const STATUS_LABEL: Record<UploadStatus, string> = {
  queued: "Aguardando",
  preparing: "Preparando",
  uploading: "Enviando",
  finishing: "Finalizando",
  done: "Concluído",
  error: "Erro",
};

function Row({ item }: { item: UploadItem }) {
  const pct = item.status === "done" ? 100 : Math.floor((item.loaded / Math.max(1, item.size)) * 100);
  const active = item.status === "uploading" || item.status === "preparing" || item.status === "finishing";

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink/[0.06]">
        {item.localPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.localPreview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted">
            <Film className="h-5 w-5" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[15px] font-medium" title={item.name}>
            {item.name}
          </p>
          <span className="shrink-0 text-sm tabular-nums text-muted">{pct}%</span>
        </div>
        <ProgressBar
          value={pct}
          className="mt-1.5"
          animated={active}
          tone={item.status === "done" ? "success" : item.status === "error" ? "danger" : "brand"}
        />
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          {item.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
          {item.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-danger" />}
          {active && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span className={cn(item.status === "error" && "text-danger")}>
            {item.status === "error" && item.error ? item.error : STATUS_LABEL[item.status]}
            {item.resumed && item.status !== "done" && item.status !== "error" ? " (retomado)" : ""}
          </span>
          <span className="ml-auto shrink-0">{formatBytes(item.size)}</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        {item.status === "error" && (
          <button type="button" onClick={() => uploadManager.retry(item.id)} className="grid h-10 w-10 place-items-center rounded-lg text-brand hover:bg-brand/10" aria-label="Tentar novamente" title="Tentar novamente">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        {item.status !== "done" && (
          <button type="button" onClick={() => uploadManager.remove(item.id)} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-ink/5" aria-label="Remover" title="Cancelar e remover">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

const VISIBLE_STEP = 100;

/** Resumo geral + lista de cada arquivo. */
export function UploadQueue({ albumId }: { albumId: string }) {
  const items = useUploads(albumId);
  const [visible, setVisible] = useState(VISIBLE_STEP);
  if (items.length === 0) return null;

  const s = summarize(items);
  const running = s.active + s.queued > 0;
  // arquivos com problema primeiro, depois os que estão enviando, depois o resto
  const order: Record<UploadStatus, number> = { error: 0, uploading: 1, finishing: 1, preparing: 2, queued: 3, done: 4 };
  const sorted = [...items].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <section className="mt-6 rounded-3xl border border-line bg-surface p-5 sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">Enviar arquivos</h3>
          <p className="mt-0.5 text-sm text-muted">
            {s.total} {s.total === 1 ? "arquivo selecionado" : "arquivos selecionados"}
          </p>
        </div>
        <div className="flex gap-2">
          {s.failed > 0 && (
            <button type="button" onClick={() => uploadManager.retryAllFailed(albumId)} className="h-9 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand/10">
              Tentar novamente ({s.failed})
            </button>
          )}
          {s.done > 0 && (
            <button type="button" onClick={() => uploadManager.clearFinished(albumId)} className="h-9 rounded-lg px-3 text-sm font-medium text-muted hover:bg-ink/5">
              Limpar concluídos
            </button>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:flex sm:flex-wrap">
        <div className="flex gap-1.5"><dt className="text-muted">Concluídos</dt><dd className="font-semibold tabular-nums">{s.done}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted">Enviando</dt><dd className="font-semibold tabular-nums">{s.active}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted">Aguardando</dt><dd className="font-semibold tabular-nums">{s.queued}</dd></div>
        {s.failed > 0 && (
          <div className="flex gap-1.5"><dt className="text-danger">Com erro</dt><dd className="font-semibold tabular-nums text-danger">{s.failed}</dd></div>
        )}
      </dl>

      <div className="mt-4">
        <ProgressBar value={s.percent} animated={running} tone={!running && s.failed === 0 ? "success" : "brand"} className="h-3" />
        <p className="mt-2 text-sm">
          Progresso geral: <span className="font-semibold tabular-nums">{s.percent}%</span>
          <span className="text-muted"> ({formatBytes(s.loadedBytes)} de {formatBytes(s.totalBytes)})</span>
        </p>
        {running && (
          <p className="mt-1 text-xs text-muted">Você pode navegar pelo painel enquanto envia. Só não feche esta aba.</p>
        )}
      </div>

      <ul className="mt-4 divide-y divide-line border-t border-line">
        {sorted.slice(0, visible).map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </ul>
      {sorted.length > visible && (
        <button type="button" onClick={() => setVisible((v) => v + VISIBLE_STEP)} className="mt-3 w-full rounded-xl py-3 text-sm font-medium text-brand hover:bg-brand/5">
          Mostrar mais {Math.min(VISIBLE_STEP, sorted.length - visible)} de {sorted.length - visible}
        </button>
      )}
    </section>
  );
}
