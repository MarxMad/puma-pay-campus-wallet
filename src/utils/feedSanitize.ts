/**
 * Sanitización y validación para el Feed.
 * Protege contra XSS, inyección en filtros y contenido malicioso.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_MAX_LEN = 256;
const DISPLAY_NAME_MAX_LEN = 100;

/** Elimina etiquetas HTML y patrones peligrosos (javascript:, data:, etc.) */
function stripDangerousContent(input: string): string {
  let out = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:\s*text\/html/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<[^>]+>/g, '');
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitiza el contenido de un post o comentario.
 * Recorta a maxLength y elimina HTML/scripts.
 */
export function sanitizeContent(content: string, maxLength: number): string {
  if (typeof content !== 'string') return '';
  const stripped = stripDangerousContent(content);
  return stripped.slice(0, maxLength);
}

/**
 * Valida que sea un UUID válido (para post_id en filtros y llamadas).
 * Evita inyección en filtros de Supabase Realtime.
 */
export function isValidPostId(postId: string): boolean {
  return typeof postId === 'string' && UUID_REGEX.test(postId);
}

/**
 * Sanitiza email para evitar inyección o valores anómalos.
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  const trimmed = email.trim().slice(0, EMAIL_MAX_LEN);
  // Solo caracteres seguros para evitar inyección en queries
  return trimmed.replace(/[^\w@.\-+]/g, '');
}

/**
 * Sanitiza nombre para mostrar (sin HTML, longitud limitada).
 */
export function sanitizeDisplayName(name: string | null | undefined): string | null {
  if (name == null || typeof name !== 'string') return null;
  const stripped = stripDangerousContent(name).slice(0, DISPLAY_NAME_MAX_LEN);
  return stripped || null;
}
