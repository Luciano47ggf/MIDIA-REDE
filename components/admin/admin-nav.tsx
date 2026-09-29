"use client";

import { ExternalLink, FolderOpen, LayoutGrid, LogOut, Menu, Plus, Settings, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/admin/actions";
import { AdminBrand } from "@/components/admin/admin-brand";
import { UserMenu } from "@/components/admin/user-menu";
import { cn } from "@/utils/cn";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/admin/albuns", label: "Álbuns", icon: FolderOpen, exact: false },
  { href: "/admin/albuns/novo", label: "Novo álbum", icon: Plus, exact: true },
  { href: "/admin/uploads", label: "Uploads", icon: UploadCloud, exact: true },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: true },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname.startsWith(href) && pathname !== "/admin/albuns/novo";
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition",
              active ? "bg-white/10 text-sidebar-fg-active" : "text-sidebar-fg hover:bg-white/5 hover:text-sidebar-fg-active",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </Link>
        );
      })}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="mt-2 flex h-11 items-center gap-3 rounded-xl border border-sidebar-border px-3 text-[15px] font-medium text-sidebar-fg transition hover:bg-white/5 hover:text-sidebar-fg-active"
      >
        <ExternalLink className="h-[18px] w-[18px] shrink-0" />
        Abrir galeria pública
      </a>
    </nav>
  );
}

export function AdminNav({
  userName,
  userEmail,
  avatarUrl,
}: {
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Computador: sidebar fixa azul-marinho */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-sidebar px-4 py-6 lg:flex">
        <AdminBrand className="px-2" />
        <div className="mt-10 flex flex-1 flex-col">
          <NavLinks pathname={pathname} />
        </div>
        <form action={signOutAction} className="border-t border-sidebar-border pt-3">
          <button
            type="submit"
            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-sidebar-fg transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sair
          </button>
        </form>
      </aside>

      {/* Barra superior (celular e computador) */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:pl-8">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
          className="grid h-10 w-10 place-items-center rounded-xl text-ink hover:bg-ink/[0.06] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <AdminBrand />
        </div>
        <div className="hidden flex-1 lg:block" />
        <UserMenu name={userName} email={userEmail} avatarUrl={avatarUrl} />
      </header>

      {/* Celular: gaveta de navegação recolhível */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-ink/50" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-in absolute inset-y-0 left-0 flex w-[82%] max-w-80 flex-col bg-sidebar px-4 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <AdminBrand className="px-2" />
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Fechar menu" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sidebar-fg hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-10 flex flex-1 flex-col">
              <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <form action={signOutAction} className="border-t border-sidebar-border pt-3">
              <button
                type="submit"
                className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-sidebar-fg transition hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
