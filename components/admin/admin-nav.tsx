"use client";

import { FolderOpen, LayoutGrid, LogOut, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/admin/actions";
import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/utils/cn";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/admin/albuns", label: "Álbuns", icon: FolderOpen, exact: false },
  { href: "/admin/albuns/novo", label: "Novo álbum", icon: Plus, exact: true },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: true },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname.startsWith(href) && pathname !== "/admin/albuns/novo";
}

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Computador: menu lateral */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <BrandMark href="/admin" className="px-2" />
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition",
                  active ? "bg-brand/10 text-brand" : "text-muted hover:bg-ink/[0.05] hover:text-ink",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line pt-4">
          <p className="truncate px-3 text-sm text-muted" title={userName}>
            {userName}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-2 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-muted transition hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Celular: barra superior + barra inferior */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
        <BrandMark href="/admin" />
        <form action={signOutAction}>
          <button type="submit" className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted" aria-label="Sair">
            <LogOut className="h-[18px] w-[18px]" />
            Sair
          </button>
        </form>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-brand" : "text-muted")}
            >
              <Icon className="h-5 w-5" />
              {label === "Configurações" ? "Ajustes" : label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
