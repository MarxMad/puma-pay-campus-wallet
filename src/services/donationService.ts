/**
 * Servicio de donaciones: registra cada donación en Supabase y aplica bonus de puntos cada 5 donaciones.
 * Los puntos bonus se guardan en user_course_progress (course_id = 'bonus-donaciones') para que el total
 * del usuario incluya cursos + donaciones.
 */

import { supabase } from '@/services/supabaseClient';
import { upsertCourseProgress } from '@/services/supabaseCourseProgress';
import { BONUS_POINTS_EVERY_5_DONATIONS } from '@/data/marketplace';

const BONUS_COURSE_ID = 'bonus-donaciones';

export interface RecordDonationResult {
  donationCount: number;
  bonusAwarded: number;
  totalBonusPoints: number;
}

/**
 * Registra una donación y, si el usuario completa un múltiplo de 5 donaciones, actualiza los puntos bonus en Supabase.
 * Devuelve cuántas donaciones lleva, si se otorgó bonus en esta y el total de puntos bonus.
 */
export async function recordDonation(
  userEmail: string,
  marketplaceItemId: string,
  amountXlm: number
): Promise<RecordDonationResult> {
  const { error: insertError } = await supabase.from('user_donations').insert({
    user_email: userEmail,
    marketplace_item_id: marketplaceItemId,
    amount_xlm: amountXlm,
  });

  if (insertError) {
    console.error('Error registrando donación:', insertError);
    throw insertError;
  }

  const count = await getDonationCount(userEmail);
  const totalBonusPoints = Math.floor(count / 5) * BONUS_POINTS_EVERY_5_DONATIONS;
  const previousBonus = Math.floor((count - 1) / 5) * BONUS_POINTS_EVERY_5_DONATIONS;
  const bonusAwarded = totalBonusPoints - previousBonus;

  if (bonusAwarded > 0) {
    await upsertCourseProgress({
      userEmail,
      courseId: BONUS_COURSE_ID,
      score: 0,
      passed: true,
      badgeLevel: 1,
      pointsEarned: totalBonusPoints,
    });
  }

  return {
    donationCount: count,
    bonusAwarded,
    totalBonusPoints,
  };
}

/**
 * Número total de donaciones realizadas por el usuario.
 */
export async function getDonationCount(userEmail: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_donations')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', userEmail);

  if (error) {
    console.error('Error contando donaciones:', error);
    return 0;
  }
  return count ?? 0;
}
