import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "brand" | "accent" | "success" | "ink";
}) {
  const toneClass = {
    brand: "bg-brand/10 text-brand",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/10 text-success",
    ink: "bg-ink/[0.07] text-ink",
  }[tone];

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <span className={cn("grid h-11 w-11 place-items-center rounded-xl", toneClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
