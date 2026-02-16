-- Registro de donaciones por usuario para contabilizar y dar bonus cada 5 donaciones.
-- Los puntos bonus se guardan en user_course_progress con course_id = 'bonus-donaciones'.

create table if not exists user_donations (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  marketplace_item_id text not null,
  amount_xlm numeric(20, 7) not null check (amount_xlm > 0),
  created_at timestamptz default now()
);

create index if not exists user_donations_user_email_idx on user_donations(user_email);
create index if not exists user_donations_created_at_idx on user_donations(created_at desc);

comment on table user_donations is 'Cada donación del usuario en el marketplace. Sirve para bonus cada 5 donaciones y para historial.';

alter table user_donations enable row level security;

drop policy if exists "user_donations: read" on user_donations;
create policy "user_donations: read" on user_donations for select using (true);

drop policy if exists "user_donations: insert" on user_donations;
create policy "user_donations: insert" on user_donations for insert with check (true);
