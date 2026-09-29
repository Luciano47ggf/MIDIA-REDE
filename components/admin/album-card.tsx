"use client";

import { Check, ExternalLink, ImageOff, Link2, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlbumMenu } from "@/components/admin/album-menu";
import { QrCodeButton } from "@/components/admin/qr-code-button";
import { VisibilityPill } from "@/components/admin/visibility-pill";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCopy } from "@/hooks/use-copy";
import type { AlbumStatus, AlbumVisibility } from "@/types";
import { formatBytes, formatEventDate, mediaCountLabel } from "@/utils/format";

export interface AdminAlbumCardData {
  id: string;
  title: string;
  slug: string;
  eventDate: string;
  status: AlbumStatus;
  visibility: AlbumVisibility;
  photos: number;
  videos: number;
  bytes: number;
  coverUrl: string | null;
  publicUrl: string;
}

export function AlbumCard({ album }: { album: AdminAlbumCardData }) {
  const router = useRouter();
  const { copied, copy } = useCopy();
  const [message, setMessage] = useState<string | null>(null);

  function onMenuMessage(text: string, ok: boolean) {
    setMessage(text);
    if (ok) router.refresh();
  }

  return (
    <article className="group rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md">
      <Link href={`/admin/albuns/${album.id}`} className="relative block aspect-[4/3] overflow-hidden rounded-t-2xl bg-ink/[0.05]">
        {album.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.coverUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted/60">
            <ImageOff className="h-8 w-8" />
          </span>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <StatusBadge status={album.status} className="bg-surface/95 shadow-sm" />
          <VisibilityPill visibility={album.visibility} className="bg-surface/95 shadow-sm" />
        </div>
      </Link>
      <div className="p-4">
        <h3 className="line-clamp-1 font-display text-lg font-semibold tracking-tight">{album.title}</h3>
        <p className="mt-0.5 text-sm text-muted">
          {formatEventDate(album.eventDate)} <span className="px-1 text-line">|</span> {mediaCountLabel(album.photos, album.videos)}
          <span className="px-1 text-line">|</span> {formatBytes(album.bytes)}
        </p>
        {message && <p className="mt-2 text-sm text-muted" role="status">{message}</p>}
        <div className="mt-4 flex gap-1.5">
          <Link href={`/admin/albuns/${album.id}`} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition hover:border-ink/25">
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <a
            href={`/a/${album.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir página pública"
            title="Abrir"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink transition hover:border-ink/25"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => copy(album.publicUrl)}
            aria-label="Copiar link"
            title="Copiar link"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink transition hover:border-ink/25"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
          </button>
          <QrCodeButton url={album.publicUrl} slug={album.slug} iconOnly />
          <AlbumMenu albumId={album.id} title={album.title} status={album.status} totalFiles={album.photos + album.videos} onMessage={onMenuMessage} />
        </div>
      </div>
    </article>
  );
}
