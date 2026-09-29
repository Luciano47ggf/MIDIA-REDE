import { Plus } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export function EmptyState({ title, text, showAction = true }: { title: string; text: string; showAction?: boolean }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-muted">{text}</p>
      {showAction && (
        <Link href="/admin/albuns/novo" className={buttonClasses("primary", "md", "mt-6")}>
          <Plus className="h-4 w-4" />
          Criar álbum
        </Link>
      )}
    </div>
  );
}
