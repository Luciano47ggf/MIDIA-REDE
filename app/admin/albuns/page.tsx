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
  searchParams: Promise<{ filtro?: string; q?: string; pagina?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filtro === "published" || sp.filtro === "draft" || sp.filtro === "private" ? sp.filtro : "all";
  const status: AlbumStatus | undefined = filter === "published" || filter === "draft" ? filter : undefined;
  const visibility = filter === "private" ? "password" : undefined;
  const q = (sp.q ?? "").slice(0, 100);
  const page = Math.max(1, Number(sp.pagina) || 1);

  const supabase = await createClient();
  const { albums, total } = await listAlbums(supabase, {
    status,
    visibility,
    search: q,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    orderBy: "event_date",
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = filter !== "all";
  const cards = await Promise.all(albums.map(toAdminCard));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (hasFilter) params.set("filtro", filter);
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
          <p className="mt-1 text-muted">Gerencie os registros publicados pela equipe de mídia.</p>
        </div>
        <Link href="/admin/albuns/novo" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          Novo álbum
        </Link>
      </div>

      <AlbumFilters filter={filter} q={q} />

      {albums.length === 0 ? (
        <EmptyState
          title={q || hasFilter ? "Nada encontrado" : "Nenhum álbum criado ainda"}
          text={q || hasFilter ? "Tente outro nome ou limpe os filtros." : "Crie seu primeiro álbum para começar a compartilhar fotos e vídeos."}
          showAction={!q && !hasFilter}
          actionLabel="Criar primeiro álbum"
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <AlbumCard key={card.id} album={card} />
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
