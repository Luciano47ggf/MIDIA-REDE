"use client";

import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/types";
import { formatBytes } from "@/utils/format";

interface LightboxProps {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Chamado ao chegar perto do fim da lista, para carregar mais itens. */
  onNearEnd?: () => void;
  total?: number;
}

/** Visualizador em tela cheia: fotos e vídeos, teclado (← → Esc) e gesto de deslizar. */
export function Lightbox({ items, index, onClose, onIndexChange, onNearEnd, total }: LightboxProps) {
  const item = items[index];
  const [loaded, setLoaded] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);

  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const prev = useCallback(() => hasPrev && onIndexChange(index - 1), [hasPrev, index, onIndexChange]);
  const next = useCallback(() => hasNext && onIndexChange(index + 1), [hasNext, index, onIndexChange]);

  useEffect(() => setLoaded(false), [index]);

  useEffect(() => {
    if (onNearEnd && index >= items.length - 4) onNearEnd();
  }, [index, items.length, onNearEnd]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, prev, next]);

  // Pré-carrega as fotos vizinhas para a navegação ficar instantânea
  useEffect(() => {
    for (const n of [items[index + 1], items[index - 1]]) {
      if (n?.type === "photo" && n.previewUrl) {
        const img = new Image();
        img.src = n.previewUrl;
      }
    }
  }, [index, items]);

  if (!item) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touch.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = e.touches[0].clientY - touch.current.y;
    if (Math.abs(dx) > Math.abs(dy)) setDragX(dx);
  };
  const onTouchEnd = () => {
    if (dragX > 60) prev();
    else if (dragX < -60) next();
    setDragX(0);
    touch.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0c10] text-white" role="dialog" aria-modal="true" aria-label={item.filename}>
      <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <p className="min-w-0 truncate text-sm text-white/70">
          {index + 1} de {(total ?? items.length).toLocaleString("pt-BR")}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={item.downloadUrl}
            download
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-[15px] font-medium text-ink transition hover:bg-white/90"
          >
            <Download className="h-4 w-4" />
            <span>Baixar original</span>
          </a>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 hover:bg-white/20" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 sm:px-20"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ transform: dragX ? `translateX(${dragX}px)` : undefined, transition: dragX ? "none" : "transform .2s" }}
        >
          {item.type === "photo" ? (
            <>
              {!loaded && item.thumbUrl && (
                // miniatura borrada enquanto a imagem grande carrega
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbUrl} alt="" className="absolute max-h-full max-w-full object-contain blur-sm" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={item.id}
                src={item.previewUrl ?? item.streamUrl}
                alt={item.filename}
                onLoad={() => setLoaded(true)}
                className="relative max-h-full max-w-full select-none object-contain"
                draggable={false}
              />
            </>
          ) : (
            <video
              key={item.id}
              src={item.streamUrl}
              poster={item.previewUrl ?? undefined}
              controls
              playsInline
              preload="metadata"
              className="max-h-full max-w-full rounded-lg bg-black"
            >
              Seu navegador não conseguiu reproduzir este vídeo. Use o botão Baixar original.
            </video>
          )}
        </div>

        {hasPrev && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid"
            aria-label="Próxima"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-5">
        <button type="button" onClick={prev} disabled={!hasPrev} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 disabled:opacity-30 sm:hidden" aria-label="Anterior">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-xs text-white/50 sm:text-left">
          {item.filename} ({formatBytes(item.size)}
          {item.width && item.height ? `, ${item.width}×${item.height}` : ""})
        </p>
        <button type="button" onClick={next} disabled={!hasNext} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 disabled:opacity-30 sm:hidden" aria-label="Próxima">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
