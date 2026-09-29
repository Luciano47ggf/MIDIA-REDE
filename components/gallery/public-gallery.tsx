"use client";

import { Download, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem, MediaPage, MediaType } from "@/types";
import { cn } from "@/utils/cn";
import { Lightbox } from "./lightbox";
import { MediaTile } from "./media-tile";

type Tab = "all" | MediaType;

interface PublicGalleryProps {
  slug: string;
  initial: MediaPage;
  photoCount: number;
  videoCount: number;
  pageSize: number;
}

/** Galeria pública: carregamento infinito, lightbox, player e seleção para download. */
export function PublicGallery({ slug, initial, photoCount, videoCount, pageSize }: PublicGalleryProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<MediaItem[]>(initial.items);
  const [nextOffset, setNextOffset] = useState<number | null>(initial.nextOffset);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [selected, setSelected] = useState<Map<string, MediaItem>>(new Map());
  const [downloading, setDownloading] = useState<{ done: number; total: number } | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const total = tab === "photo" ? photoCount : tab === "video" ? videoCount : photoCount + videoCount;

  const loadMore = useCallback(async () => {
    if (loadingRef.current || nextOffset == null) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ offset: String(nextOffset), limit: String(pageSize) });
      if (tab !== "all") params.set("type", tab);
      const res = await fetch(`/api/public/albums/${encodeURIComponent(slug)}/media?${params}`);
      if (!res.ok) throw new Error();
      const page = (await res.json()) as MediaPage;
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((i) => !seen.has(i.id))];
      });
      setNextOffset(page.nextOffset);
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [nextOffset, pageSize, slug, tab]);

  // Troca de aba: recomeça a lista com o filtro escolhido
  const switchTab = async (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setOpen(null);
    if (next === "all") {
      setItems(initial.items);
      setNextOffset(initial.nextOffset);
      return;
    }
    setItems([]);
    setNextOffset(0);
  };

  useEffect(() => {
    if (items.length === 0 && nextOffset === 0) void loadMore();
  }, [items.length, nextOffset, loadMore]);

  // Carrega mais quando o fim da grade se aproxima
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void loadMore(), { rootMargin: "1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const toggle = (item: MediaItem) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.set(item.id, item);
      return next;
    });

  /**
   * Baixa os selecionados um por um, direto do Cloudflare R2 (sem ZIP no servidor,
   * então não existe limite de tempo/tamanho da Vercel).
   */
  async function downloadSelected() {
    const list = Array.from(selected.values());
    setDownloading({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      const a = document.createElement("a");
      a.href = list[i].downloadUrl;
      a.download = list[i].filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDownloading({ done: i + 1, total: list.length });
      await new Promise((r) => setTimeout(r, 900));
    }
    setDownloading(null);
  }

  const selectedList = Array.from(selected.values());
  const allPhotos = selectedList.every((i) => i.type === "photo");
  const selectionLabel =
    selectedList.length === 1
      ? allPhotos
        ? "1 foto selecionada"
        : "1 arquivo selecionado"
      : `${selectedList.length} ${allPhotos ? "fotos selecionadas" : "arquivos selecionados"}`;

  const showTabs = photoCount > 0 && videoCount > 0;

  return (
    <>
      {showTabs && (
        <div className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Filtrar">
          {(
            [
              ["all", "Tudo"],
              ["photo", "Fotos"],
              ["video", "Vídeos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={tab === value}
              onClick={() => switchTab(value)}
              className={cn("h-10 rounded-lg px-4 text-sm font-medium transition", tab === value ? "bg-ink text-white" : "text-muted hover:text-ink")}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 && !loading && nextOffset == null ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center text-muted">
          Os arquivos deste álbum ainda estão sendo enviados. Volte daqui a pouco.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item, i) => (
            <MediaTile key={item.id} item={item} onOpen={() => setOpen(i)} selected={selected.has(item.id)} onToggleSelect={() => toggle(item)} />
          ))}
        </div>
      )}

      <div ref={sentinel} className="flex h-24 items-center justify-center">
        {loading && <Loader2 className="h-6 w-6 animate-spin text-muted" />}
        {loadError && (
          <button type="button" onClick={() => void loadMore()} className="text-sm font-medium text-brand underline">
            Não foi possível carregar mais. Tocar para tentar de novo.
          </button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-2xl sm:flex-nowrap">
            <p className="flex-1 text-[15px] font-medium">
              {downloading ? `Baixando ${downloading.done} de ${downloading.total}...` : selectionLabel}
            </p>
            <button
              type="button"
              onClick={() => setSelected(new Map())}
              disabled={Boolean(downloading)}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              <X className="h-4 w-4" />
              Limpar seleção
            </button>
            <button
              type="button"
              onClick={downloadSelected}
              disabled={Boolean(downloading)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-[15px] font-medium text-ink disabled:opacity-60"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Baixar selecionadas
            </button>
          </div>
        </div>
      )}

      {open != null && (
        <Lightbox
          items={items}
          index={open}
          total={total}
          onClose={() => setOpen(null)}
          onIndexChange={setOpen}
          onNearEnd={nextOffset != null ? () => void loadMore() : undefined}
        />
      )}
    </>
  );
}
