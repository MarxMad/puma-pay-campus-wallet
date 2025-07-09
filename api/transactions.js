import axios from 'axios';
import { buildJunoAuthHeader } from './_utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { limit = 50, offset = 0, status, type } = req.query;
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (status) queryParams.append('status', status);
    if (type) queryParams.append('type', type);
    const method = 'GET';
    const path = `/mint_platform/v1/transactions?${queryParams.toString()}`;
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
      metadata: {
        timestamp: new Date().toISOString(),
        query_params: Object.fromEntries(queryParams)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} 