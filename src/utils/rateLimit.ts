/**
 * Rate limit en cliente (throttling) para reducir abuso.
 * No sustituye un rate limit en backend; solo disuade scripts triviales y mejora UX.
 */

const lastCall: Record<string, number> = {};
const MIN_MS_POST = 15_000;   // 1 publicación cada 15 s
const MIN_MS_COMMENT = 5_000; // 1 comentario cada 5 s
const MIN_MS_SEND = 10_000;   // 1 envío XLM cada 10 s

function check(key: string, minMs: number): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const last = lastCall[key] ?? 0;
  const elapsed = now - last;
  if (elapsed >= minMs || last === 0) {
    lastCall[key] = now;
    return { allowed: true };
  }
  return { allowed: false, retryAfterMs: minMs - elapsed };
}

export const rateLimit = {
  /** Para crear publicación en el Feed. Máximo 1 cada 15 s por cliente. */
  post(key: string = 'feed_post'): { allowed: boolean; retryAfterMs?: number } {
    return check(key, MIN_MS_POST);
  },

  /** Para crear comentario. Máximo 1 cada 5 s por cliente. */
  comment(key: string = 'feed_comment'): { allowed: boolean; retryAfterMs?: number } {
    return check(key, MIN_MS_COMMENT);
  },

  /** Para envío de XLM. Máximo 1 cada 10 s por cliente. */
  send(key: string = 'stellar_send'): { allowed: boolean; retryAfterMs?: number } {
    return check(key, MIN_MS_SEND);
  },
};
