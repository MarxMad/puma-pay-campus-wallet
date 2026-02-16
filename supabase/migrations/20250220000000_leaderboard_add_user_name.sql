-- Leaderboard: mostrar nombre del usuario (desde usuarios) en lugar de solo email.
-- DROP + CREATE evita el error de "cannot change name of view column" al añadir user_name.

drop view if exists campus_leaderboard;

create view campus_leaderboard as
select
  ucp.user_email,
  coalesce(u.nombre, ucp.user_email) as user_name,
  coalesce(sum(ucp.points_earned), 0)::bigint as total_points
from user_course_progress ucp
left join usuarios u on u.email = ucp.user_email
group by ucp.user_email, u.nombre;

comment on view campus_leaderboard is 'Puntos totales por usuario para el ranking del campus (top 50). Incluye user_name desde usuarios.';

grant select on campus_leaderboard to anon;
grant select on campus_leaderboard to authenticated;
