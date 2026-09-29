import { NextResponse } from "next/server";
import { hasAlbumAccess } from "@/lib/album-access";
import { getTeamUser } from "@/lib/auth";
import { presignDownload } from "@/lib/storage";
import { UUID_RE } from "@/lib/storage-keys";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Baixar original": confere a permissão e redireciona para uma URL temporária do
 * Backblaze B2 que entrega EXATAMENTE o arquivo enviado, com o nome original.
 * O arquivo não passa pela Vercel (sem limite de tamanho/tempo).
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return new NextResponse("Arquivo não encontrado.", { status: 404 });

  const db = createAdminClient();
  const { data: media } = await db
    .from("media")
    .select("id, album_id, storage_key, original_filename")
    .eq("id", id)
    .maybeSingle();
  if (!media) return new NextResponse("Arquivo não encontrado.", { status: 404 });

  const { data: album } = await db
    .from("albums")
    .select("id, status, visibility, password_hash")
    .eq("id", media.album_id)
    .maybeSingle();
  if (!album) return new NextResponse("Arquivo não encontrado.", { status: 404 });

  const isPublicOk = album.status === "published" && (await hasAlbumAccess(album));
  if (!isPublicOk && !(await getTeamUser())) {
    return new NextResponse("Você não tem acesso a este arquivo.", { status: 403 });
  }

  const url = await presignDownload(media.storage_key, media.original_filename);
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
