-- Progreso de cursos/guías por usuario (puntajes y badges).
-- La app identifica usuarios por user_email (tabla usuarios / auth propia).
-- Los cursos (guías) se definen en el front; course_id = id de la guía (ej. economia-economia-1).

create table if not exists user_course_progress (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  course_id text not null,
  score smallint not null check (score >= 0 and score <= 100),
  passed boolean not null default false,
  badge_level smallint check (badge_level is null or badge_level in (1, 2, 3)),
  points_earned int not null default 0,
  completed_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_email, course_id)
);

create index if not exists user_course_progress_user_email_idx on user_course_progress(user_email);
create index if not exists user_course_progress_course_id_idx on user_course_progress(course_id);
create index if not exists user_course_progress_completed_at_idx on user_course_progress(completed_at desc);

comment on table user_course_progress is 'Puntaje y progreso por usuario y guía (cuestionario completado).';
comment on column user_course_progress.badge_level is '1=Bronce, 2=Plata, 3=Oro.';

-- RLS: permitir lectura e inserción con anon (el control real lo hace la app con usuario logueado).
alter table user_course_progress enable row level security;

drop policy if exists "user_course_progress: read" on user_course_progress;
create policy "user_course_progress: read" on user_course_progress for select using (true);

drop policy if exists "user_course_progress: insert" on user_course_progress;
create policy "user_course_progress: insert" on user_course_progress for insert with check (true);

drop policy if exists "user_course_progress: update" on user_course_progress;
create policy "user_course_progress: update" on user_course_progress for update using (true);

-- Trigger para actualizar updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_course_progress_updated_at on user_course_progress;
create trigger user_course_progress_updated_at
  before update on user_course_progress
  for each row execute function set_updated_at();
