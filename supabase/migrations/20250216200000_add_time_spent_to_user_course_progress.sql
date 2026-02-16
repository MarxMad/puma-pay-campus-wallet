-- Añadir tiempo empleado en completar el cuestionario (cronómetro, en segundos).
-- Útil para leaderboard por puntos y por tiempo.

alter table user_course_progress
  add column if not exists time_spent_seconds int null;

comment on column user_course_progress.time_spent_seconds is 'Tiempo en segundos que tardó el usuario en completar el cuestionario (cronómetro).';

-- Índice para ordenar leaderboard por tiempo (opcional: "quién lo resolvió más rápido")
create index if not exists user_course_progress_time_spent_seconds_idx
  on user_course_progress(time_spent_seconds asc)
  where time_spent_seconds is not null;
