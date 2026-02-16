-- Feed: publicaciones y comentarios (chat en vivo)
-- La app usa autenticación propia (tabla usuarios), no Supabase Auth.
-- Identificamos autor por user_email y user_display_name.

-- Publicaciones del feed
create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_display_name text,
  content text not null,
  created_at timestamptz default now()
);

-- Comentarios por post (chat en vivo por publicación)
create table if not exists feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_email text not null,
  user_display_name text,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists feed_comments_post_id_idx on feed_comments(post_id);
create index if not exists feed_posts_created_at_idx on feed_posts(created_at desc);

-- RLS: permitir lectura e inserción con anon (la app solo muestra Feed a usuarios logueados)
alter table feed_posts enable row level security;
alter table feed_comments enable row level security;

drop policy if exists "Feed posts: read" on feed_posts;
create policy "Feed posts: read" on feed_posts for select using (true);

drop policy if exists "Feed posts: insert" on feed_posts;
create policy "Feed posts: insert" on feed_posts for insert with check (true);

drop policy if exists "Feed comments: read" on feed_comments;
create policy "Feed comments: read" on feed_comments for select using (true);

drop policy if exists "Feed comments: insert" on feed_comments;
create policy "Feed comments: insert" on feed_comments for insert with check (true);

-- Habilitar Realtime para estas tablas (publicación supabase_realtime)
-- En Supabase Dashboard: Database → Realtime → añadir feed_posts y feed_comments a la publicación.
-- O ejecutar (requiere superuser en algunos proyectos):
-- alter publication supabase_realtime add table feed_posts;
-- alter publication supabase_realtime add table feed_comments;
