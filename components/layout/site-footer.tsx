import { siteConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-20 w-full max-w-7xl px-5 pb-10 text-sm text-muted sm:px-8">
      <div className="border-t border-line pt-6">
        {siteConfig.churchName}. Fotos e vídeos disponíveis em qualidade original.
      </div>
    </footer>
  );
}
