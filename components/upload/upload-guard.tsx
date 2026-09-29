"use client";

import { CloudUpload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { summarize, useUploads } from "@/hooks/use-uploads";
import { uploadManager } from "@/lib/upload/upload-manager";

/**
 * - Avisa antes de fechar/recarregar a página se houver envios em andamento.
 * - Mostra um indicador flutuante quando a pessoa sai da página do álbum durante os envios.
 */
export function UploadGuard() {
  const items = useUploads();
  const pathname = usePathname();
  const pending = items.filter((i) => i.status !== "done" && i.status !== "error");
  const summary = summarize(items.filter((i) => i.status !== "error"));

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!uploadManager.hasActiveUploads()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  if (pending.length === 0) return null;
  const albumId = pending[0].albumId;
  if (pathname === `/admin/albuns/${albumId}`) return null;

  return (
    <Link
      href={`/admin/albuns/${albumId}`}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-lg"
    >
      <CloudUpload className="h-5 w-5 animate-pulse" />
      <span className="text-sm">
        Enviando {summary.done}/{summary.total} <span className="text-white/60">({summary.percent}%)</span>
      </span>
    </Link>
  );
}
