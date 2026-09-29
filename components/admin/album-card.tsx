"use client";

import { Check, ImageOff, Link2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAlbumAction } from "@/app/admin/actions";
import { buttonClasses } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCopy } from "@/hooks/use-copy";
import type { AlbumStatus } from "@/types";
import { formatEventDate, mediaCountLabel } from "@/utils/format";

export interface AdminAlbumCardData {
  id: string;
  title: string;
  slug: string;
  eventDate: string;
  status: AlbumStatus;
  photos: number;
  videos: number;
  coverUrl: string | null;
  publicUrl: string;
}

export function AlbumCard({ album }: { album: AdminAlbumCardData }) {
  const router = useRouter();
  const { copied, copy } = useCopy();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    const total = album.photos + album.videos;
    const ok = window.confirm(
      `Excluir o álbum "${album.title}"?\n\n${total} arquivo(s) serão apagados definitivamente. Essa ação não pode ser desfeita.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteAlbumAction(album.id);
      if (!res.ok) setError(res.message ?? "Erro ao excluir.");
      else router.refresh();
    });
  }

  return (
    <article className={`group overflow-hidden rounded-2xl border border-line bg-surface transition ${pending ? "opacity-50" : ""}`}>
      <Link href={`/admin/albuns/${album.id}`} className="relative block aspect-[4/3] overflow-hidden bg-ink/[0.05]">
        {album.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.coverUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted/60">
            <ImageOff className="h-8 w-8" />
          </span>
        )}
        <StatusBadge status={album.status} className="absolute left-3 top-3 bg-surface/95 shadow-sm" />
      </Link>
      <div className="p-4">
        <h3 className="line-clamp-1 font-display text-lg font-semibold tracking-tight">{album.title}</h3>
        <p className="mt-0.5 text-sm text-muted">
          {formatEventDate(album.eventDate)} <span className="px-1 text-line">|</span> {mediaCountLabel(album.photos, album.videos)}
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Link href={`/admin/albuns/${album.id}`} className={buttonClasses("secondary", "sm", "flex-1")}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <button type="button" onClick={() => copy(album.publicUrl)} className={buttonClasses("secondary", "sm", "flex-1")}>
            {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar link"}
          </button>
          <button type="button" onClick={onDelete} disabled={pending} className={buttonClasses("danger", "sm", "w-9 px-0")} aria-label="Excluir álbum">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
