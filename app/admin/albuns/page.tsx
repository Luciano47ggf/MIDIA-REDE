import { Plus } from "lucide-react";
import Link from "next/link";
import { AlbumCard } from "@/components/admin/album-card";
import { AlbumFilters } from "@/components/admin/album-filters";
import { EmptyState } from "@/components/admin/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { toAdminCard } from "@/lib/admin-cards";
import { createClient } from "@/lib/supabase/server";
import { listAlbums } from "@/services/albums";
import type { AlbumStatus } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function AlbumsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; pagina?: string }>;
}) {
  const sp = await searchParams;
  const status: AlbumStatus | undefined = sp.status === "published" || sp.status === "draft" ? sp.status : undefined;
  const q = (sp.q ?? "").slice(0, 100);
  const page = Math.max(1, Number(sp.pagina) || 1);

  const supabase = await createClient();
  const { albums, total } = await listAlbums(supabase, {
    status,
    search: q,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    orderBy: "event_date",
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (p > 1) params.set("pagina", String(p));
    const s = params.toString();
    return `/admin/albuns${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Álbuns</h1>
          <p className="mt-1 text-muted">{total.toLocaleString("pt-BR")} no total</p>
        </div>
        <Link href="/admin/albuns/novo" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          Novo álbum
        </Link>
      </div>

      <AlbumFilters status={status ?? "all"} q={q} />

      {albums.length === 0 ? (
        <EmptyState
          title={q || status ? "Nada encontrado" : "Nenhum álbum ainda"}
          text={q || status ? "Tente outro nome ou limpe os filtros." : "Crie o primeiro álbum e envie as fotos do culto."}
          showAction={!q && !status}
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={toAdminCard(a)} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Paginação">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className={buttonClasses("secondary", "md")}>
              Anterior
            </Link>
          )}
          <span className="text-sm text-muted">
            Página {page} de {pages}
          </span>
          {page < pages && (
            <Link href={pageHref(page + 1)} className={buttonClasses("secondary", "md")}>
              Próxima
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
