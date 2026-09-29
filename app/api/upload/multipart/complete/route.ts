import { NextResponse } from "next/server";
import { requireTeamUserApi } from "@/lib/auth";
import { jsonError, logServerError, readJson } from "@/lib/api";
import { completeMultipart } from "@/lib/storage";
import { isAnyOriginalKey } from "@/lib/storage-keys";
import type { UploadedPart } from "@/types/upload";

/** Junta as partes no Backblaze B2, formando o arquivo original completo. */
export async function POST(request: Request) {
  const auth = await requireTeamUserApi();
  if ("response" in auth) return auth.response;

  const body = await readJson<{ key: string; uploadId: string; parts: UploadedPart[] }>(request);
  if (
    !body ||
    !isAnyOriginalKey(body.key) ||
    typeof body.uploadId !== "string" ||
    !Array.isArray(body.parts) ||
    body.parts.length === 0 ||
    !body.parts.every((p) => Number.isInteger(p.PartNumber) && typeof p.ETag === "string")
  ) {
    return jsonError("Dados para finalizar o envio inválidos.");
  }
  try {
    await completeMultipart(body.key, body.uploadId, body.parts);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logServerError("multipart/complete", err);
    return jsonError("O Backblaze B2 não conseguiu finalizar o arquivo. Tente enviar novamente.", 502);
  }
}
