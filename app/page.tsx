import Link from "next/link";
import { PublicAlbumCard } from "@/components/gallery/public-album-card";
import { BrandMark } from "@/components/layout/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { siteConfig } from "@/lib/config";
import { coverUrl } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAlbums } from "@/services/albums";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 18;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const { pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const db = createAdminClient();
  const { albums, total } = await listAlbums(db, {
    status: "published",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    orderBy: "event_date",
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <BrandMark />
        <Link href="/login" className="text-sm font-medium text-muted hover:text-ink">
          Equipe
        </Link>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 sm:px-8">
        <section className="pb-10 pt-10 sm:pb-16 sm:pt-20">
          <h1 className="font-display text-[clamp(3.5rem,14vw,9rem)] font-bold leading-[0.85] tracking-[-0.04em] text-ink">
            {siteConfig.homeTitle}
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted sm:text-xl">{siteConfig.homeSubtitle}</p>
        </section>

        {albums.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center text-muted">
            Nenhum álbum publicado ainda.
          </p>
        ) : (
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => (
              <PublicAlbumCard
                key={a.id}
                href={`/a/${a.slug}`}
                title={a.title}
                eventDate={a.event_date}
                photos={a.photo_count}
                videos={a.video_count}
                cover={a.visibility === "public" ? coverUrl(a.cover_preview_key ?? a.cover_thumb_key) : null}
                locked={a.visibility === "password"}
                priority={i < 3}
              />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-14 flex items-center justify-center gap-4 text-[15px]" aria-label="Paginação">
            {page > 1 && (
              <Link href={page - 1 === 1 ? "/" : `/?pagina=${page - 1}`} className="rounded-xl border border-line bg-surface px-5 py-3 font-medium">
                Mais recentes
              </Link>
            )}
            {page < pages && (
              <Link href={`/?pagina=${page + 1}`} className="rounded-xl border border-line bg-surface px-5 py-3 font-medium">
                Álbuns anteriores
              </Link>
            )}
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
