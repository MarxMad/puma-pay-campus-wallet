-- Racha diaria: un premio de 50 puntos cada 24 horas por usuario.
-- last_claim_at define cuándo reclamó por última vez; no se puede reclamar de nuevo hasta 24h después.

create table if not exists user_streak (
  user_email text primary key,
  streak_days int not null default 0,
  last_claim_at timestamptz null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table user_streak is 'Racha diaria: premio de 50 pts cada 24h; last_claim_at controla el cooldown.';
comment on column user_streak.streak_days is 'Días consecutivos reclamando (se reinicia si pasan >48h sin reclamar).';
comment on column user_streak.last_claim_at is 'Última vez que el usuario reclamó los 50 pts; próximo reclamo permitido a last_claim_at + 24h.';

create index if not exists user_streak_last_claim_at_idx on user_streak(last_claim_at);

alter table user_streak enable row level security;

drop policy if exists "user_streak: read" on user_streak;
create policy "user_streak: read" on user_streak for select using (true);

drop policy if exists "user_streak: insert" on user_streak;
create policy "user_streak: insert" on user_streak for insert with check (true);

drop policy if exists "user_streak: update" on user_streak;
create policy "user_streak: update" on user_streak for update using (true);

-- Trigger updated_at
drop trigger if exists user_streak_updated_at on user_streak;
create trigger user_streak_updated_at
  before update on user_streak
  for each row execute function set_updated_at();
