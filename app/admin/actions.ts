"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeamUser } from "@/lib/auth";
import { deleteKeys, deletePrefix, keyFromPublicUrl, publicUrl, putPublicObject } from "@/lib/r2";
import { albumPrefix, avatarKey, UUID_RE } from "@/lib/storage-keys";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, AlbumStatus, AlbumVisibility } from "@/types";
import { SLUG_PATTERN } from "@/utils/slug";

// ─── Formulário do álbum ────────────────────────────────────────

interface AlbumFormValues {
  title: string;
  slug: string;
  event_date: string;
  description: string | null;
  status: AlbumStatus;
  visibility: AlbumVisibility;
  password: string;
}

function readAlbumForm(formData: FormData): { values: AlbumFormValues; errors: Record<string, string> } {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const values: AlbumFormValues = {
    title: str("title"),
    slug: str("slug").toLowerCase(),
    event_date: str("event_date"),
    description: str("description") || null,
    status: str("status") === "published" ? "published" : "draft",
    visibility: str("visibility") === "password" ? "password" : "public",
    password: String(formData.get("password") ?? ""),
  };
  const errors: Record<string, string> = {};
  if (!values.title) errors.title = "Informe o nome do evento.";
  else if (values.title.length > 160) errors.title = "Nome muito longo (máximo 160 caracteres).";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.event_date)) errors.event_date = "Informe a data do evento.";
  if (!values.slug) errors.slug = "Informe o endereço do álbum.";
  else if (!SLUG_PATTERN.test(values.slug) || values.slug.length > 100)
    errors.slug = "Use apenas letras minúsculas, números e hífens (ex.: culto-27-09-2026).";
  if (values.description && values.description.length > 2000) errors.description = "Descrição muito longa.";
  if (values.password && values.password.length < 4) errors.password = "A senha precisa ter pelo menos 4 caracteres.";
  return { values, errors };
}

function revalidateAlbum(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  if (slug) revalidatePath(`/a/${slug}`);
}

export async function createAlbumAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const profile = await requireTeamUser();
  const { values, errors } = readAlbumForm(formData);
  if (values.visibility === "password" && !values.password) errors.password = "Defina uma senha para o álbum.";
  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors, message: "Confira os campos destacados." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .insert({
      title: values.title,
      slug: values.slug,
      event_date: values.event_date,
      description: values.description,
      status: values.status,
      visibility: values.visibility,
      password_hash: values.visibility === "password" ? await bcrypt.hash(values.password, 10) : null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, fieldErrors: { slug: "Esse endereço já está em uso por outro álbum." }, message: "Escolha outro endereço." };
    }
    return { ok: false, message: "Não foi possível criar o álbum. Tente novamente." };
  }

  revalidateAlbum(values.slug);
  redirect(`/admin/albuns/${data.id}?novo=1`);
}

export async function updateAlbumAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireTeamUser();
  const albumId = String(formData.get("albumId") ?? "");
  if (!UUID_RE.test(albumId)) return { ok: false, message: "Álbum inválido." };

  const { values, errors } = readAlbumForm(formData);
  const supabase = await createClient();
  const { data: current } = await supabase.from("albums").select("slug, password_hash").eq("id", albumId).maybeSingle();
  if (!current) return { ok: false, message: "Álbum não encontrado." };

  if (values.visibility === "password" && !values.password && !current.password_hash) {
    errors.password = "Defina uma senha para o álbum.";
  }
  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors, message: "Confira os campos destacados." };

  let password_hash: string | null = null;
  if (values.visibility === "password") {
    password_hash = values.password ? await bcrypt.hash(values.password, 10) : current.password_hash;
  }

  const { error } = await supabase
    .from("albums")
    .update({
      title: values.title,
      slug: values.slug,
      event_date: values.event_date,
      description: values.description,
      status: values.status,
      visibility: values.visibility,
      password_hash,
    })
    .eq("id", albumId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { slug: "Esse endereço já está em uso por outro álbum." }, message: "Escolha outro endereço." };
    }
    return { ok: false, message: "Não foi possível salvar. Tente novamente." };
  }

  revalidateAlbum(current.slug);
  revalidateAlbum(values.slug);
  return { ok: true, message: "Alterações salvas." };
}

export async function setAlbumStatusAction(albumId: string, status: AlbumStatus): Promise<ActionResult> {
  await requireTeamUser();
  if (!UUID_RE.test(albumId)) return { ok: false, message: "Álbum inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("albums").update({ status }).eq("id", albumId).select("slug").maybeSingle();
  if (error || !data) return { ok: false, message: "Não foi possível alterar o status." };
  revalidateAlbum(data.slug);
  return { ok: true, message: status === "published" ? "Álbum publicado." : "Álbum voltou para rascunho." };
}

export async function setCoverAction(albumId: string, mediaId: string): Promise<ActionResult> {
  await requireTeamUser();
  if (!UUID_RE.test(albumId) || !UUID_RE.test(mediaId)) return { ok: false, message: "Dados inválidos." };
  const supabase = await createClient();
  const { data: media } = await supabase.from("media").select("id").eq("id", mediaId).eq("album_id", albumId).maybeSingle();
  if (!media) return { ok: false, message: "Arquivo não encontrado neste álbum." };
  const { data, error } = await supabase.from("albums").update({ cover_media_id: mediaId }).eq("id", albumId).select("slug").maybeSingle();
  if (error || !data) return { ok: false, message: "Não foi possível definir a capa." };
  revalidateAlbum(data.slug);
  return { ok: true, message: "Capa definida." };
}

export async function deleteMediaAction(mediaIds: string[]): Promise<ActionResult> {
  await requireTeamUser();
  const ids = mediaIds.filter((id) => UUID_RE.test(id)).slice(0, 500);
  if (!ids.length) return { ok: false, message: "Nenhum arquivo selecionado." };
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("media")
    .delete()
    .in("id", ids)
    .select("storage_key, thumb_key, preview_key, album_id");
  if (error) return { ok: false, message: "Não foi possível excluir. Tente novamente." };

  const keys = (rows ?? []).flatMap((r) => [r.storage_key, r.thumb_key ?? "", r.preview_key ?? ""]);
  try {
    await deleteKeys(keys);
  } catch {
    // Os registros já saíram do álbum; os arquivos restantes no R2 não aparecem para ninguém.
  }
  const albumId = rows?.[0]?.album_id;
  if (albumId) {
    const { data: album } = await supabase.from("albums").select("slug").eq("id", albumId).maybeSingle();
    revalidateAlbum(album?.slug);
  }
  const n = rows?.length ?? 0;
  return { ok: true, message: n === 1 ? "Arquivo excluído." : `${n} arquivos excluídos.` };
}

export async function deleteAlbumAction(albumId: string): Promise<ActionResult> {
  await requireTeamUser();
  if (!UUID_RE.test(albumId)) return { ok: false, message: "Álbum inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("albums").delete().eq("id", albumId).select("slug").maybeSingle();
  if (error || !data) return { ok: false, message: "Não foi possível excluir o álbum." };

  try {
    await deletePrefix(albumPrefix(albumId));
  } catch {
    revalidateAlbum(data.slug);
    return { ok: true, message: "Álbum excluído, mas alguns arquivos não foram removidos do R2." };
  }
  revalidateAlbum(data.slug);
  return { ok: true, message: "Álbum excluído." };
}

// ─── Foto de perfil ─────────────────────────────────────────────

const AVATAR_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_AVATAR_BYTES = 8 * 1024 * 1024; // 8 MB

export async function updateAvatarAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireTeamUser();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Selecione uma foto." };

  const ext = AVATAR_MIME_EXT[file.type];
  if (!ext) return { ok: false, message: "Formato não aceito. Envie uma foto em JPG, PNG ou WEBP." };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, message: "Foto muito grande (máximo 8 MB)." };

  const key = avatarKey(profile.id, ext);
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    await putPublicObject(key, bytes, file.type);
  } catch {
    return { ok: false, message: "Não foi possível enviar a foto. Tente novamente." };
  }

  const url = publicUrl(key);
  // Sem policy de UPDATE para a pessoa alterar o próprio perfil; usamos a service role
  // aqui dentro, já autenticados por requireTeamUser(), só para esta coluna.
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
  if (error) {
    await deleteKeys([key]).catch(() => {});
    return { ok: false, message: "Não foi possível salvar a foto. Tente novamente." };
  }

  const oldKey = profile.avatar_url ? keyFromPublicUrl(profile.avatar_url) : null;
  if (oldKey) await deleteKeys([oldKey]).catch(() => {});

  revalidatePath("/admin", "layout");
  return { ok: true, message: "Foto de perfil atualizada." };
}

export async function removeAvatarAction(): Promise<ActionResult> {
  const profile = await requireTeamUser();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ avatar_url: null }).eq("id", profile.id);
  if (error) return { ok: false, message: "Não foi possível remover a foto." };

  const oldKey = profile.avatar_url ? keyFromPublicUrl(profile.avatar_url) : null;
  if (oldKey) await deleteKeys([oldKey]).catch(() => {});

  revalidatePath("/admin", "layout");
  return { ok: true, message: "Foto de perfil removida." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
