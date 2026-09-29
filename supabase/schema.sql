-- ════════════════════════════════════════════════════════════════
-- Mídia Igreja — schema do banco (Supabase / PostgreSQL)
-- Cole TODO este arquivo no Supabase → SQL Editor → New query → Run.
-- Pode ser executado mais de uma vez sem quebrar (idempotente).
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── PROFILES ───────────────────────────────────────────────────
-- Cada usuário da equipe de mídia tem um perfil. Quem não tem perfil
-- não acessa nada do painel.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  avatar_key  text,  -- chave do objeto no Backblaze B2 (bucket privado); NUNCA uma URL, que expiraria
  role        text not null default 'editor' check (role in ('admin', 'editor')),
  created_at  timestamptz not null default now()
);

-- Para bancos criados antes deste campo existir.
alter table public.profiles add column if not exists avatar_key text;
-- Versão antiga (Cloudflare R2, bucket público) guardava uma URL nesta coluna; não existe mais.
alter table public.profiles drop column if exists avatar_url;

-- ─── ALBUMS ─────────────────────────────────────────────────────
create table if not exists public.albums (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) between 1 and 160),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text,
  event_date      date not null,
  cover_media_id  uuid,
  status          text not null default 'draft' check (status in ('draft', 'published')),
  visibility      text not null default 'public' check (visibility in ('public', 'password')),
  password_hash   text,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint password_required check (visibility = 'public' or password_hash is not null)
);

-- ─── MEDIA ──────────────────────────────────────────────────────
create table if not exists public.media (
  id                 uuid primary key,
  album_id           uuid not null references public.albums (id) on delete cascade,
  type               text not null check (type in ('photo', 'video')),
  original_filename  text not null,
  storage_key        text not null unique,   -- arquivo ORIGINAL no R2
  thumb_key          text,                   -- miniatura (grade)
  preview_key        text,                   -- visualização grande (lightbox) / pôster do vídeo
  mime_type          text not null,
  file_size          bigint not null check (file_size >= 0),
  width              integer,
  height             integer,
  duration           numeric(10, 2),
  sort_order         integer not null default 0,
  created_by         uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now()
);

-- Capa → media (criada depois porque as duas tabelas se referenciam)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'albums_cover_media_fk') then
    alter table public.albums
      add constraint albums_cover_media_fk
      foreign key (cover_media_id) references public.media (id) on delete set null;
  end if;
end $$;

-- ─── ÍNDICES ────────────────────────────────────────────────────
create index if not exists albums_status_date_idx on public.albums (status, event_date desc);
create index if not exists albums_created_idx     on public.albums (created_at desc);
create index if not exists media_album_order_idx  on public.media (album_id, sort_order, original_filename, id);
create index if not exists media_album_type_idx   on public.media (album_id, type);

-- ─── updated_at automático ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists albums_set_updated_at on public.albums;
create trigger albums_set_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

-- ─── Perfil criado automaticamente para cada novo usuário ───────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cria perfil para usuários que já existiam antes deste script
insert into public.profiles (id, email, name)
select u.id, u.email, split_part(u.email, '@', 1)
from auth.users u
on conflict (id) do nothing;

-- ─── Quem é da equipe? ──────────────────────────────────────────
create or replace function public.is_team_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- ─── SEGURANÇA (Row Level Security) ─────────────────────────────
-- Visitantes (anon) NÃO leem nada direto do banco.
-- As páginas públicas consultam o banco pelo servidor (Vercel),
-- que só entrega álbuns publicados e respeita a senha.
alter table public.profiles enable row level security;
alter table public.albums   enable row level security;
alter table public.media    enable row level security;

drop policy if exists "equipe lê perfis" on public.profiles;
create policy "equipe lê perfis" on public.profiles
  for select to authenticated using (public.is_team_member());

drop policy if exists "equipe gerencia álbuns" on public.albums;
create policy "equipe gerencia álbuns" on public.albums
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());

drop policy if exists "equipe gerencia mídia" on public.media;
create policy "equipe gerencia mídia" on public.media
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());

-- ─── VISÃO GERAL DOS ÁLBUNS (contagens + capa) ──────────────────
drop view if exists public.albums_overview;
create view public.albums_overview with (security_invoker = true) as
select
  a.id, a.title, a.slug, a.description, a.event_date, a.status, a.visibility,
  a.cover_media_id, a.created_by, a.created_at, a.updated_at,
  coalesce(c.photo_count, 0)::int  as photo_count,
  coalesce(c.video_count, 0)::int  as video_count,
  coalesce(c.total_bytes, 0)::bigint as total_bytes,
  cv.thumb_key   as cover_thumb_key,
  cv.preview_key as cover_preview_key
from public.albums a
left join lateral (
  select
    count(*) filter (where m.type = 'photo') as photo_count,
    count(*) filter (where m.type = 'video') as video_count,
    sum(m.file_size) as total_bytes
  from public.media m
  where m.album_id = a.id
) c on true
left join lateral (
  select m.thumb_key, m.preview_key
  from public.media m
  where m.album_id = a.id
    and (m.id = a.cover_media_id or (a.cover_media_id is null and m.type = 'photo'))
    and m.thumb_key is not null
  order by (m.id = a.cover_media_id) desc, m.sort_order, m.original_filename
  limit 1
) cv on true;

-- ─── ESTATÍSTICAS DO DASHBOARD ──────────────────────────────────
create or replace function public.dashboard_stats()
returns json language sql stable security invoker set search_path = '' as $$
  select json_build_object(
    'albums', (select count(*) from public.albums),
    'photos', (select count(*) from public.media where type = 'photo'),
    'videos', (select count(*) from public.media where type = 'video'),
    'bytes',  (select coalesce(sum(file_size), 0) from public.media)
  );
$$;

grant execute on function public.dashboard_stats() to authenticated;
grant select on public.albums_overview to authenticated, service_role;
