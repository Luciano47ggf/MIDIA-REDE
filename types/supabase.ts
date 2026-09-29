// Tipos do banco usados pelo cliente Supabase.
// Refletem o arquivo supabase/schema.sql. Se mudar o schema, atualize aqui.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "editor";
  created_at: string;
};

type AlbumRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_date: string;
  cover_media_id: string | null;
  status: "draft" | "published";
  visibility: "public" | "password";
  password_hash: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type MediaRow = {
  id: string;
  album_id: string;
  type: "photo" | "video";
  original_filename: string;
  storage_key: string;
  thumb_key: string | null;
  preview_key: string | null;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
};

type AlbumOverviewRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_date: string;
  status: "draft" | "published";
  visibility: "public" | "password";
  cover_media_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  photo_count: number;
  video_count: number;
  total_bytes: number;
  cover_thumb_key: string | null;
  cover_preview_key: string | null;
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Optional<ProfileRow, "name" | "role" | "created_at">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      albums: {
        Row: AlbumRow;
        Insert: Optional<
          AlbumRow,
          | "id"
          | "description"
          | "cover_media_id"
          | "status"
          | "visibility"
          | "password_hash"
          | "created_by"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<AlbumRow>;
        Relationships: [];
      };
      media: {
        Row: MediaRow;
        Insert: Optional<
          MediaRow,
          "thumb_key" | "preview_key" | "width" | "height" | "duration" | "sort_order" | "created_by" | "created_at"
        >;
        Update: Partial<MediaRow>;
        Relationships: [];
      };
    };
    Views: {
      albums_overview: {
        Row: AlbumOverviewRow;
        Relationships: [];
      };
    };
    Functions: {
      dashboard_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"];
