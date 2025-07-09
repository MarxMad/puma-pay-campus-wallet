import crypto from 'crypto';

export function buildJunoAuthHeader(apiKey, apiSecret, method, path, body = '') {
  const nonce = Date.now().toString();
  const data = `${nonce}${method}${path}${body}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
  return `Bitso ${apiKey}:${nonce}:${signature}`;
} 