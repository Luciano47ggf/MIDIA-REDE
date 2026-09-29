import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/utils/cn";

/** Logo + "Mídia Igreja" + "Painel da equipe de mídia", no topo do painel admin. */
export function AdminBrand({ className }: { className?: string }) {
  return (
    <Link href="/admin" className={cn("inline-flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={siteConfig.logo} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
      <span className="min-w-0">
        <span className="block truncate font-display text-[17px] font-semibold leading-tight tracking-tight text-white">{siteConfig.appName}</span>
        <span className="block truncate text-xs leading-tight text-sidebar-fg">Painel da equipe de mídia</span>
      </span>
    </Link>
  );
}
