import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const signature = req.headers['x-bitso-signature'];
  const payload = JSON.stringify(req.body);
  const webhookSecret = process.env.JUNO_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      return res.status(401).json({ error: 'Firma inválida' });
    }
  }
  // Aquí puedes procesar el evento como en tu archivo original
  res.status(200).json({ received: true, timestamp: new Date().toISOString() });
} 