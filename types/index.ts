import type { Tables, Views } from "./supabase";

export type AlbumStatus = "draft" | "published";
export type AlbumVisibility = "public" | "password";
export type MediaType = "photo" | "video";

export type Album = Tables<"albums">;
export type MediaRecord = Tables<"media">;
export type AlbumOverview = Views<"albums_overview">;
export type Profile = Tables<"profiles">;

/** Álbum sem dados sensíveis (sem hash de senha), seguro para enviar ao navegador. */
export type SafeAlbum = Omit<Album, "password_hash"> & { has_password: boolean };

/** Item de mídia já com as URLs prontas para a interface. */
export interface MediaItem {
  id: string;
  type: MediaType;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  /** Miniatura pequena para a grade */
  thumbUrl: string | null;
  /** Imagem maior para o lightbox (foto) ou pôster (vídeo) */
  previewUrl: string | null;
  /** URL pública do arquivo original, usada para tocar vídeos */
  streamUrl: string;
  /** Rota que força o download do ORIGINAL */
  downloadUrl: string;
}

export interface DashboardStats {
  albums: number;
  photos: number;
  videos: number;
  bytes: number;
}

export interface MediaPage {
  items: MediaItem[];
  nextOffset: number | null;
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}
