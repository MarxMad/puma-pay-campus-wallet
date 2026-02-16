/**
 * Persistencia del progreso de cursos/guías en Supabase (tabla user_course_progress).
 * Se usa para leaderboard y sincronización entre dispositivos.
 */

import { supabase } from '@/services/supabaseClient';

export interface UpsertProgressParams {
  userEmail: string;
  courseId: string;
  score: number;
  passed: boolean;
  badgeLevel: 1 | 2 | 3;
  pointsEarned: number;
  timeSpentSeconds?: number;
}

/**
 * Inserta o actualiza el progreso de un usuario en un curso.
 * La tabla tiene unique(user_email, course_id), así que un segundo intento actualiza la fila.
 */
export async function upsertCourseProgress(params: UpsertProgressParams): Promise<void> {
  const {
    userEmail,
    courseId,
    score,
    passed,
    badgeLevel,
    pointsEarned,
    timeSpentSeconds,
  } = params;

  const row = {
    user_email: userEmail,
    course_id: courseId,
    score,
    passed,
    badge_level: badgeLevel,
    points_earned: pointsEarned,
    completed_at: new Date().toISOString(),
    time_spent_seconds: timeSpentSeconds ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_course_progress')
    .upsert(row, {
      onConflict: 'user_email,course_id',
    });

  if (error) {
    console.error('Error guardando progreso en Supabase:', error);
    throw error;
  }
}

/** Badge real desde Supabase (user_course_progress con badge_level) */
export interface UserBadgeFromSupabase {
  course_id: string;
  badge_level: 1 | 2 | 3;
  score: number;
  points_earned: number;
  completed_at: string;
}

/**
 * Obtiene los badges/insignias reales del usuario desde Supabase.
 * Solo filas donde passed = true y badge_level no es null.
 */
export async function getBadgesFromSupabase(userEmail: string): Promise<UserBadgeFromSupabase[]> {
  const { data, error } = await supabase
    .from('user_course_progress')
    .select('course_id, badge_level, score, points_earned, completed_at')
    .eq('user_email', userEmail)
    .not('badge_level', 'is', null)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo badges desde Supabase:', error);
    return [];
  }

  return (data || []).map((row) => ({
    course_id: row.course_id,
    badge_level: (row.badge_level ?? 1) as 1 | 2 | 3,
    score: row.score ?? 0,
    points_earned: row.points_earned ?? 0,
    completed_at: row.completed_at ?? '',
  }));
}

/** Entrada del leaderboard (top por puntos) */
export interface LeaderboardEntry {
  user_email: string;
  total_points: number;
}

/**
 * Obtiene el top 50 del campus por puntos totales (desde Supabase).
 * user_email se puede enmascarar en la UI para privacidad.
 */
export async function getLeaderboardTop50(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('campus_leaderboard')
    .select('user_email, total_points')
    .order('total_points', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error obteniendo leaderboard:', error);
    return [];
  }

  return (data || []).map((row) => ({
    user_email: row.user_email ?? '',
    total_points: Number(row.total_points) || 0,
  }));
}
