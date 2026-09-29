import { ImageOff, Lock } from "lucide-react";
import Link from "next/link";
import { formatEventDate, mediaCountLabel } from "@/utils/format";

interface Props {
  href: string;
  title: string;
  eventDate: string;
  photos: number;
  videos: number;
  cover: string | null;
  locked?: boolean;
  priority?: boolean;
}

export function PublicAlbumCard({ href, title, eventDate, photos, videos, cover, locked, priority }: Props) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink/[0.06]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted/60">
            {locked ? <Lock className="h-8 w-8" /> : <ImageOff className="h-8 w-8" />}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight">{title}</h2>
          <p className="mt-1 text-[15px] text-muted">
            {formatEventDate(eventDate)}
            <span className="block text-sm">{mediaCountLabel(photos, videos)}</span>
          </p>
        </div>
        <span className="mt-0.5 shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
          Ver álbum
        </span>
      </div>
    </Link>
  );
}
