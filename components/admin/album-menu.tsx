"use client";

import { Eye, EyeOff, Loader2, Lock, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteAlbumAction, setAlbumStatusAction } from "@/app/admin/actions";
import type { AlbumStatus } from "@/types";
import { cn } from "@/utils/cn";

interface Props {
  albumId: string;
  title: string;
  status: AlbumStatus;
  totalFiles: number;
  onMessage?: (message: string, ok: boolean) => void;
}

/** Menu "..." do álbum: publicar/despublicar, marcar como privado, excluir. */
export function AlbumMenu({ albumId, title, status, totalFiles, onMessage }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function toggleStatus() {
    setOpen(false);
    startTransition(async () => {
      const res = await setAlbumStatusAction(albumId, status === "published" ? "draft" : "published");
      onMessage?.(res.message ?? "", res.ok);
      router.refresh();
    });
  }

  function onDelete() {
    setOpen(false);
    const ok = window.confirm(`Excluir o álbum "${title}"?\n\n${totalFiles} arquivo(s) serão apagados definitivamente. Essa ação não pode ser desfeita.`);
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteAlbumAction(albumId);
      onMessage?.(res.message ?? "", res.ok);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-label="Mais ações"
        aria-expanded={open}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink transition hover:border-ink/25 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
      </button>
      {open && (
        <div role="menu" className={cn("menu-in absolute right-0 top-full z-20 mt-1.5 w-60 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-xl")}>
          <button
            type="button"
            role="menuitem"
            onClick={toggleStatus}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[15px] font-medium text-ink hover:bg-ink/[0.05]"
          >
            {status === "published" ? <EyeOff className="h-4 w-4 text-muted" /> : <Eye className="h-4 w-4 text-muted" />}
            {status === "published" ? "Despublicar" : "Publicar"}
          </button>
          <Link
            href={`/admin/albuns/${albumId}#editar-album`}
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-[15px] font-medium text-ink hover:bg-ink/[0.05]"
          >
            <Lock className="h-4 w-4 text-muted" />
            Definir como privado
          </Link>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[15px] font-medium text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" />
            Excluir álbum
          </button>
        </div>
      )}
    </div>
  );
}
