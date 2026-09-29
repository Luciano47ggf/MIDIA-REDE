import { Film, FolderOpen, HardDrive, Image as ImageIcon, Plus } from "lucide-react";
import Link from "next/link";
import { AlbumCard } from "@/components/admin/album-card";
import { EmptyState } from "@/components/admin/empty-state";
import { QuickActions } from "@/components/admin/quick-actions";
import { StatCard } from "@/components/admin/stat-card";
import { buttonClasses } from "@/components/ui/button";
import { requireTeamUser } from "@/lib/auth";
import { toAdminCard } from "@/lib/admin-cards";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, listAlbums } from "@/services/albums";
import { formatBytes } from "@/utils/format";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }).format(new Date()));
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage() {
  const [profile, supabase] = await Promise.all([requireTeamUser(), createClient()]);
  const [stats, recent] = await Promise.all([getDashboardStats(supabase), listAlbums(supabase, { limit: 6 })]);
  const firstName = (profile.name ?? profile.email).split(" ")[0];
  const uploadHref = recent.albums.length > 0 ? `/admin/albuns/${recent.albums[0].id}` : "/admin/albuns/novo";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-muted">Gerencie os registros dos cultos e eventos.</p>
        </div>
        <Link href="/admin/albuns/novo" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          Novo álbum
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={FolderOpen} label="Álbuns" value={stats.albums.toLocaleString("pt-BR")} tone="brand" />
        <StatCard icon={ImageIcon} label="Fotos" value={stats.photos.toLocaleString("pt-BR")} tone="accent" />
        <StatCard icon={Film} label="Vídeos" value={stats.videos.toLocaleString("pt-BR")} tone="success" />
        <StatCard icon={HardDrive} label="Armazenamento" value={formatBytes(stats.bytes)} tone="ink" />
      </div>

      <QuickActions uploadHref={uploadHref} />

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">Últimos álbuns</h2>
          {recent.albums.length > 0 && (
            <Link href="/admin/albuns" className="text-sm font-medium text-brand hover:underline">
              Ver todos
            </Link>
          )}
        </div>
        {recent.albums.length === 0 ? (
          <EmptyState
            title="Nenhum álbum criado ainda"
            text="Crie seu primeiro álbum para começar a compartilhar fotos e vídeos."
            actionLabel="Criar primeiro álbum"
          />
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
