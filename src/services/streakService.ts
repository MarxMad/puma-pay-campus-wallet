/**
 * Racha diaria: premio de 50 puntos cada 24 horas.
 * Se guarda en Supabase (user_streak) y los puntos se suman vía user_course_progress.
 */

import { supabase } from './supabaseClient';

const STREAK_TABLE = 'user_streak';
const REWARD_POINTS = 50;
const COOLDOWN_HOURS = 24;
const STREAK_BREAK_HOURS = 48; // Si no reclama en 48h, la racha se reinicia a 1

export interface StreakData {
  streakDays: number;
  lastClaimAt: string | null;
  canClaim: boolean;
  nextClaimAt: Date | null;
  rewardPoints: number;
}

/**
 * Obtiene la racha del usuario y si puede reclamar (han pasado ≥24h desde last_claim_at).
 */
export async function getStreak(userEmail: string): Promise<StreakData> {
  const { data, error } = await supabase
    .from(STREAK_TABLE)
    .select('streak_days, last_claim_at')
    .eq('user_email', userEmail)
    .maybeSingle();

  if (error) {
    console.error('Error obteniendo racha:', error);
    return {
      streakDays: 0,
      lastClaimAt: null,
      canClaim: true,
      nextClaimAt: null,
      rewardPoints: REWARD_POINTS,
    };
  }

  const lastClaimAt = data?.last_claim_at ?? null;
  const streakDays = data?.streak_days ?? 0;
  const now = new Date();
  let canClaim = true;
  let nextClaimAt: Date | null = null;

  if (lastClaimAt) {
    const last = new Date(lastClaimAt);
    const diffMs = now.getTime() - last.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < COOLDOWN_HOURS) {
      canClaim = false;
      nextClaimAt = new Date(last.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
    }
  }

  return {
    streakDays,
    lastClaimAt,
    canClaim,
    nextClaimAt,
    rewardPoints: REWARD_POINTS,
  };
}

export interface ClaimResult {
  success: boolean;
  streakDays: number;
  pointsAwarded: number;
  nextClaimAt: Date | null;
  error?: string;
}

/**
 * Reclama el premio de 50 pts si ya pasaron 24h.
 * - Inserta 50 pts en user_course_progress (course_id único por reclamo para que sume en leaderboard).
 * - Actualiza user_streak: last_claim_at = now, streak_days + 1 (o 1 si llevaba >48h sin reclamar).
 */
export async function claimStreakReward(userEmail: string): Promise<ClaimResult> {
  const { data: row, error: fetchError } = await supabase
    .from(STREAK_TABLE)
    .select('streak_days, last_claim_at')
    .eq('user_email', userEmail)
    .maybeSingle();

  if (fetchError) {
    console.error('Error leyendo racha:', fetchError);
    return { success: false, streakDays: 0, pointsAwarded: 0, nextClaimAt: null, error: fetchError.message };
  }

  const now = new Date();
  const lastClaimAt = row?.last_claim_at ? new Date(row.last_claim_at) : null;
  const currentStreak = row?.streak_days ?? 0;

  const diffHours = lastClaimAt
    ? (now.getTime() - lastClaimAt.getTime()) / (1000 * 60 * 60)
    : Infinity;

  if (diffHours < COOLDOWN_HOURS) {
    const nextAt = lastClaimAt ? new Date(lastClaimAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000) : null;
    return {
      success: false,
      streakDays: currentStreak,
      pointsAwarded: 0,
      nextClaimAt: nextAt,
      error: 'Debes esperar 24 horas entre cada reclamo.',
    };
  }

  // Calcular nueva racha: si pasaron >48h sin reclamar, reiniciar a 1; si no, +1
  const newStreak = diffHours >= STREAK_BREAK_HOURS ? 1 : currentStreak + 1;

  // Insertar 50 pts en user_course_progress (course_id único para que cuente en leaderboard)
  const streakCourseId = `streak-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}-${now.getTime()}`;
  const { error: insertError } = await supabase.from('user_course_progress').insert({
    user_email: userEmail,
    course_id: streakCourseId,
    score: 0,
    passed: true,
    badge_level: null,
    points_earned: REWARD_POINTS,
    completed_at: now.toISOString(),
  });

  if (insertError) {
    console.error('Error insertando puntos de racha:', insertError);
    return { success: false, streakDays: currentStreak, pointsAwarded: 0, nextClaimAt: null, error: insertError.message };
  }

  // Upsert user_streak
  const { error: upsertError } = await supabase.from(STREAK_TABLE).upsert(
    {
      user_email: userEmail,
      streak_days: newStreak,
      last_claim_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_email' }
  );

  if (upsertError) {
    console.error('Error actualizando racha:', upsertError);
    // Los puntos ya se dieron; la racha podría no actualizarse hasta el próximo reclamo
  }

  const nextClaimAt = new Date(now.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
  return {
    success: true,
    streakDays: newStreak,
    pointsAwarded: REWARD_POINTS,
    nextClaimAt,
  };
}
