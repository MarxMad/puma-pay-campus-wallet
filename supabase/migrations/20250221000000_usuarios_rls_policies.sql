-- RLS para tabla usuarios: la app usa esta tabla para registro e inicio de sesión
-- (sin Supabase Auth). Sin políticas, INSERT (signup) y SELECT (login) fallan.

alter table if exists usuarios enable row level security;

drop policy if exists "usuarios: allow select for login" on usuarios;
create policy "usuarios: allow select for login" on usuarios
  for select using (true);

drop policy if exists "usuarios: allow insert for signup" on usuarios;
create policy "usuarios: allow insert for signup" on usuarios
  for insert with check (true);

comment on table usuarios is 'Usuarios de la app (auth propia con bcrypt). RLS permite signup e login desde cliente.';
