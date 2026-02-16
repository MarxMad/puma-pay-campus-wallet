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
