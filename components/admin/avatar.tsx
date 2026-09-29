import { cn } from "@/utils/cn";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** Foto de perfil, ou iniciais do nome quando não há foto. */
export function Avatar({ name, avatarUrl, className }: { name: string; avatarUrl?: string | null; className?: string }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />
    );
  }
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white", className)}>
      {initials(name)}
    </span>
  );
}
