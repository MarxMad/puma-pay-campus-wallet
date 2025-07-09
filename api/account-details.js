import axios from 'axios';
import { buildJunoAuthHeader } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    const method = 'GET';
    const path = '/spei/v1/clabes?clabe_type=AUTO_PAYMENT';
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path);

    const response = await axios.get(
      `https://stage.buildwithjuno.com${path}`,
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