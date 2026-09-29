"use client";

import { Check, Film, ImageIcon, Play } from "lucide-react";
import type { MediaItem } from "@/types";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/format";

interface MediaTileProps {
  item: MediaItem;
  onOpen: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

/** Quadrado da galeria (foto ou vídeo) com seleção opcional. */
export function MediaTile({ item, onOpen, selected, onToggleSelect, badge, children }: MediaTileProps) {
  return (
    <div className={cn("group relative aspect-square overflow-hidden rounded-lg bg-ink/[0.06]", selected && "ring-[3px] ring-accent ring-offset-2 ring-offset-paper")}>
      <button type="button" onClick={onOpen} className="block h-full w-full" aria-label={`Abrir ${item.filename}`}>
        {item.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn("h-full w-full object-cover transition duration-300", selected ? "scale-[0.97]" : "group-hover:scale-[1.03]")}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted">
            {item.type === "video" ? <Film className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
          </span>
        )}
        {item.type === "video" && (
          <>
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </span>
            </span>
            {item.duration != null && (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
                {formatDuration(item.duration)}
              </span>
            )}
          </>
        )}
      </button>

      {onToggleSelect && (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-pressed={selected}
          aria-label={selected ? "Desmarcar" : "Selecionar"}
          className="absolute left-0 top-0 grid h-11 w-11 place-items-center"
        >
          <span
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full border-2 transition",
              selected ? "border-accent bg-accent text-white" : "border-white/90 bg-black/20 text-transparent shadow-sm",
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </button>
      )}
      {badge}
      {children}
    </div>
  );
}
