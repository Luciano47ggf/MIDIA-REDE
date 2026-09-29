import { Images, Users } from "lucide-react";
import Link from "next/link";
import { PublicAlbumCard } from "@/components/gallery/public-album-card";
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
  const covers = await Promise.all(
    albums.map((a) => (a.visibility === "public" ? coverUrl(a.cover_preview_key ?? a.cover_thumb_key) : Promise.resolve(null))),
  );
  const [titleFirstWord, ...titleRest] = siteConfig.homeTitle.split(" ");
  const [taglineLine1, taglineLine2] = siteConfig.homeFooterTagline.split(",").map((s) => s.trim());

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteConfig.logo} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <span className="font-editorial text-xl font-bold tracking-tight text-ink">{siteConfig.churchName}</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink/[0.05] px-4 text-sm font-medium text-ink transition hover:bg-ink/[0.08]"
          >
            <Users className="h-4 w-4" />
            Acesso da equipe
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-[440px] items-center overflow-hidden sm:min-h-[560px]">
        {siteConfig.heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteConfig.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/55 to-sidebar/25" />
            <div className="absolute inset-0 bg-gradient-to-r from-sidebar/85 via-sidebar/30 to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 25% 20%, rgb(43 69 176 / 0.45), transparent 60%), radial-gradient(ellipse 45% 50% at 85% 75%, rgb(217 164 59 / 0.18), transparent 60%), linear-gradient(160deg, var(--sidebar) 0%, var(--sidebar-elevated) 55%, var(--sidebar) 100%)",
            }}
          />
        )}
        <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-white/40" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{siteConfig.homeEyebrow}</span>
          </div>
          <h1 className="font-editorial mt-5 text-[clamp(2.75rem,8vw,6rem)] font-bold leading-[0.95] tracking-tight">
            <span className="text-white">{titleFirstWord}</span>
            {titleRest.length > 0 && <span className="text-[#aebdf2]"> {titleRest.join(" ")}</span>}
          </h1>
          <p className="font-editorial mt-5 max-w-xl text-lg text-white/80 sm:text-xl">{siteConfig.homeSubtitle}</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-14 sm:px-8 sm:py-20">
        {albums.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ink/[0.05] text-brand">
              <Images className="h-9 w-9" />
            </span>
            <p className="font-editorial mt-6 text-2xl font-bold tracking-tight text-ink">Nenhum álbum publicado ainda</p>
            <p className="mx-auto mt-2 max-w-sm text-muted">Em breve, os registros dos nossos cultos e eventos estarão disponíveis aqui.</p>
          </div>
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
                cover={covers[i]}
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

      <footer className="bg-sidebar">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-10 sm:px-8">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteConfig.logo} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <span className="font-editorial text-lg font-bold text-white">{siteConfig.churchName}</span>
            <span className="hidden h-8 w-px bg-white/15 sm:block" />
            <span className="hidden text-sm text-white/55 sm:block">
              {siteConfig.churchName}. Fotos e vídeos disponíveis em qualidade original.
            </span>
          </div>
          <p className="text-right text-xs font-semibold uppercase leading-relaxed tracking-[0.15em] text-white/45">
            {taglineLine1}
            {taglineLine2 && (
              <>
                ,<br />
                {taglineLine2}
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
