const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: value >= 100 || exp === 0 ? 0 : 1 })} ${UNITS[exp]}`;
}

/** Recebe "2026-09-27" e devolve "27 de setembro de 2026" sem erro de fuso horário. */
export function formatEventDate(isoDate: string, style: "long" | "short" = "long"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return "";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`;
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count.toLocaleString("pt-BR")} ${count === 1 ? singular : pluralForm}`;
}

export function mediaCountLabel(photos: number, videos: number): string {
  const parts: string[] = [];
  if (photos > 0 || videos === 0) parts.push(plural(photos, "foto", "fotos"));
  if (videos > 0) parts.push(plural(videos, "vídeo", "vídeos"));
  return parts.join(" • ");
}
