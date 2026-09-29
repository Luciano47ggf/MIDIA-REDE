/** "Culto de Celebração" + "2026-09-27" → "culto-de-celebracao-27-09-2026" */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function buildAlbumSlug(title: string, isoDate: string): string {
  const base = slugify(title);
  const [y, m, d] = isoDate.split("-");
  const datePart = y && m && d ? `${d}-${m}-${y}` : "";
  return [base, datePart].filter(Boolean).join("-");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
