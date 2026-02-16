-- Verificación de correo: nuevos usuarios deben confirmar email vía Supabase Auth.
-- La app sigue usando la tabla usuarios para wallet y perfil; email_verified se sincroniza
-- cuando el usuario confirma el enlace enviado por Supabase.

alter table if exists usuarios
  add column if not exists email_verified boolean not null default true;

comment on column usuarios.email_verified is 'Sincronizado con Supabase Auth: true cuando el usuario ha confirmado el correo (o usuario legacy).';
