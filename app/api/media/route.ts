import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireTeamUserApi } from "@/lib/auth";
import { jsonError, logServerError, readJson } from "@/lib/api";
import { checkFile } from "@/lib/media-rules";
import { deleteKeys, headObject } from "@/lib/r2";
import { isOriginalKeyOf, previewKey, thumbKey, UUID_RE } from "@/lib/storage-keys";
import { createClient } from "@/lib/supabase/server";
import type { RegisterMediaRequest } from "@/types/upload";

/**
 * Último passo do upload: confere no R2 que o arquivo chegou inteiro
 * e registra as informações no Supabase.
 */
export async function POST(request: Request) {
  const auth = await requireTeamUserApi();
  if ("response" in auth) return auth.response;

  const b = await readJson<RegisterMediaRequest>(request);
  if (!b || !UUID_RE.test(b.albumId ?? "") || !UUID_RE.test(b.mediaId ?? "") || !isOriginalKeyOf(b.key, b.albumId, b.mediaId)) {
    return jsonError("Dados do arquivo inválidos.");
  }

  const check = checkFile(b.filename, b.size, b.contentType);
  if (!check.ok) return jsonError(check.reason, 422);

  // Miniaturas só são aceitas nos caminhos esperados.
  const expectedThumb = thumbKey(b.albumId, b.mediaId);
  const expectedPreview = previewKey(b.albumId, b.mediaId);
  if ((b.thumbKey && b.thumbKey !== expectedThumb) || (b.previewKey && b.previewKey !== expectedPreview)) {
    return jsonError("Miniatura inválida.");
  }

  let original: Awaited<ReturnType<typeof headObject>>;
  let thumbExists = false;
  let previewExists = false;
  try {
    [original, thumbExists, previewExists] = await Promise.all([
      headObject(b.key),
      b.thumbKey ? headObject(b.thumbKey).then(Boolean) : Promise.resolve(false),
      b.previewKey ? headObject(b.previewKey).then(Boolean) : Promise.resolve(false),
    ]);
  } catch (err) {
    logServerError("media/register head", err);
    return jsonError("Não foi possível confirmar o arquivo no Cloudflare R2.", 502);
  }

  if (!original) return jsonError("O arquivo não chegou ao Cloudflare R2. Envie novamente.", 409);
  if (original.size !== b.size) {
    return jsonError("O arquivo chegou incompleto ao Cloudflare R2. Envie novamente.", 409);
  }

  const toInt = (n: number | null) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : null);

  const supabase = await createClient();
  const { data: album } = await supabase.from("albums").select("id, slug").eq("id", b.albumId).maybeSingle();
  if (!album) {
    await deleteKeys([b.key, b.thumbKey ?? "", b.previewKey ?? ""]).catch(() => undefined);
    return jsonError("O álbum foi excluído durante o envio.", 404);
  }

  const { error } = await supabase.from("media").insert({
    id: b.mediaId,
    album_id: b.albumId,
    type: check.kind,
    original_filename: b.filename.slice(0, 255),
    storage_key: b.key,
    thumb_key: thumbExists ? b.thumbKey : null,
    preview_key: previewExists ? b.previewKey : null,
    mime_type: check.contentType,
    file_size: original.size,
    width: toInt(b.width),
    height: toInt(b.height),
    duration: typeof b.duration === "number" && Number.isFinite(b.duration) ? Math.round(b.duration * 100) / 100 : null,
    created_by: auth.profile.id,
  });

  if (error) {
    // Registro já existe (repetição do mesmo pedido): consideramos sucesso.
    if (error.code === "23505") return NextResponse.json({ ok: true, id: b.mediaId });
    logServerError("media/register insert", error);
    return jsonError("O arquivo foi enviado, mas houve erro ao registrar no banco. Tente novamente.", 500);
  }

  revalidatePath(`/a/${album.slug}`);
  return NextResponse.json({ ok: true, id: b.mediaId });
}
