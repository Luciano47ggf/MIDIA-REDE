import { NextResponse } from "next/server";
import { requireTeamUserApi } from "@/lib/auth";
import { jsonError, logServerError, readJson } from "@/lib/api";
import { presignPut } from "@/lib/r2";
import { previewKey, thumbKey, UUID_RE } from "@/lib/storage-keys";
import type { DerivativesResponse } from "@/types/upload";

/**
 * URLs assinadas para a miniatura e a pré-visualização (geradas no navegador).
 * Elas servem para deixar a galeria rápida. O original continua intacto.
 */
export async function POST(request: Request) {
  const auth = await requireTeamUserApi();
  if ("response" in auth) return auth.response;

  const body = await readJson<{ albumId: string; mediaId: string; thumb: boolean; preview: boolean }>(request);
  if (!body || !UUID_RE.test(body.albumId ?? "") || !UUID_RE.test(body.mediaId ?? "")) {
    return jsonError("Pedido inválido.");
  }
  try {
    const res: DerivativesResponse = {};
    if (body.thumb) {
      const key = thumbKey(body.albumId, body.mediaId);
      res.thumb = { key, ...(await presignPut(key, "image/jpeg")) };
    }
    if (body.preview) {
      const key = previewKey(body.albumId, body.mediaId);
      res.preview = { key, ...(await presignPut(key, "image/jpeg")) };
    }
    return NextResponse.json(res);
  } catch (err) {
    logServerError("upload/derivatives", err);
    return jsonError("Erro ao preparar a miniatura.", 502);
  }
}
