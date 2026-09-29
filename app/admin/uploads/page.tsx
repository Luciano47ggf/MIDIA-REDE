"use client";

import { ArrowRight, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { UploadQueue } from "@/components/upload/upload-queue";
import { useUploads } from "@/hooks/use-uploads";
import { createClient } from "@/lib/supabase/client";

interface AlbumInfo {
  title: string;
  slug: string;
}

/** Acompanhamento de todos os envios em andamento, em qualquer álbum. */
export default function UploadsPage() {
  const items = useUploads();
  const albumIds = useMemo(() => Array.from(new Set(items.map((i) => i.albumId))), [items]);
  const [albums, setAlbums] = useState<Record<string, AlbumInfo>>({});

  useEffect(() => {
    const missing = albumIds.filter((id) => !albums[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    createClient()
      .from("albums")
      .select("id, title, slug")
      .in("id", missing)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setAlbums((prev) => {
          const next = { ...prev };
          for (const a of data) next[a.id] = { title: a.title, slug: a.slug };
          return next;
        });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumIds]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Uploads</h1>
      <p className="mt-1 text-muted">Acompanhe os envios em andamento em todos os álbuns.</p>

      {albumIds.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <UploadCloud className="h-7 w-7" />
          </span>
          <p className="mt-4 font-display text-lg font-semibold">Nenhum envio em andamento</p>
          <p className="mx-auto mt-1 max-w-sm text-muted">Abra um álbum para enviar fotos e vídeos. O progresso aparece aqui em tempo real.</p>
          <Link href="/admin/albuns" className={buttonClasses("primary", "md", "mt-6")}>
            Ver álbuns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {albumIds.map((albumId) => (
            <section key={albumId}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold tracking-tight">{albums[albumId]?.title ?? "Álbum"}</h2>
                <Link href={`/admin/albuns/${albumId}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                  Abrir álbum
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <UploadQueue albumId={albumId} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
