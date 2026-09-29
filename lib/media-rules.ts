import type { MediaType } from "@/types";
import { getExtension } from "@/utils/filename";

/** Formatos aceitos. Usado no navegador E no servidor. */
export const ALLOWED_FORMATS: Record<string, { kind: MediaType; mime: string }> = {
  jpg: { kind: "photo", mime: "image/jpeg" },
  jpeg: { kind: "photo", mime: "image/jpeg" },
  png: { kind: "photo", mime: "image/png" },
  webp: { kind: "photo", mime: "image/webp" },
  mp4: { kind: "video", mime: "video/mp4" },
  mov: { kind: "video", mime: "video/quicktime" },
  webm: { kind: "video", mime: "video/webm" },
};

const ALLOWED_MIMES = new Set(Object.values(ALLOWED_FORMATS).map((f) => f.mime));

export const MAX_PHOTO_BYTES = 200 * 1024 * 1024; // 200 MB por foto
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024 * 1024; // 30 GB por vídeo

/** Acima deste tamanho usamos Multipart Upload (enviado em partes, retomável). */
export const MULTIPART_THRESHOLD = 32 * 1024 * 1024; // 32 MB
export const MIN_PART_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_PARTS = 9000; // limite do R2/S3 é 10.000

export const ACCEPT_ATTRIBUTE = [
  ...Object.keys(ALLOWED_FORMATS).map((e) => `.${e}`),
  ...ALLOWED_MIMES,
].join(",");

export type FileCheck =
  | { ok: true; kind: MediaType; contentType: string }
  | { ok: false; reason: string };

/** Valida extensão, tipo e tamanho. O tipo final vem da EXTENSÃO (mais confiável que o navegador). */
export function checkFile(name: string, size: number, browserMime: string): FileCheck {
  const ext = getExtension(name);
  const format = ALLOWED_FORMATS[ext];
  if (!format) {
    return { ok: false, reason: "Formato não aceito. Envie JPG, PNG, WEBP, MP4, MOV ou WEBM." };
  }
  // Se o navegador informou um tipo, ele precisa ser compatível com a extensão.
  if (browserMime && browserMime !== "application/octet-stream") {
    const family = browserMime.split("/")[0];
    const expected = format.kind === "photo" ? "image" : "video";
    if (family !== expected) {
      return { ok: false, reason: "O conteúdo do arquivo não corresponde à extensão." };
    }
  }
  if (size <= 0) return { ok: false, reason: "Arquivo vazio." };
  const max = format.kind === "photo" ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES;
  if (size > max) {
    return {
      ok: false,
      reason: format.kind === "photo" ? "Foto muito grande (máximo 200 MB)." : "Vídeo muito grande (máximo 30 GB).",
    };
  }
  return { ok: true, kind: format.kind, contentType: format.mime };
}

export function partSizeFor(size: number): number {
  return Math.max(MIN_PART_SIZE, Math.ceil(size / MAX_PARTS / (1024 * 1024)) * 1024 * 1024);
}
