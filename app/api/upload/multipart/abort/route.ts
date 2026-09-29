import { NextResponse } from "next/server";
import { requireTeamUserApi } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { abortMultipart } from "@/lib/storage";
import { isAnyOriginalKey } from "@/lib/storage-keys";

/** Cancela um envio em partes e libera o espaço no Backblaze B2. */
export async function POST(request: Request) {
  const auth = await requireTeamUserApi();
  if ("response" in auth) return auth.response;

  const body = await readJson<{ key: string; uploadId: string }>(request);
  if (!body || !isAnyOriginalKey(body.key) || typeof body.uploadId !== "string") {
    return jsonError("Pedido inválido.");
  }
  try {
    await abortMultipart(body.key, body.uploadId);
  } catch {
    // já cancelado/expirado: tudo bem
  }
  return NextResponse.json({ ok: true });
}
