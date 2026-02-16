-- Vista para leaderboard: puntos totales por usuario (suma de points_earned en user_course_progress).
-- La app consulta esta vista con ORDER BY total_points DESC LIMIT 50.

create or replace view campus_leaderboard as
select
  user_email,
  coalesce(sum(points_earned), 0)::bigint as total_points
from user_course_progress
group by user_email;

comment on view campus_leaderboard is 'Puntos totales por usuario para el ranking del campus (top 50 en Home).';

-- Permitir lectura a anon y authenticated (leaderboard público).
grant select on campus_leaderboard to anon;
grant select on campus_leaderboard to authenticated;
