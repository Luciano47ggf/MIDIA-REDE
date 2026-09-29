"use client";

import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/admin/actions";
import { Avatar } from "@/components/admin/avatar";
import { cn } from "@/utils/cn";

/** Foto de perfil (ou iniciais) + menu (Minha conta / Sair), no canto superior direito do painel. */
export function UserMenu({ name, email, avatarUrl }: { name: string; email: string; avatarUrl?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-xl px-2 text-left transition hover:bg-ink/[0.05] sm:pr-3"
      >
        <Avatar name={name} avatarUrl={avatarUrl} className="h-8 w-8 text-sm" />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[160px] truncate text-sm font-medium leading-tight text-ink">{name}</span>
          <span className="block max-w-[160px] truncate text-xs leading-tight text-muted">{email}</span>
        </span>
        <ChevronDown className={cn("hidden h-4 w-4 shrink-0 text-muted transition sm:block", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="menu-in absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
        >
          <div className="px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <Link
            href="/admin/configuracoes"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex h-10 items-center gap-2.5 rounded-xl px-3 text-[15px] font-medium text-ink hover:bg-ink/[0.05]"
          >
            <User className="h-4 w-4 text-muted" />
            Minha conta
          </Link>
          <Link
            href="/admin/configuracoes"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex h-10 items-center gap-2.5 rounded-xl px-3 text-[15px] font-medium text-ink hover:bg-ink/[0.05]"
          >
            <Settings className="h-4 w-4 text-muted" />
            Configurações
          </Link>
          <form action={signOutAction} className="mt-1 border-t border-line pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-[15px] font-medium text-danger hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
