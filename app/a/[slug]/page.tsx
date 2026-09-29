import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicGallery } from "@/components/gallery/public-gallery";
import { BrandMark } from "@/components/layout/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShareButton } from "@/components/share/share-button";
import { hasAlbumAccess } from "@/lib/album-access";
import { getTeamUser } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { appUrl } from "@/lib/env";
import { coverUrl } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAlbumBySlug, getAlbumOverview, getMediaPage } from "@/services/albums";
import { formatEventDate, mediaCountLabel } from "@/utils/format";
import { PasswordGate } from "./password-gate";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const db = createAdminClient();
  const album = await getAlbumBySlug(db, slug);
  if (!album || album.status !== "published") return { title: "Álbum", robots: { index: false } };
  const overview = await getAlbumOverview(db, album.id);
  const image = album.visibility === "public" ? coverUrl(overview?.cover_preview_key ?? null) : null;
  const description = `${formatEventDate(album.event_date)}. ${mediaCountLabel(overview?.photo_count ?? 0, overview?.video_count ?? 0)}.`;
  return {
    title: album.title,
    description,
    openGraph: {
      title: album.title,
      description,
      siteName: siteConfig.churchName,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function PublicAlbumPage({ params }: Params) {
  const { slug } = await params;
  const db = createAdminClient();
  const album = await getAlbumBySlug(db, slug);
  if (!album) notFound();

  // Rascunhos só aparecem para a equipe logada (pré-visualização).
  const team = album.status !== "published" ? await getTeamUser() : null;
  if (album.status !== "published" && !team) notFound();

  const unlocked = Boolean(team) || (await hasAlbumAccess(album));
  const overview = await getAlbumOverview(db, album.id);
  const photos = overview?.photo_count ?? 0;
  const videos = overview?.video_count ?? 0;
  const cover = unlocked ? coverUrl(overview?.cover_preview_key ?? overview?.cover_thumb_key ?? null) : null;
  const initial = unlocked ? await getMediaPage(db, album.id, { offset: 0, limit: PAGE_SIZE }) : null;
  const shareUrl = `${appUrl()}/a/${album.slug}`;

  return (
    <div className="flex min-h-dvh flex-col">
      {album.status !== "published" && (
        <div className="bg-accent px-4 py-2 text-center text-sm font-medium text-white">
          Rascunho: só a equipe consegue ver esta página.
        </div>
      )}

      {/* Capa: o destaque da página */}
      <section className={`relative isolate overflow-hidden ${cover ? "min-h-[62svh] sm:min-h-[70svh]" : "bg-brand"}`}>
        {cover && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" fetchPriority="high" className="hero-image absolute inset-0 -z-10 h-full w-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          </>
        )}
        <div className="mx-auto flex h-full min-h-[inherit] w-full max-w-7xl flex-col px-5 pb-10 pt-5 text-white sm:px-8 sm:pb-14">
          <BrandMark tone="light" />
          <div className={cover ? "mt-auto pt-24" : "pt-16"}>
            <p className="text-[15px] text-white/80 sm:text-lg">{formatEventDate(album.event_date)}</p>
            <h1 className="mt-2 max-w-4xl text-balance font-display text-[clamp(2.4rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em]">
              {album.title}
            </h1>
            {unlocked && (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <p className="text-[15px] text-white/85 sm:text-base">{mediaCountLabel(photos, videos)}</p>
                <ShareButton url={shareUrl} title={album.title} variant="dark" size="md" />
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pt-8 sm:px-8 sm:pt-12">
        {album.description && unlocked && (
          <p className="mb-10 max-w-2xl whitespace-pre-line px-2 text-lg leading-relaxed text-ink/80 sm:px-0">{album.description}</p>
        )}
        {unlocked && initial ? (
          <PublicGallery slug={album.slug} initial={initial} photoCount={photos} videoCount={videos} pageSize={PAGE_SIZE} />
        ) : (
          <div className="py-10">
            <PasswordGate slug={album.slug} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
