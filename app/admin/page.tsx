import { Plus } from "lucide-react";
import Link from "next/link";
import { AlbumCard } from "@/components/admin/album-card";
import { EmptyState } from "@/components/admin/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { toAdminCard } from "@/lib/admin-cards";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, listAlbums } from "@/services/albums";
import { formatBytes } from "@/utils/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [stats, recent] = await Promise.all([getDashboardStats(supabase), listAlbums(supabase, { limit: 6 })]);

  const figures = [
    { label: "Álbuns", value: stats.albums.toLocaleString("pt-BR") },
    { label: "Fotos", value: stats.photos.toLocaleString("pt-BR") },
    { label: "Vídeos", value: stats.videos.toLocaleString("pt-BR") },
    { label: "Arquivos", value: (stats.photos + stats.videos).toLocaleString("pt-BR") },
    { label: "Armazenamento", value: formatBytes(stats.bytes) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h1>
          <p className="mt-1 text-muted">Resumo do acervo de fotos e vídeos.</p>
        </div>
        <Link href="/admin/albuns/novo" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          Novo álbum
        </Link>
      </div>

      <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface sm:grid-cols-5">
        {figures.map((f, i) => (
          <div
            key={f.label}
            className={`p-5 ${i > 0 ? "sm:border-l" : ""} ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t sm:border-t-0" : ""} border-line ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">Últimos álbuns criados</h2>
          {recent.albums.length > 0 && (
            <Link href="/admin/albuns" className="text-sm font-medium text-brand hover:underline">
              Ver todos
            </Link>
          )}
        </div>
        {recent.albums.length === 0 ? (
          <EmptyState title="Nenhum álbum ainda" text="Crie o primeiro álbum e envie as fotos do culto." />
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recent.albums.map((a) => (
              <AlbumCard key={a.id} album={toAdminCard(a)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
