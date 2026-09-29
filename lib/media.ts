import type { MediaItem, MediaRecord } from "@/types";
import { publicUrl } from "@/lib/r2";

type MediaRowForItem = Pick<
  MediaRecord,
  | "id"
  | "type"
  | "original_filename"
  | "storage_key"
  | "thumb_key"
  | "preview_key"
  | "mime_type"
  | "file_size"
  | "width"
  | "height"
  | "duration"
>;

export const MEDIA_ITEM_COLUMNS =
  "id, type, original_filename, storage_key, thumb_key, preview_key, mime_type, file_size, width, height, duration" as const;

/** Converte a linha do banco em um item pronto para a interface (sem dados sensíveis). */
export function toMediaItem(row: MediaRowForItem): MediaItem {
  const original = publicUrl(row.storage_key);
  const thumb = row.thumb_key ? publicUrl(row.thumb_key) : null;
  const preview = row.preview_key ? publicUrl(row.preview_key) : null;
  return {
    id: row.id,
    type: row.type,
    filename: row.original_filename,
    mimeType: row.mime_type,
    size: Number(row.file_size),
    width: row.width,
    height: row.height,
    duration: row.duration == null ? null : Number(row.duration),
    // Se a miniatura não pôde ser gerada, usamos o que houver (último recurso: o original, só para fotos).
    thumbUrl: thumb ?? preview ?? (row.type === "photo" ? original : null),
    previewUrl: preview ?? thumb ?? (row.type === "photo" ? original : null),
    streamUrl: original,
    downloadUrl: `/api/download/${row.id}`,
  };
}

export function coverUrl(key: string | null): string | null {
  return key ? publicUrl(key) : null;
}
