import { cn } from "@/utils/cn";
import type { AlbumStatus } from "@/types";

export function StatusBadge({ status, className }: { status: AlbumStatus; className?: string }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        published ? "bg-success/10 text-success" : "bg-ink/[0.07] text-muted",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", published ? "bg-success" : "bg-muted/60")} />
      {published ? "Publicado" : "Rascunho"}
    </span>
  );
}
