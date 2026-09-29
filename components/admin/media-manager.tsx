"use client";

import { Download, Eye, Loader2, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteMediaAction, setCoverAction } from "@/app/admin/actions";
import { Lightbox } from "@/components/gallery/lightbox";
import { MediaTile } from "@/components/gallery/media-tile";
import { uploadManager } from "@/lib/upload/upload-manager";
import type { MediaItem } from "@/types";
import { cn } from "@/utils/cn";

const STEP = 120;

/** Grade de arquivos no painel: abrir, definir capa, excluir (um ou vários). */
export function MediaManager({ albumId, items, coverMediaId }: { albumId: string; items: MediaItem[]; coverMediaId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(STEP);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Atualiza a grade conforme os envios deste álbum terminam
  useEffect(() => {
    return uploadManager.onItemDone((item) => {
      if (item.albumId !== albumId) return;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 1500);
    });
  }, [albumId, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function makeCover(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await setCoverAction(albumId, id);
      setToast({ ok: res.ok, text: res.message ?? "" });
      setBusyId(null);
      router.refresh();
    });
  }

  function downloadMany(ids: string[]) {
    ids.forEach((id, i) => {
      const item = items.find((m) => m.id === id);
      if (!item) return;
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = item.downloadUrl;
        a.download = item.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 200);
    });
  }

  function remove(ids: string[]) {
    const msg = ids.length === 1 ? "Excluir este arquivo definitivamente?" : `Excluir ${ids.length} arquivos definitivamente?`;
    if (!window.confirm(msg)) return;
    startTransition(async () => {
      const res = await deleteMediaAction(ids);
      setToast({ ok: res.ok, text: res.message ?? "" });
      if (res.ok) {
        setSelected(new Set());
        setOpen(null);
      }
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
        <p className="font-display text-lg font-semibold">Nenhuma mídia neste álbum</p>
        <p className="mx-auto mt-1 max-w-sm text-muted">Envie fotos ou vídeos para começar.</p>
      </div>
    );
  }

  const current = open != null ? items[open] : null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.slice(0, visible).map((item, i) => {
          const isCover = item.id === coverMediaId;
          return (
            <MediaTile
              key={item.id}
              item={item}
              onOpen={() => setOpen(i)}
              selected={selected.has(item.id)}
              onToggleSelect={() => toggle(item.id)}
              badge={
                isCover ? (
                  <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white shadow">
                    <Star className="h-3 w-3 fill-current" />
                    Capa
                  </span>
                ) : null
              }
            >
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 pt-6 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {!isCover && item.thumbUrl && (
                  <button
                    type="button"
                    onClick={() => makeCover(item.id)}
                    disabled={pending}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-white/90 text-xs font-medium text-ink hover:bg-white"
                  >
                    {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                    Capa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-ink hover:bg-white"
                  aria-label="Visualizar"
                  title="Visualizar"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => downloadMany([item.id])}
                  className="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-ink hover:bg-white"
                  aria-label="Baixar original"
                  title="Baixar original"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove([item.id])}
                  disabled={pending}
                  className="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-danger hover:bg-danger hover:text-white"
                  aria-label="Excluir arquivo"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </MediaTile>
          );
        })}
      </div>

      {items.length > visible && (
        <button type="button" onClick={() => setVisible((v) => v + STEP)} className="mt-4 w-full rounded-xl border border-line bg-surface py-3 text-sm font-medium hover:border-ink/25">
          Mostrar mais ({items.length - visible} restantes)
        </button>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 px-3 lg:left-72">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-white shadow-2xl">
            <p className="flex-1 text-[15px] font-medium">{selected.size} {selected.size === 1 ? "arquivo selecionado" : "arquivos selecionados"}</p>
            <button type="button" onClick={() => setSelected(new Set())} className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm text-white/80 hover:bg-white/10">
              <X className="h-4 w-4" />
              Limpar
            </button>
            <button
              type="button"
              onClick={() => downloadMany(Array.from(selected))}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
              Baixar
            </button>
            <button
              type="button"
              onClick={() => remove(Array.from(selected))}
              disabled={pending}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-danger px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Excluir
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={cn(
            "fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg",
            toast.ok ? "bg-ink" : "bg-danger",
          )}
        >
          {toast.text}
        </div>
      )}

      {open != null && current && (
        <Lightbox items={items.slice(0, Math.max(visible, open + 1))} index={open} total={items.length} onClose={() => setOpen(null)} onIndexChange={(i) => {
          if (i >= visible) setVisible((v) => v + STEP);
          setOpen(i);
        }} />
      )}
    </div>
  );
}
