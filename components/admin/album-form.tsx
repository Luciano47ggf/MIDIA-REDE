"use client";

import { Globe, Loader2, Lock } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { createAlbumAction, updateAlbumAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult, AlbumStatus, AlbumVisibility } from "@/types";
import { cn } from "@/utils/cn";
import { buildAlbumSlug } from "@/utils/slug";

export interface AlbumFormDefaults {
  id?: string;
  title: string;
  slug: string;
  event_date: string;
  description: string;
  status: AlbumStatus;
  visibility: AlbumVisibility;
  has_password: boolean;
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-sm text-danger">{error}</span> : hint ? <span className="mt-1.5 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

function Choice<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
            value === o.value ? "border-brand bg-brand/[0.05] ring-1 ring-brand" : "border-line bg-surface hover:border-ink/25",
          )}
        >
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-1 accent-[var(--brand)]" />
          <span>
            <span className="flex items-center gap-1.5 font-medium">
              {o.icon}
              {o.label}
            </span>
            <span className="mt-0.5 block text-sm text-muted">{o.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function AlbumForm({ defaults, submitLabel }: { defaults: AlbumFormDefaults; submitLabel: string }) {
  const isEdit = Boolean(defaults.id);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    isEdit ? updateAlbumAction : createAlbumAction,
    { ok: false },
  );

  const [title, setTitle] = useState(defaults.title);
  const [date, setDate] = useState(defaults.event_date);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [status, setStatus] = useState<AlbumStatus>(defaults.status);
  const [visibility, setVisibility] = useState<AlbumVisibility>(defaults.visibility);

  // Slug automático a partir do nome + data (até a pessoa editar manualmente)
  useEffect(() => {
    if (!slugTouched) setSlug(buildAlbumSlug(title, date));
  }, [title, date, slugTouched]);

  const errors = state.fieldErrors ?? {};
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");

  return (
    <form action={formAction} className="space-y-6">
      {defaults.id && <input type="hidden" name="albumId" value={defaults.id} />}

      <Field label="Nome do evento" error={errors.title}>
        <input name="title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Culto de Celebração" className={cn(inputClass, "h-12")} />
      </Field>

      <Field label="Data" error={errors.event_date}>
        <input name="event_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={cn(inputClass, "h-12")} />
      </Field>

      <Field label="Descrição (opcional)" error={errors.description}>
        <textarea name="description" rows={3} maxLength={2000} defaultValue={defaults.description} className={cn(inputClass, "resize-y py-3")} />
      </Field>

      <Field label="Endereço do álbum" error={errors.slug} hint={`${origin}/a/${slug || "..."}`}>
        <input
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
          }}
          className={cn(inputClass, "h-12 font-medium")}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Situação</span>
        <Choice
          name="status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "draft", label: "Rascunho", description: "Só a equipe vê. Bom para enviar os arquivos antes." },
            { value: "published", label: "Publicado", description: "Qualquer pessoa com o link pode ver." },
          ]}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Acesso</span>
        <Choice
          name="visibility"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "public", label: "Público", description: "Abre direto pelo link.", icon: <Globe className="h-4 w-4" /> },
            { value: "password", label: "Protegido por senha", description: "O visitante digita a senha antes de ver.", icon: <Lock className="h-4 w-4" /> },
          ]}
        />
        {visibility === "password" && (
          <div className="mt-3">
            <Field
              label={defaults.has_password ? "Nova senha (deixe em branco para manter a atual)" : "Senha do álbum"}
              error={errors.password}
              hint="A senha é guardada de forma criptografada."
            >
              <input name="password" type="text" autoComplete="off" minLength={4} className={cn(inputClass, "h-12")} />
            </Field>
          </div>
        )}
      </div>

      {state.message && (
        <p className={cn("rounded-xl px-4 py-3 text-sm", state.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger")} role="status">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
