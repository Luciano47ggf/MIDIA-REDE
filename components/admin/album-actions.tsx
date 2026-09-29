"use client";

import { Eye, EyeOff, ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAlbumAction, setAlbumStatusAction } from "@/app/admin/actions";
import { QrCodeButton } from "@/components/admin/qr-code-button";
import { ShareButton } from "@/components/share/share-button";
import { buttonClasses } from "@/components/ui/button";
import { useCopy } from "@/hooks/use-copy";
import type { AlbumStatus } from "@/types";

interface Props {
  albumId: string;
  title: string;
  slug: string;
  status: AlbumStatus;
  publicUrl: string;
  totalFiles: number;
}

export function AlbumActions({ albumId, title, slug, status, publicUrl, totalFiles }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  function toggleStatus() {
    startTransition(async () => {
      const res = await setAlbumStatusAction(albumId, status === "published" ? "draft" : "published");
      setMessage(res.message ?? null);
      router.refresh();
    });
  }

  function onDelete() {
    const ok = window.confirm(
      `Excluir o álbum "${title}"?\n\n${totalFiles} arquivo(s) serão apagados definitivamente do armazenamento. Essa ação não pode ser desfeita.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteAlbumAction(albumId);
      if (res.ok) {
        router.push("/admin/albuns");
        router.refresh();
      } else setMessage(res.message ?? "Erro ao excluir.");
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <a href={`/a/${slug}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "md")}>
          <ExternalLink className="h-4 w-4" />
          Ver página pública
        </a>
        <button type="button" onClick={() => copy(publicUrl)} className={buttonClasses("secondary", "md")}>
          {copied ? "Link copiado" : "Copiar link"}
        </button>
        <ShareButton url={publicUrl} title={title} />
        <QrCodeButton url={publicUrl} slug={slug} />
        <a href="#editar-album" className={buttonClasses("secondary", "md")}>
          <Pencil className="h-4 w-4" />
          Editar álbum
        </a>
        <button type="button" onClick={toggleStatus} disabled={pending} className={buttonClasses(status === "published" ? "secondary" : "primary", "md")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {status === "published" ? "Despublicar" : "Publicar"}
        </button>
        <button type="button" onClick={onDelete} disabled={pending} className={buttonClasses("danger", "md")}>
          <Trash2 className="h-4 w-4" />
          Excluir álbum
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-muted" role="status">{message}</p>}
    </div>
  );
}
