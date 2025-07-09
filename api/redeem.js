import axios from 'axios';
import { buildJunoAuthHeader } from './_utils';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { amount, destination_bank_account_id } = req.body;
  if (!amount || !destination_bank_account_id) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (amount, destination_bank_account_id).' });
  }
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 100) {
    return res.status(400).json({ error: 'El monto debe ser un número válido mayor o igual a 100 MXNB.' });
  }
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    const method = 'POST';
    const path = '/mint_platform/v1/redemptions';
    const requestBody = {
      amount: numericAmount,
      destination_bank_account_id,
      asset: 'mxn'
    };
    const body = JSON.stringify(requestBody);
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path, body);
    const idempotencyKey = uuidv4();
    const response = await axios.post(
      'https://stage.buildwithjuno.com/mint_platform/v1/redemptions',
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