import { cn } from "@/utils/cn";

export function ProgressBar({
  value,
  tone = "brand",
  animated = false,
  className,
}: {
  value: number;
  tone?: "brand" | "success" | "danger";
  animated?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const color = tone === "success" ? "bg-success" : tone === "danger" ? "bg-danger" : "bg-brand";
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-ink/[0.08]", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-300", color, animated && "progress-active")} style={{ width: `${pct}%` }} />
    </div>
  );
}
