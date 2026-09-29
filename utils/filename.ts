/** Remove acentos, espaços e caracteres perigosos do nome do arquivo. */
export function sanitizeFilename(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot > 0 ? name.slice(lastDot + 1) : "";
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");
  const safeBase = clean(base).slice(0, 80) || "arquivo";
  const safeExt = clean(ext).toLowerCase().slice(0, 8);
  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

export function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Nome usado no cabeçalho de download (mantém o nome original, sem aspas/quebras). */
export function dispositionFilename(name: string): string {
  return name.replace(/["\\\r\n]/g, "_").slice(0, 200) || "arquivo";
}
