import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumActions } from "@/components/admin/album-actions";
import { AlbumForm } from "@/components/admin/album-form";
import { MediaManager } from "@/components/admin/media-manager";
import { StatusBadge } from "@/components/ui/status-badge";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { UploadQueue } from "@/components/upload/upload-queue";
import { appUrl } from "@/lib/env";
import { toMediaItem } from "@/lib/media";
import { UUID_RE } from "@/lib/storage-keys";
import { createClient } from "@/lib/supabase/server";
import { getAlbumById, getAllAlbumMedia } from "@/services/albums";
import { formatBytes, formatEventDate, mediaCountLabel } from "@/utils/format";

export const dynamic = "force-dynamic";

export default async function AlbumEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const { id } = await params;
  const { novo } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const album = await getAlbumById(supabase, id);
  if (!album) notFound();
  const rows = await getAllAlbumMedia(supabase, id);
  const items = rows.map(toMediaItem);
  const photos = rows.filter((r) => r.type === "photo").length;
  const videos = rows.length - photos;
  const bytes = rows.reduce((sum, r) => sum + Number(r.file_size), 0);
  const publicUrl = `${appUrl()}/a/${album.slug}`;

  return (
    <div>
      <Link href="/admin/albuns" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Álbuns
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{album.title}</h1>
          <StatusBadge status={album.status} />
        </div>
        <p className="mt-1 text-muted">
          {formatEventDate(album.event_date)} <span className="px-1 text-line">|</span> {mediaCountLabel(photos, videos)}
          <span className="px-1 text-line">|</span> {formatBytes(bytes)}
        </p>
        <div className="mt-5">
          <AlbumActions albumId={album.id} title={album.title} slug={album.slug} status={album.status} publicUrl={publicUrl} totalFiles={rows.length} />
        </div>
      </header>

      {novo && (
        <p className="mt-6 flex items-start gap-2 rounded-2xl bg-brand/[0.07] px-4 py-3 text-sm text-brand">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Álbum criado. Agora envie as fotos e vídeos. Quando terminar, clique em Publicar.
        </p>
      )}

      <section className="mt-8">
        <UploadDropzone albumId={album.id} />
        <UploadQueue albumId={album.id} />
        <p className="mt-3 text-xs text-muted">
          Se um vídeo grande parar no meio (internet caiu, aba fechada), selecione o mesmo arquivo de novo neste álbum: o envio continua de onde parou.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">Arquivos do álbum</h2>
        <p className="mb-5 mt-1 text-sm text-muted">Passe o mouse (ou veja abaixo de cada item no celular) para definir a capa ou excluir.</p>
        <MediaManager albumId={album.id} items={items} coverMediaId={album.cover_media_id} />
      </section>

      <section className="mt-12 max-w-2xl">
        <details className="group rounded-2xl border border-line bg-surface" open={false}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-display text-lg font-semibold tracking-tight sm:px-8">
            Editar informações do álbum
            <span className="text-sm font-normal text-muted group-open:hidden">Abrir</span>
            <span className="hidden text-sm font-normal text-muted group-open:inline">Fechar</span>
          </summary>
          <div className="border-t border-line px-5 py-6 sm:px-8">
            <AlbumForm
              key={album.updated_at}
              submitLabel="Salvar alterações"
              defaults={{
                id: album.id,
                title: album.title,
                slug: album.slug,
                event_date: album.event_date,
                description: album.description ?? "",
                status: album.status,
                visibility: album.visibility,
                has_password: Boolean(album.password_hash),
              }}
            />
          </div>
        </details>
      </section>
    </div>
  );
}
