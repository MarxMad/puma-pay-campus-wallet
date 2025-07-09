import axios from 'axios';
import { buildJunoAuthHeader } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { tag, recipient_legal_name, clabe, ownership } = req.body;
  if (!tag || !recipient_legal_name || !clabe || !ownership) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (tag, recipient_legal_name, clabe, ownership).' });
  }
  if (!/^\d{18}$/.test(clabe)) {
    return res.status(400).json({ error: 'La CLABE debe tener exactamente 18 dígitos.' });
  }
  const validOwnerships = ['COMPANY_OWNED', 'THIRD_PARTY'];
  if (!validOwnerships.includes(ownership)) {
    return res.status(400).json({ error: `Ownership debe ser uno de: ${validOwnerships.join(', ')}` });
  }
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    const method = 'POST';
    const path = '/mint_platform/v1/accounts/banks';
    const requestBody = {
      tag,
      recipient_legal_name,
      clabe,
      ownership
    };
    const body = JSON.stringify(requestBody);
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path, body);
    const response = await axios.post(
      'https://stage.buildwithjuno.com/mint_platform/v1/accounts/banks',
      requestBody,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    res.status(200).json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} 