import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireTeamUserApi } from "@/lib/auth";
import { jsonError, logServerError, readJson } from "@/lib/api";
import { checkFile, MULTIPART_THRESHOLD, partSizeFor } from "@/lib/media-rules";
import { createMultipart, presignPut } from "@/lib/r2";
import { originalKey, UUID_RE } from "@/lib/storage-keys";
import { createClient } from "@/lib/supabase/server";
import type { InitUploadRequest, InitUploadResponse } from "@/types/upload";

/**
 * 1º passo do upload: valida o arquivo e devolve para o navegador
 * uma URL assinada (arquivo pequeno) ou um Multipart Upload (arquivo grande).
 * O arquivo em si NUNCA passa pela Vercel.
 */
export async function POST(request: Request) {
  const auth = await requireTeamUserApi();
  if ("response" in auth) return auth.response;

  const body = await readJson<InitUploadRequest>(request);
  if (!body || typeof body.filename !== "string" || typeof body.size !== "number" || !UUID_RE.test(body.albumId ?? "")) {
    return jsonError("Dados do envio inválidos.");
  }

  const check = checkFile(body.filename, body.size, body.contentType ?? "");
  if (!check.ok) return jsonError(check.reason, 422);

  const supabase = await createClient();
  const { data: album } = await supabase.from("albums").select("id").eq("id", body.albumId).maybeSingle();
  if (!album) return jsonError("Álbum não encontrado.", 404);

  const mediaId = randomUUID();
  const key = originalKey(body.albumId, check.kind, mediaId, body.filename);

  try {
    if (body.size >= MULTIPART_THRESHOLD) {
      const uploadId = await createMultipart(key, check.contentType);
      const res: InitUploadResponse = {
        mode: "multipart",
        mediaId,
        key,
        kind: check.kind,
        contentType: check.contentType,
        uploadId,
        partSize: partSizeFor(body.size),
      };
      return NextResponse.json(res);
    }
    const { url, headers } = await presignPut(key, check.contentType);
    const res: InitUploadResponse = { mode: "single", mediaId, key, kind: check.kind, contentType: check.contentType, url, headers };
    return NextResponse.json(res);
  } catch (err) {
    logServerError("upload/init", err);
    return jsonError("Não foi possível falar com o Cloudflare R2. Confira as credenciais do R2.", 502);
  }
}
