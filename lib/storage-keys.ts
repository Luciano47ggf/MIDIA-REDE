import type { MediaType } from "@/types";
import { sanitizeFilename } from "@/utils/filename";

/**
 * Estrutura no R2:
 *   albums/ID_DO_ALBUM/photos/ID-nome.jpg     ← original
 *   albums/ID_DO_ALBUM/videos/ID-nome.mp4     ← original
 *   albums/ID_DO_ALBUM/thumbs/ID.jpg          ← miniatura da grade
 *   albums/ID_DO_ALBUM/previews/ID.jpg        ← imagem grande / pôster do vídeo
 * O ID único (UUID) evita arquivos duplicados ou sobrescritos.
 */
export function albumPrefix(albumId: string) {
  return `albums/${albumId}/`;
}

export function originalKey(albumId: string, kind: MediaType, mediaId: string, filename: string) {
  return `${albumPrefix(albumId)}${kind === "photo" ? "photos" : "videos"}/${mediaId}-${sanitizeFilename(filename)}`;
}

export function thumbKey(albumId: string, mediaId: string) {
  return `${albumPrefix(albumId)}thumbs/${mediaId}.jpg`;
}

export function previewKey(albumId: string, mediaId: string) {
  return `${albumPrefix(albumId)}previews/${mediaId}.jpg`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const UUID_RE = new RegExp(`^${UUID}$`, "i");

/** Confere se uma chave enviada pelo navegador realmente pertence ao álbum e à mídia informados. */
export function isOriginalKeyOf(key: string, albumId: string, mediaId: string) {
  const re = new RegExp(`^albums/${albumId}/(photos|videos)/${mediaId}-[A-Za-z0-9._-]+$`);
  return re.test(key);
}

export function isAnyOriginalKey(key: string) {
  return new RegExp(`^albums/${UUID}/(photos|videos)/${UUID}-[A-Za-z0-9._-]+$`, "i").test(key);
}
