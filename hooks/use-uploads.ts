"use client";

import { useSyncExternalStore } from "react";
import { uploadManager } from "@/lib/upload/upload-manager";
import type { UploadItem } from "@/types/upload";

const EMPTY: UploadItem[] = [];

/** Lista de envios (reativa). Se albumId for informado, filtra por álbum. */
export function useUploads(albumId?: string): UploadItem[] {
  const all = useSyncExternalStore(uploadManager.subscribe, uploadManager.getSnapshot, () => EMPTY);
  return albumId ? all.filter((i) => i.albumId === albumId) : all;
}

export interface UploadSummary {
  total: number;
  done: number;
  active: number;
  queued: number;
  failed: number;
  percent: number;
  totalBytes: number;
  loadedBytes: number;
}

export function summarize(items: UploadItem[]): UploadSummary {
  let done = 0;
  let active = 0;
  let queued = 0;
  let failed = 0;
  let totalBytes = 0;
  let loadedBytes = 0;
  for (const i of items) {
    totalBytes += i.size;
    loadedBytes += i.status === "done" ? i.size : i.loaded;
    if (i.status === "done") done++;
    else if (i.status === "error") failed++;
    else if (i.status === "queued") queued++;
    else active++;
  }
  const percent = totalBytes > 0 ? Math.floor((loadedBytes / totalBytes) * 100) : 0;
  return { total: items.length, done, active, queued, failed, percent, totalBytes, loadedBytes };
}
