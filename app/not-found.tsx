import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="text-center">
        <BrandMark className="mb-10" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">Página não encontrada</h1>
        <p className="mt-2 text-muted">O álbum pode ter sido removido ou o link está incorreto.</p>
        <Link href="/" className={buttonClasses("primary", "lg", "mt-8")}>
          Ver todos os álbuns
        </Link>
      </div>
    </main>
  );
}
