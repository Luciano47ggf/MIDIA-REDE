import type { MediaType } from "./index";

export type UploadStatus = "queued" | "preparing" | "uploading" | "finishing" | "done" | "error";

export interface UploadItem {
  id: string;
  albumId: string;
  file: File;
  name: string;
  size: number;
  kind: MediaType;
  status: UploadStatus;
  /** bytes do original já enviados */
  loaded: number;
  error?: string;
  /** URL local (blob:) para mostrar a miniatura enquanto envia */
  localPreview?: string;
  resumed?: boolean;
}

export interface InitUploadRequest {
  albumId: string;
  filename: string;
  size: number;
  contentType: string;
}

export type InitUploadResponse =
  | {
      mode: "single";
      mediaId: string;
      key: string;
      kind: MediaType;
      contentType: string;
      url: string;
      headers: Record<string, string>;
    }
  | {
      mode: "multipart";
      mediaId: string;
      key: string;
      kind: MediaType;
      contentType: string;
      uploadId: string;
      partSize: number;
    };

export interface SignPartsResponse {
  urls: Record<number, string>;
}

export interface UploadedPart {
  PartNumber: number;
  ETag: string;
}

export interface DerivativesResponse {
  thumb?: { key: string; url: string; headers: Record<string, string> };
  preview?: { key: string; url: string; headers: Record<string, string> };
}

export interface RegisterMediaRequest {
  albumId: string;
  mediaId: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbKey: string | null;
  previewKey: string | null;
}
