import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/utils/cn";

/** Logo + nome da igreja. */
export function BrandMark({ href = "/", tone = "dark", className }: { href?: string; tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={siteConfig.logo} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
      <span className={cn("font-display text-[17px] font-semibold tracking-tight", tone === "light" ? "text-white" : "text-ink")}>
        {siteConfig.churchName}
      </span>
    </Link>
  );
}
