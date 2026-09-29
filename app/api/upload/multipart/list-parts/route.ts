import { NextResponse } from "next/server";
import { requireTeamUserApi } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { listUploadedParts } from "@/lib/r2";
import { isAnyOriginalKey } from "@/lib/storage-keys";

/** Usado para RETOMAR um envio: informa quais partes já chegaram ao R2. */
export async function POST(request: Request) {
  const auth = await requireTeamUserApi();
  if ("response" in auth) return auth.response;

  const body = await readJson<{ key: string; uploadId: string }>(request);
  if (!body || !isAnyOriginalKey(body.key) || typeof body.uploadId !== "string") {
    return jsonError("Pedido inválido.");
  }
  try {
    const parts = await listUploadedParts(body.key, body.uploadId);
    return NextResponse.json({ parts });
  } catch {
    // Envio expirou ou foi cancelado: o navegador começa do zero.
    return jsonError("Envio anterior não encontrado.", 404);
  }
}
