import { Globe, Lock } from "lucide-react";
import { cn } from "@/utils/cn";
import type { AlbumVisibility } from "@/types";

/** Indica se o álbum é público ou protegido por senha (privado). */
export function VisibilityPill({ visibility, className }: { visibility: AlbumVisibility; className?: string }) {
  const isPrivate = visibility === "password";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isPrivate ? "bg-accent/15 text-accent" : "bg-ink/[0.06] text-muted",
        className,
      )}
    >
      {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
      {isPrivate ? "Privado" : "Público"}
    </span>
  );
}
