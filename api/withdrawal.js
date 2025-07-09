import axios from 'axios';
import { buildJunoAuthHeader } from './_utils.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { address, amount, asset, blockchain, compliance } = req.body;
  if (!address || !amount || !asset || !blockchain || compliance === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (address, amount, asset, blockchain, compliance).' });
  }
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    const method = 'POST';
    const path = '/mint_platform/v1/withdrawals';
    const requestBody = {
      address,
      amount: String(amount),
      asset,
      blockchain,
      compliance: compliance || {}
    };
    const body = JSON.stringify(requestBody);
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path, body);
    const idempotencyKey = uuidv4();
    const response = await axios.post(
      'https://stage.buildwithjuno.com/mint_platform/v1/withdrawals',
      requestBody,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        timeout: 30000
      }
    );
    res.status(200).json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        idempotency_key: idempotencyKey,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} 