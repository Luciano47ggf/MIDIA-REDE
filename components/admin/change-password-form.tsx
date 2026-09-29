"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setStatus({ ok: false, text: "Use pelo menos 8 caracteres." });
    if (password !== confirm) return setStatus({ ok: false, text: "As senhas não são iguais." });
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) setStatus({ ok: false, text: "Não foi possível trocar a senha. Entre novamente e tente de novo." });
    else {
      setStatus({ ok: true, text: "Senha alterada." });
      setPassword("");
      setConfirm("");
    }
  }

  const input = "h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-3 sm:grid-cols-2">
      <input type="password" autoComplete="new-password" placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      <input type="password" autoComplete="new-password" placeholder="Repita a nova senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
      {status && <p className={`text-sm sm:col-span-2 ${status.ok ? "text-success" : "text-danger"}`}>{status.text}</p>}
      <Button type="submit" disabled={loading} className="sm:col-span-2 sm:w-fit">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Trocar senha
      </Button>
    </form>
  );
}
