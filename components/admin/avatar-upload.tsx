"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removeAvatarAction, updateAvatarAction } from "@/app/admin/actions";
import { Avatar } from "@/components/admin/avatar";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** Foto de perfil grande com botão para trocar ou remover. Usada em Configurações. */
export function AvatarUpload({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    if (!ACCEPTED.includes(file.type)) {
      setMessage({ ok: false, text: "Formato não aceito. Envie uma foto em JPG, PNG ou WEBP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage({ ok: false, text: "Foto muito grande (máximo 8 MB)." });
      return;
    }
    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(async () => {
      const res = await updateAvatarAction(formData);
      setMessage({ ok: res.ok, text: res.message ?? "" });
      if (res.ok) router.refresh();
    });
  }

  function onRemove() {
    if (!window.confirm("Remover a foto de perfil?")) return;
    setMessage(null);
    startTransition(async () => {
      const res = await removeAvatarAction();
      setMessage({ ok: res.ok, text: res.message ?? "" });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar name={name} avatarUrl={avatarUrl} className="h-20 w-20 text-2xl" />
        {pending && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </span>
        )}
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:border-ink/25 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            {avatarUrl ? "Trocar foto" : "Adicionar foto"}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-danger/25 bg-surface px-4 text-sm font-medium text-danger transition hover:bg-danger hover:text-white disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">JPG, PNG ou WEBP, até 8 MB.</p>
        {message && (
          <p className={`mt-1.5 text-sm ${message.ok ? "text-success" : "text-danger"}`} role="status">
            {message.text}
          </p>
        )}
        <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={onChange} />
      </div>
    </div>
  );
}
