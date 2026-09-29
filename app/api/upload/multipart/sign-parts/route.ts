import { NextResponse } from "next/server";
import { requireTeamUserApi } from "@/lib/auth";
import { jsonError, logServerError, readJson } from "@/lib/api";
import { presignPart } from "@/lib/r2";
import { isAnyOriginalKey } from "@/lib/storage-keys";

interface Body {
  key: string;
  uploadId: string;
  partNumbers: number[];
}

/** Gera URLs assinadas para um lote de partes do Multipart Upload. */
export async function POST(request: Request) {
  const auth = await requireTeamUserApi();
  if ("response" in auth) return auth.response;

  const body = await readJson<Body>(request);
  if (
    !body ||
    !isAnyOriginalKey(body.key) ||
    typeof body.uploadId !== "string" ||
    !Array.isArray(body.partNumbers) ||
    body.partNumbers.length === 0 ||
    body.partNumbers.length > 50 ||
    !body.partNumbers.every((n) => Number.isInteger(n) && n >= 1 && n <= 10000)
  ) {
    return jsonError("Pedido de partes inválido.");
  }

  try {
    const entries = await Promise.all(
      body.partNumbers.map(async (n) => [n, await presignPart(body.key, body.uploadId, n)] as const),
    );
    return NextResponse.json({ urls: Object.fromEntries(entries) });
  } catch (err) {
    logServerError("multipart/sign-parts", err);
    return jsonError("Erro ao preparar as partes do envio no Cloudflare R2.", 502);
  }
}
