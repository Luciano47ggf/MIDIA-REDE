"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types";
import { unlockAlbumAction } from "./actions";

export function PasswordGate({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionResult, FormData>(unlockAlbumAction.bind(null, slug), { ok: false });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className="mx-auto max-w-sm rounded-3xl border border-line bg-surface p-6 text-center sm:p-8">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
        <Lock className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">Álbum protegido</h2>
      <p className="mt-1 text-[15px] text-muted">Digite a senha para ver as fotos e vídeos.</p>
      <input
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="off"
        placeholder="Senha"
        className="mt-5 h-12 w-full rounded-xl border border-line bg-surface px-4 text-center text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      {state.message && !state.ok && <p className="mt-3 text-sm text-danger">{state.message}</p>}
      <Button type="submit" size="lg" disabled={pending || state.ok} className="mt-4 w-full">
        {(pending || state.ok) && <Loader2 className="h-4 w-4 animate-spin" />}
        Ver álbum
      </Button>
    </form>
  );
}
