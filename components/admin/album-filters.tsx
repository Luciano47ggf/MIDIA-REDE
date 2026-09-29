"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/utils/cn";

const TABS = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
  { value: "private", label: "Privados" },
] as const;

export function AlbumFilters({ filter, q }: { filter: string; q: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(q);
  const [pending, startTransition] = useTransition();

  const go = (nextFilter: string, nextQ: string) => {
    const params = new URLSearchParams();
    if (nextFilter !== "all") params.set("filtro", nextFilter);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    const s = params.toString();
    startTransition(() => router.replace(`/admin/albuns${s ? `?${s}` : ""}`));
  };

  // busca enquanto digita (com pequena espera)
  useEffect(() => {
    if (term === q) return;
    const t = setTimeout(() => go(filter, term), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className={cn("mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", pending && "opacity-70")}>
      <div className="inline-flex flex-wrap rounded-xl border border-line bg-surface p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={filter === t.value}
            onClick={() => go(t.value, term)}
            className={cn(
              "h-9 flex-1 rounded-lg px-4 text-sm font-medium transition sm:flex-none",
              filter === t.value ? "bg-ink text-white" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <label className="relative block sm:w-72">
        <span className="sr-only">Buscar álbum</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar álbum..."
          className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        {term && (
          <button type="button" onClick={() => setTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted" aria-label="Limpar busca">
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
    </div>
  );
}
