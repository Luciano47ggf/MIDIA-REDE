import type { AdminAlbumCardData } from "@/components/admin/album-card";
import { appUrl } from "@/lib/env";
import { coverUrl } from "@/lib/media";
import type { AlbumOverview } from "@/types";

export async function toAdminCard(a: AlbumOverview): Promise<AdminAlbumCardData> {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    eventDate: a.event_date,
    status: a.status,
    visibility: a.visibility,
    photos: a.photo_count,
    videos: a.video_count,
    bytes: Number(a.total_bytes ?? 0),
    coverUrl: await coverUrl(a.cover_thumb_key),
    publicUrl: `${appUrl()}/a/${a.slug}`,
  };
}
