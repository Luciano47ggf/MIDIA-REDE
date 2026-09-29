import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { AlbumOverview, AlbumStatus, AlbumVisibility, DashboardStats, MediaPage, MediaRecord, MediaType } from "@/types";
import { MEDIA_ITEM_COLUMNS, toMediaItem } from "@/lib/media";

type DB = SupabaseClient<Database>;

const OVERVIEW_COLUMNS =
  "id, title, slug, description, event_date, status, visibility, cover_media_id, created_by, created_at, updated_at, photo_count, video_count, total_bytes, cover_thumb_key, cover_preview_key";

export async function getDashboardStats(db: DB): Promise<DashboardStats> {
  const { data, error } = await db.rpc("dashboard_stats");
  if (error) throw new Error(error.message);
  const raw = (data ?? {}) as Record<string, unknown>;
  return {
    albums: Number(raw.albums ?? 0),
    photos: Number(raw.photos ?? 0),
    videos: Number(raw.videos ?? 0),
    bytes: Number(raw.bytes ?? 0),
  };
}

export async function listAlbums(
  db: DB,
  opts: {
    status?: AlbumStatus;
    visibility?: AlbumVisibility;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: "created_at" | "event_date";
  } = {},
): Promise<{ albums: AlbumOverview[]; total: number }> {
  const limit = opts.limit ?? 60;
  const offset = opts.offset ?? 0;
  let query = db.from("albums_overview").select(OVERVIEW_COLUMNS, { count: "exact" });
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.visibility) query = query.eq("visibility", opts.visibility);
  if (opts.search) {
    const term = opts.search.replace(/[%_,()]/g, " ").trim();
    if (term) query = query.ilike("title", `%${term}%`);
  }
  const order = opts.orderBy ?? "created_at";
  query = query.order(order, { ascending: false }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { albums: (data ?? []) as AlbumOverview[], total: count ?? 0 };
}

export async function getAlbumOverview(db: DB, id: string): Promise<AlbumOverview | null> {
  const { data, error } = await db.from("albums_overview").select(OVERVIEW_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AlbumOverview | null) ?? null;
}

export async function getAlbumById(db: DB, id: string) {
  const { data, error } = await db.from("albums").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAlbumBySlug(db: DB, slug: string) {
  const { data, error } = await db.from("albums").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Busca todas as mídias de um álbum (em blocos de 1000, limite padrão do Supabase). */
export async function getAllAlbumMedia(db: DB, albumId: string): Promise<MediaRecord[]> {
  const all: MediaRecord[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await db
      .from("media")
      .select("*")
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true })
      .order("original_filename", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + size - 1);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return all;
}

/** Página de mídias para a galeria pública (carregamento infinito). */
export async function getMediaPage(
  db: DB,
  albumId: string,
  opts: { offset: number; limit: number; type?: MediaType },
): Promise<MediaPage> {
  let query = db.from("media").select(MEDIA_ITEM_COLUMNS).eq("album_id", albumId);
  if (opts.type) query = query.eq("type", opts.type);
  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("original_filename", { ascending: true })
    .order("id", { ascending: true })
    .range(opts.offset, opts.offset + opts.limit); // pede 1 a mais para saber se existe próxima página
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const hasMore = rows.length > opts.limit;
  return {
    items: await Promise.all(rows.slice(0, opts.limit).map(toMediaItem)),
    nextOffset: hasMore ? opts.offset + opts.limit : null,
  };
}
