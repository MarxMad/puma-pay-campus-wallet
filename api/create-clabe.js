import axios from 'axios';
import { buildJunoAuthHeader } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    const method = 'POST';
    const path = '/mint_platform/v1/clabes';
    const body = '{}';
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path, body);
    const response = await axios.post(
      'https://stage.buildwithjuno.com/mint_platform/v1/clabes',
      {},
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