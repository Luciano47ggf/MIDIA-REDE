import type { MediaItem, MediaRecord } from "@/types";
import { presignGet } from "@/lib/storage";

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

/**
 * Converte a linha do banco em um item pronto para a interface (sem dados sensíveis).
 * O bucket é privado, então cada URL é assinada na hora — nunca gravamos URLs no banco,
 * só as chaves dos objetos.
 */
export async function toMediaItem(row: MediaRowForItem): Promise<MediaItem> {
  const [original, thumb, preview] = await Promise.all([
    presignGet(row.storage_key),
    row.thumb_key ? presignGet(row.thumb_key) : Promise.resolve(null),
    row.preview_key ? presignGet(row.preview_key) : Promise.resolve(null),
  ]);
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

export async function coverUrl(key: string | null): Promise<string | null> {
  return key ? presignGet(key) : null;
}
