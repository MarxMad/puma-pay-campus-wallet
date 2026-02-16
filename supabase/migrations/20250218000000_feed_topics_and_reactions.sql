-- Temas del feed (Comida, Seguridad, Libros, Fiestas, General) y reacciones like/dislike

-- 1) Columna tema en publicaciones
alter table feed_posts
  add column if not exists topic text not null default 'general';

-- Asegurar valores válidos antes del constraint (por si ya había datos)
update feed_posts
set topic = 'general'
where topic is null or topic not in ('general', 'comida', 'seguridad', 'libros', 'fiestas');

-- Solo valores permitidos (drop si ya existe para re-añadir)
alter table feed_posts drop constraint if exists feed_posts_topic_check;
alter table feed_posts
  add constraint feed_posts_topic_check
  check (topic in ('general', 'comida', 'seguridad', 'libros', 'fiestas'));

-- Índice para filtrar por tema
create index if not exists feed_posts_topic_idx on feed_posts(topic);
create index if not exists feed_posts_topic_created_idx on feed_posts(topic, created_at desc);

-- 2) Tabla de reacciones (like/dislike) por post y usuario
create table if not exists feed_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_email text not null,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz default now(),
  unique(post_id, user_email)
);

create index if not exists feed_post_reactions_post_id_idx on feed_post_reactions(post_id);
create index if not exists feed_post_reactions_user_email_idx on feed_post_reactions(user_email);

-- RLS
alter table feed_post_reactions enable row level security;

drop policy if exists "Feed reactions: read" on feed_post_reactions;
create policy "Feed reactions: read" on feed_post_reactions for select using (true);

drop policy if exists "Feed reactions: insert" on feed_post_reactions;
create policy "Feed reactions: insert" on feed_post_reactions for insert with check (true);

drop policy if exists "Feed reactions: update" on feed_post_reactions;
create policy "Feed reactions: update" on feed_post_reactions for update using (true);

drop policy if exists "Feed reactions: delete" on feed_post_reactions;
create policy "Feed reactions: delete" on feed_post_reactions for delete using (true);

-- Nota: Si la columna topic ya existía sin constraint, el check puede fallar.
-- En ese caso ejecutar antes: update feed_posts set topic = 'general' where topic is null or topic not in ('general','comida','seguridad','libros','fiestas');
