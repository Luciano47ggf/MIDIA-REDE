import { NextResponse } from "next/server";
import { hasAlbumAccess } from "@/lib/album-access";
import { getTeamUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAlbumBySlug, getMediaPage } from "@/services/albums";
import type { MediaType } from "@/types";

/** Carregamento infinito da galeria pública. */
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const limit = Math.min(120, Math.max(1, Number(url.searchParams.get("limit")) || 60));
  const typeParam = url.searchParams.get("type");
  const type: MediaType | undefined = typeParam === "photo" || typeParam === "video" ? typeParam : undefined;

  const db = createAdminClient();
  const album = await getAlbumBySlug(db, slug);
  if (!album) return NextResponse.json({ error: "Álbum não encontrado." }, { status: 404 });

  const allowed = album.status === "published" ? await hasAlbumAccess(album) : Boolean(await getTeamUser());
  if (!allowed) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const page = await getMediaPage(db, album.id, { offset, limit, type });
  return NextResponse.json(page, {
    headers: { "Cache-Control": album.visibility === "public" && album.status === "published" ? "public, s-maxage=30, stale-while-revalidate=300" : "private, no-store" },
  });
}
