const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const bitsoWebhook = require('./bitso-webhook');

const execAsync = promisify(exec);

// Portal API Configuration
const PORTAL_API_BASE_URL = 'https://api.portalhq.io/api/v1';

/**
 * Construir header de autenticación para Juno API
 * @param {string} apiKey - API Key de Juno
 * @param {string} apiSecret - Secret Key de Juno
 * @param {string} method - Método HTTP (GET, POST, etc.)
 * @param {string} path - Path del endpoint
 * @param {string} body - Cuerpo de la petición (JSON string)
 * @returns {string} Header de autorización
 */
function buildJunoAuthHeader(apiKey, apiSecret, method, path, body = '') {
  const nonce = Date.now().toString();
  const data = `${nonce}${method}${path}${body}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
  return `Bitso ${apiKey}:${nonce}:${signature}`;
}

const app = express();

// Configurar CORS para producción
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080', // Agregado para desarrollo
    'https://pumapay-campus.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use('/api', bitsoWebhook);

// ================================
// ENDPOINTS DE ISSUANCE (MINTEO)
// ================================

/**
 * Obtener detalles de cuenta (CLABEs) para depósitos
 * Endpoint: GET /api/account-details
 */
app.get('/api/account-details', async (req, res) => {
  console.log('📥 Endpoint /api/account-details llamado');
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    
    if (!apiKey || !apiSecret) {
      console.log('❌ Faltan credenciales de API');
      return res.status(500).json({ 
        success: false,
        error: { message: 'Credenciales de API no configuradas.' }
      });
    }
    
    const method = 'GET';
    const path = '/spei/v1/clabes?clabe_type=AUTO_PAYMENT';
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path);
    
    console.log('🔄 Consultando CLABEs AUTO_PAYMENT en Juno...');
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
    
    console.log('✅ CLABEs obtenidas exitosamente:', response.data);
    
    res.json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/account-details:', error);
    
    if (error.response) {
      const junoError = error.response.data;
      res.status(error.response.status).json({
        success: false,
        error: {
          message: junoError.message || 'Error al obtener detalles de cuenta',
          code: junoError.code || error.response.status,
          details: junoError
        }
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        success: false,
        error: { message: 'Timeout en la petición a Juno. Intenta nuevamente.' }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con el servicio de cuentas.' }
      });
    }
  }
});

/**
 * Crear depósito mock para testing (solo en stage)
 * Endpoint: POST /api/mock-deposit
 */
app.post('/api/mock-deposit', async (req, res) => {
  const { amount, receiver_clabe, receiver_name, sender_name } = req.body;
  if (!amount || !receiver_clabe || !receiver_name || !sender_name) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
  }
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    const method = 'POST';
    const path = '/spei/test/deposits';
    const body = JSON.stringify({
      amount: String(amount),
      receiver_clabe,
      receiver_name,
      sender_name
    });
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path, body);
    const response = await axios.post(
      'https://stage.buildwithjuno.com/spei/test/deposits',
      JSON.parse(body),
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error en /api/mock-deposit:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

/**
 * Crear una CLABE única para un usuario
 * Endpoint: POST /api/create-clabe
 */
app.post('/api/create-clabe', async (req, res) => {
  console.log('📥 Endpoint /api/create-clabe llamado');
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        error: { message: 'Credenciales de API no configuradas.' }
      });
    }
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
    console.log('✅ CLABE creada exitosamente:', response.data);
    res.json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error en /api/create-clabe:', error);
    if (error.response) {
      const junoError = error.response.data;
      res.status(error.response.status).json({
        success: false,
        error: {
          message: junoError.message || 'Error al crear CLABE',
          code: junoError.code || error.response.status,
          details: junoError
        }
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        success: false,
        error: { message: 'Timeout en la petición a Juno. Intenta nuevamente.' }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con el servicio de CLABEs.' }
      });
    }
  }
});

// ================================
// ENDPOINTS DE BALANCE Y TRANSACCIONES
// ================================

/**
 * Obtener balance de MXNB
 * Endpoint: GET /api/balance
 */
app.get('/api/balance', async (req, res) => {
  console.log('📥 Endpoint /api/balance llamado');
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    
    if (!apiKey || !apiSecret) {
      console.log('❌ Faltan credenciales de API');
      return res.status(500).json({ 
        success: false,
        error: { message: 'Credenciales de API no configuradas.' }
      });
    }
    
    const method = 'GET';
    const path = '/mint_platform/v1/balances';
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path);
    
    console.log('🔄 Consultando balance en Juno...');
    const response = await axios.get(
      'https://stage.buildwithjuno.com/mint_platform/v1/balances',
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Balance obtenido exitosamente:', response.data);
    
    res.json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/balance:', error);
    
    if (error.response) {
      const junoError = error.response.data;
      res.status(error.response.status).json({
        success: false,
        error: {
          message: junoError.message || 'Error al obtener balance',
          code: junoError.code || error.response.status,
          details: junoError
        }
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        success: false,
        error: { message: 'Timeout en la petición a Juno. Intenta nuevamente.' }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con el servicio de balance.' }
      });
    }
  }
});

/**
 * Obtener historial de transacciones
 * Endpoint: GET /api/transactions
 */
app.get('/api/transactions', async (req, res) => {
  console.log('📥 Endpoint /api/transactions llamado');
  
  // Parámetros de consulta opcionales
  const { limit = 50, offset = 0, status, type } = req.query;
  
  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    
    if (!apiKey || !apiSecret) {
      console.log('❌ Faltan credenciales de API');
      return res.status(500).json({ 
        success: false,
        error: { message: 'Credenciales de API no configuradas.' }
      });
    }
    
    // Construir query string
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (status) queryParams.append('status', status);
    if (type) queryParams.append('type', type);
    
    const method = 'GET';
    const path = `/mint_platform/v1/transactions?${queryParams.toString()}`;
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path);
    
    console.log('🔄 Consultando transacciones en Juno...');
    console.log('📋 Query params:', queryParams.toString());
    
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
    
    console.log('✅ Transacciones obtenidas exitosamente');
    
    res.json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        timestamp: new Date().toISOString(),
        query_params: Object.fromEntries(queryParams)
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/transactions:', error);
    
    if (error.response) {
      const junoError = error.response.data;
      res.status(error.response.status).json({
        success: false,
        error: {
          message: junoError.message || 'Error al obtener transacciones',
          code: junoError.code || error.response.status,
          details: junoError
        }
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        success: false,
        error: { message: 'Timeout en la petición a Juno. Intenta nuevamente.' }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con el servicio de transacciones.' }
      });
    }
  }
});

// ================================
// ENDPOINTS DE REDEMPTION
// ================================

/**
 * Obtener cuentas bancarias registradas
 * Endpoint: GET /api/bank-accounts
 */
app.get('/api/bank-accounts', async (req, res) => {
  console.log('📥 Endpoint /api/bank-accounts llamado');
  try {
    console.log('🔄 Consultando cuentas bancarias en Juno...');
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    
    if (!apiKey || !apiSecret) {
      console.log('❌ Faltan credenciales de API');
      return res.status(500).json({ 
        success: false,
        error: { message: 'Credenciales de API no configuradas.' }
      });
    }
    
    const method = 'GET';
    const path = '/mint_platform/v1/accounts/banks';
    const body = '';
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path, body);
    
    const response = await axios.get(
      'https://stage.buildwithjuno.com/mint_platform/v1/accounts/banks',
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Respuesta de Juno cuentas bancarias:', response.data);
    
    res.json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/bank-accounts:', error);
    
    if (error.response) {
      console.error('📄 Error response data:', error.response.data);
      console.error('📊 Error response status:', error.response.status);
      
      const junoError = error.response.data;
      res.status(error.response.status).json({
        success: false,
        error: {
          message: junoError.message || 'Error al obtener cuentas bancarias',
          code: junoError.code || error.response.status,
          details: junoError
        }
      });
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout en la petición');
      res.status(408).json({
        success: false,
        error: { message: 'Timeout en la petición a Juno. Intenta nuevamente.' }
      });
    } else {
      console.error('🔌 Error de conexión:', error.message);
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con el servicio bancario.' }
      });
    }
  }
});

/**
 * Registrar nueva cuenta bancaria
 * Endpoint: POST /api/register-bank
 */
app.post('/api/register-bank', async (req, res) => {
  console.log('📥 Endpoint /api/register-bank llamado con:', req.body);
  const { tag, recipient_legal_name, clabe, ownership } = req.body;
  
  // Validación mejorada de parámetros
  if (!tag || !recipient_legal_name || !clabe || !ownership) {
    console.log('❌ Faltan parámetros requeridos');
    return res.status(400).json({ 
      success: false,
      error: { message: 'Faltan parámetros requeridos (tag, recipient_legal_name, clabe, ownership).' }
    });
  }
  
  // Validar formato de CLABE (18 dígitos)
  if (!/^\d{18}$/.test(clabe)) {
    console.log('❌ CLABE inválida:', clabe);
    return res.status(400).json({ 
      success: false,
      error: { message: 'La CLABE debe tener exactamente 18 dígitos.' }
    });
  }
  
  // Validar ownership
  const validOwnerships = ['COMPANY_OWNED', 'THIRD_PARTY'];
  if (!validOwnerships.includes(ownership)) {
    console.log('❌ Ownership inválido:', ownership);
    return res.status(400).json({ 
      success: false,
      error: { message: `Ownership debe ser uno de: ${validOwnerships.join(', ')}` }
    });
  }
  
  try {
    console.log('🔄 Registrando cuenta bancaria en Juno...');
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    
    if (!apiKey || !apiSecret) {
      console.log('❌ Faltan credenciales de API');
      return res.status(500).json({ 
        success: false,
        error: { message: 'Credenciales de API no configuradas.' }
      });
    }
    
    const method = 'POST';
    const path = '/mint_platform/v1/accounts/banks';
    const requestBody = {
      tag,
      recipient_legal_name,
      clabe,
      ownership
    };
    const body = JSON.stringify(requestBody);
    
    console.log('📋 Body de la petición:', requestBody);
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
    
    console.log('✅ Cuenta bancaria registrada exitosamente:', response.data);
    
    res.json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/register-bank:', error);
    
    if (error.response) {
      console.error('📄 Error response data:', error.response.data);
      console.error('📊 Error response status:', error.response.status);
      console.error('📑 Error response headers:', error.response.headers);
      
      const junoError = error.response.data;
      res.status(error.response.status).json({
        success: false,
        error: {
          message: junoError.message || 'Error al registrar cuenta bancaria',
          code: junoError.code || error.response.status,
          details: junoError
        }
      });
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout en la petición');
      res.status(408).json({
        success: false,
        error: { message: 'Timeout en la petición a Juno. Intenta nuevamente.' }
      });
    } else {
      console.error('🔌 Error de conexión:', error.message);
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con el servicio bancario.' }
      });
    }
  }
});

/**
 * Redimir tokens MXNB
 * Endpoint: POST /api/redeem
 */
app.post('/api/redeem', async (req, res) => {
  console.log('📥 Endpoint /api/redeem llamado con:', req.body);
  const { amount, destination_bank_account_id } = req.body;
  
  // Validación mejorada de parámetros
  if (!amount || !destination_bank_account_id) {
    console.log('❌ Faltan parámetros requeridos');
    return res.status(400).json({ 
      success: false,
      error: { message: 'Faltan parámetros requeridos (amount, destination_bank_account_id).' }
    });
  }
  
  // Validar que amount sea un número válido y mayor que el mínimo
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 100) {
    console.log('❌ Monto inválido:', amount);
    return res.status(400).json({ 
      success: false,
      error: { message: 'El monto debe ser un número válido mayor o igual a 100 MXNB.' }
    });
  }
  
  try {
    console.log('🔄 Haciendo petición a Juno para redimir...');
    console.log('💰 Monto:', numericAmount, 'MXNB');
    console.log('🏦 Cuenta destino:', destination_bank_account_id);
    
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    
    if (!apiKey || !apiSecret) {
      console.log('❌ Faltan credenciales de API');
      return res.status(500).json({ 
        success: false,
        error: { message: 'Credenciales de API no configuradas.' }
      });
    }
    
    const method = 'POST';
    const path = '/mint_platform/v1/redemptions';
    const requestBody = {
      amount: numericAmount,
      destination_bank_account_id,
      asset: 'mxn'
    };
    const body = JSON.stringify(requestBody);
    
    console.log('📋 Body de la petición:', requestBody);
    const authHeader = buildJunoAuthHeader(apiKey, apiSecret, method, path, body);
    console.log('🔐 Auth header generado');
    
    // Generar UUID único para idempotency (OBLIGATORIO según documentación)
    const idempotencyKey = uuidv4();
    console.log('🔑 Idempotency key:', idempotencyKey);
    
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
    
    console.log('✅ Respuesta exitosa de Juno:', response.data);
    
    // Estructurar respuesta consistente con éxito
    res.json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        idempotency_key: idempotencyKey,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/redeem:', error);
    
    if (error.response) {
      console.error('📄 Error response data:', error.response.data);
      console.error('📊 Error response status:', error.response.status);
      console.error('📑 Error response headers:', error.response.headers);
      
      // Mapear errores específicos de Juno a respuestas consistentes
      const junoError = error.response.data;
      const errorResponse = {
        success: false,
        error: {
          message: junoError.message || 'Error en la redención',
          code: junoError.code || error.response.status,
          details: junoError
        }
      };
      
      res.status(error.response.status).json(errorResponse);
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout en la petición');
      res.status(408).json({
        success: false,
        error: { message: 'Timeout en la petición a Juno. Intenta nuevamente.' }
      });
    } else {
      console.error('🔌 Error de conexión:', error.message);
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con el servicio de redención.' }
      });
    }
  }
});

/**
 * Enviar MXNB a una wallet (on-chain withdrawal)
 * Endpoint: POST /api/withdrawal
 */
app.post('/api/withdrawal', async (req, res) => {
  console.log('📥 Endpoint /api/withdrawal llamado con:', req.body);
  const { address, amount, asset, blockchain, compliance } = req.body;

  // Validación de parámetros
  if (!address || !amount || !asset || !blockchain || compliance === undefined) {
    return res.status(400).json({
      success: false,
      error: { message: 'Faltan parámetros requeridos (address, amount, asset, blockchain, compliance).' }
    });
  }

  try {
    const apiKey = process.env.BITSO_APIKEY;
    const apiSecret = process.env.BITSO_SECRET_APIKEY;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        error: { message: 'Credenciales de API no configuradas.' }
      });
    }
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
    console.log('📋 Body de la petición:', requestBody);
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
    console.log('✅ Withdrawal enviado exitosamente:', response.data);
    res.json({
      success: true,
      payload: response.data.payload || response.data,
      metadata: {
        idempotency_key: idempotencyKey,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error en /api/withdrawal:', error);
    if (error.response) {
      const junoError = error.response.data;
      res.status(error.response.status).json({
        success: false,
        error: {
          message: junoError.message || 'Error en el withdrawal',
          code: junoError.code || error.response.status,
          details: junoError
        }
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        success: false,
        error: { message: 'Timeout en la petición a Juno. Intenta nuevamente.' }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con el servicio de withdrawal.' }
      });
    }
  }
});

// ================================
// ENDPOINTS DE SALUD Y UTILIDADES
// ================================

/**
 * Health check endpoint
 * Endpoint: GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PumaPay Backend está funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Información de endpoints disponibles
 * Endpoint: GET /api/info
 */
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    message: 'PumaPay Campus Wallet Backend',
    version: '1.0.0',
    endpoints: {
      issuance: {
        'GET /api/account-details': 'Obtener CLABEs para depósitos',
        'POST /api/mock-deposit': 'Crear depósito mock (solo testing)'
      },
      balance: {
        'GET /api/balance': 'Obtener balance de MXNB',
        'GET /api/transactions': 'Obtener historial de transacciones'
      },
      redemption: {
        'GET /api/bank-accounts': 'Obtener cuentas bancarias registradas',
        'POST /api/register-bank': 'Registrar nueva cuenta bancaria',
        'POST /api/redeem': 'Redimir tokens MXNB'
      },
      utilities: {
        'GET /api/health': 'Health check',
        'GET /api/info': 'Información de endpoints',
        'POST /api/webhook/juno': 'Webhook para notificaciones de Juno',
        'POST /api/webhook/test': 'Test webhook'
      }
    },
    documentation: 'https://docs.bitso.com/juno/docs'
  });
});

// Error handler para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint no encontrado',
      path: req.originalUrl,
      method: req.method
    }
  });
});

// Error handler global
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);
  res.status(500).json({
    success: false,
    error: {
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }
  });
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor PumaPay Backend escuchando en http://localhost:${PORT}`);
    console.log(`📚 Documentación de endpoints: http://localhost:${PORT}/api/info`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  });
}

// ================================
// ENDPOINTS DE PORTAL (CLIENT SESSION TOKENS)
// ================================

/**
 * Crear un nuevo Client Session Token para un usuario
 * Endpoint: POST /api/portal/create-client
 * 
 * Según la documentación de Portal:
 * - Usa Portal API Key en el servidor para crear Client Session Tokens
 * - El Client Session Token se usa en el SDK del cliente
 */
app.post('/api/portal/create-client', async (req, res) => {
  console.log('📥 Endpoint /api/portal/create-client llamado');
  
  try {
    const portalApiKey = process.env.PORTAL_API_KEY;
    
    if (!portalApiKey) {
      return res.status(500).json({
        success: false,
        error: { message: 'Portal API Key no configurada en el servidor.' }
      });
    }

    console.log('🔄 Creando nuevo cliente en Portal...');
    
    const response = await axios.post(
      `${PORTAL_API_BASE_URL}/custodians/clients`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${portalApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Cliente creado en Portal:', {
      clientId: response.data.id,
      hasToken: !!response.data.clientSessionToken
    });

    res.json({
      success: true,
      clientId: response.data.id,
      clientSessionToken: response.data.clientSessionToken,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error creando cliente en Portal:', error);
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: {
          message: error.response.data?.message || 'Error al crear cliente en Portal',
          code: error.response.data?.code || error.response.status,
          details: error.response.data
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con Portal API.' }
      });
    }
  }
});

/**
 * Refrescar Client Session Token para un cliente existente
 * Endpoint: POST /api/portal/refresh-session/:clientId
 * 
 * Los Client Session Tokens expiran después de 24 horas de inactividad.
 * Este endpoint permite refrescar el token.
 */
app.post('/api/portal/refresh-session/:clientId', async (req, res) => {
  const { clientId } = req.params;
  console.log('📥 Endpoint /api/portal/refresh-session llamado para clientId:', clientId);
  
  try {
    const portalApiKey = process.env.PORTAL_API_KEY;
    
    if (!portalApiKey) {
      return res.status(500).json({
        success: false,
        error: { message: 'Portal API Key no configurada en el servidor.' }
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: { message: 'clientId es requerido.' }
      });
    }

    console.log('🔄 Refrescando Client Session Token...');
    
    const response = await axios.post(
      `${PORTAL_API_BASE_URL}/custodians/clients/${clientId}/session`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${portalApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Client Session Token refrescado');

    res.json({
      success: true,
      clientSessionToken: response.data.clientSessionToken,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error refrescando Client Session Token:', error);
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: {
          message: error.response.data?.message || 'Error al refrescar Client Session Token',
          code: error.response.data?.code || error.response.status,
          details: error.response.data
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { message: 'Error de conexión con Portal API.' }
      });
    }
  }
});

// ================================
// ENDPOINTS DE ZK PROOFS
// ================================

/**
 * Generar ZK Proof usando circuito Noir
 * Endpoint: POST /api/zk/generate-proof
 */
app.post('/api/zk/generate-proof', async (req, res) => {
  console.log('📥 Endpoint /api/zk/generate-proof llamado');
  try {
    const { balance, targetAmount } = req.body;

    if (!balance || !targetAmount) {
      return res.status(400).json({
        success: false,
        error: { message: 'balance y targetAmount son requeridos' }
      });
    }

    const balanceNum = parseInt(balance);
    const targetNum = parseInt(targetAmount);

    if (balanceNum < targetNum) {
      return res.status(400).json({
        success: false,
        error: { message: 'balance debe ser mayor o igual a targetAmount' }
      });
    }

    // Ruta al circuito Noir
    const circuitPath = path.join(__dirname, '../circuits/savings-proof');
    const nargoPath = process.env.NARGO_PATH || '/Users/gerryp/.nargo/bin/nargo';

    // Verificar que nargo existe (REQUERIDO)
    let nargoExists = false;
    try {
      // Intentar verificar si nargo está en el PATH
      await execAsync(`which nargo`);
      nargoExists = true;
      nargoPath = 'nargo'; // Usar nargo del PATH
    } catch (error) {
      // Si no está en PATH, verificar la ruta específica
      try {
        await fs.access(nargoPath);
        nargoExists = true;
      } catch (accessError) {
        nargoExists = false;
      }
    }

    if (!nargoExists) {
      return res.status(500).json({
        success: false,
        error: { 
          message: 'nargo no está disponible. Por favor, instala Noir: curl -L https://noir-lang.github.io/noirup/install | bash',
          code: 'NARGO_NOT_FOUND',
          installation: 'curl -L https://noir-lang.github.io/noirup/install | bash'
        }
      });
    }

    // Verificar que el circuito existe
    try {
      await fs.access(circuitPath);
      await fs.access(path.join(circuitPath, 'Nargo.toml'));
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { 
          message: `Circuito Noir no encontrado en: ${circuitPath}`,
          code: 'CIRCUIT_NOT_FOUND'
        }
      });
    }

    // Actualizar Prover.toml con los valores
    const proverToml = `balance = "${balanceNum}"
target_amount = "${targetNum}"
`;
    
    try {
      await fs.writeFile(
        path.join(circuitPath, 'Prover.toml'),
        proverToml,
        'utf8'
      );
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { 
          message: `No se pudo escribir Prover.toml: ${error.message}`,
          code: 'PROVER_WRITE_ERROR'
        }
      });
    }

    // Generar proof real con nargo (REQUERIDO)
    let proofHex = null;
    let publicInputs = [];

    try {
      console.log('🔄 Ejecutando nargo prove...');
      const { stdout, stderr } = await execAsync(
        `cd ${circuitPath} && ${nargoPath} prove`,
        { timeout: 60000 } // 60 segundos timeout
      );

      // Leer el proof generado
      const proofPath = path.join(circuitPath, 'proofs/savings_proof.proof');
      const proofContent = await fs.readFile(proofPath, 'utf8');
      proofHex = '0x' + proofContent.trim();
      publicInputs = [(balanceNum - targetNum).toString()]; // Solo diferencia pública
      console.log('✅ Proof generado exitosamente con nargo');
    } catch (error) {
      console.error('❌ Error ejecutando nargo prove:', error);
      return res.status(500).json({
        success: false,
        error: { 
          message: `Error generando proof con nargo: ${error.message || error.stderr || 'Error desconocido'}`,
          code: 'NARGO_PROVE_ERROR',
          details: error.stderr || error.stdout
        }
      });
    }

    if (!proofHex || proofHex.length < 100) {
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Proof generado es inválido o muy corto',
          code: 'INVALID_PROOF'
        }
      });
    }

    // Generar proof ID (hash del proof)
    const proofId = '0x' + crypto.createHash('sha256').update(proofHex).digest('hex');

    res.json({
      success: true,
      proof: proofHex,
      publicInputs,
      proofId,
      metadata: {
        timestamp: new Date().toISOString(),
        generatedWith: 'nargo'
      }
    });

  } catch (error) {
    console.error('❌ Error en /api/zk/generate-proof:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error generando proof' }
    });
  }
});

/**
 * Generar proof ZK de completitud de curso
 * Endpoint: POST /api/zk/generate-course-proof
 */
app.post('/api/zk/generate-course-proof', async (req, res) => {
  console.log('📥 Endpoint /api/zk/generate-course-proof llamado');
  try {
    const { score, passing_score, questions_answered, total_questions } = req.body;

    if (!score || !passing_score || !questions_answered || !total_questions) {
      return res.status(400).json({
        success: false,
        error: { message: 'score, passing_score, questions_answered y total_questions son requeridos' }
      });
    }

    const scoreNum = parseInt(score);
    const passingScoreNum = parseInt(passing_score);
    const questionsAnsweredNum = parseInt(questions_answered);
    const totalQuestionsNum = parseInt(total_questions);

    if (scoreNum < passingScoreNum) {
      return res.status(400).json({
        success: false,
        error: { message: 'score debe ser mayor o igual a passing_score' }
      });
    }

    if (questionsAnsweredNum !== totalQuestionsNum) {
      return res.status(400).json({
        success: false,
        error: { message: 'questions_answered debe ser igual a total_questions' }
      });
    }

    // Ruta al circuito Noir
    const circuitPath = path.join(__dirname, '../circuits/course-completion');
    let nargoPath = process.env.NARGO_PATH || '/Users/gerryp/.nargo/bin/nargo';

    // Verificar que nargo existe (REQUERIDO)
    let nargoExists = false;
    try {
      // Intentar verificar si nargo está en el PATH
      await execAsync(`which nargo`);
      nargoExists = true;
      nargoPath = 'nargo'; // Usar nargo del PATH
    } catch (error) {
      // Si no está en PATH, verificar la ruta específica
      try {
        await fs.access(nargoPath);
        nargoExists = true;
      } catch (accessError) {
        nargoExists = false;
      }
    }

    if (!nargoExists) {
      return res.status(500).json({
        success: false,
        error: { 
          message: 'nargo no está disponible. Por favor, instala Noir: curl -L https://noir-lang.github.io/noirup/install | bash',
          code: 'NARGO_NOT_FOUND',
          installation: 'curl -L https://noir-lang.github.io/noirup/install | bash'
        }
      });
    }

    // Verificar que el circuito existe
    try {
      await fs.access(circuitPath);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { 
          message: `Circuito no encontrado en: ${circuitPath}`,
          code: 'CIRCUIT_NOT_FOUND'
        }
      });
    }

    // Actualizar Prover.toml con los valores del request
    const proverTomlPath = path.join(circuitPath, 'Prover.toml');
    const proverToml = `score = "${score}"
passing_score = "${passing_score}"
questions_answered = "${questions_answered}"
total_questions = "${total_questions}"
`;

    await fs.writeFile(proverTomlPath, proverToml, 'utf-8');

    // Generar proof usando nargo
    console.log('🔄 Generando proof de curso con nargo...');
    const { stdout, stderr } = await execAsync(
      `cd ${circuitPath} && ${nargoPath} prove`,
      { timeout: 60000 }
    );

    if (stderr && !stderr.includes('Proof') && !stdout.includes('Proof')) {
      console.warn('⚠️ Advertencias de nargo:', stderr);
    }

    // Leer el proof generado
    const proofPath = path.join(circuitPath, 'proofs', 'course_completion.proof');
    const verifierTomlPath = path.join(circuitPath, 'Verifier.toml');

    let proofBlob = '';
    let publicInputs = [];

    try {
      proofBlob = await fs.readFile(proofPath, 'utf-8');
      
      // Leer Verifier.toml para obtener public inputs
      const verifierToml = await fs.readFile(verifierTomlPath, 'utf-8');
      // Parsear Verifier.toml (formato simple)
      const lines = verifierToml.split('\n');
      publicInputs = lines
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.split('=')[1]?.trim())
        .filter(Boolean);
    } catch (readError) {
      console.error('Error leyendo proof o Verifier.toml:', readError);
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Error leyendo proof generado',
          code: 'PROOF_READ_ERROR',
          details: readError.message
        }
      });
    }

    // Generar proof ID (hash del proof)
    const proofId = crypto.createHash('sha256').update(proofBlob).digest('hex').substring(0, 32);

    console.log('✅ Proof de curso generado exitosamente:', proofId);

    res.json({
      success: true,
      proof: proofBlob,
      publicInputs,
      proofId,
      circuit: 'course-completion'
    });

  } catch (error) {
    console.error('❌ Error en /api/zk/generate-course-proof:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: `Error generando proof de curso: ${error.message || error.stderr || 'Error desconocido'}`,
        code: 'NARGO_PROVE_ERROR',
        details: error.stderr || error.stdout
      }
    });
  }
});

// ================================
// ENDPOINTS DE SOROBAN
// ================================

/**
 * Invocar contrato Soroban
 * Endpoint: POST /api/soroban/invoke-contract
 */
app.post('/api/soroban/invoke-contract', async (req, res) => {
  console.log('📥 Endpoint /api/soroban/invoke-contract llamado');
  try {
    const { contractAddress, function: functionName, args, network } = req.body;

    if (!contractAddress || !functionName) {
      return res.status(400).json({
        success: false,
        error: { message: 'contractAddress y function son requeridos' }
      });
    }

    // Verificar que el SDK de Soroban esté configurado
    const sorobanRpcUrl = process.env.SOROBAN_RPC_URL;
    const sorobanNetworkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE;

    if (!sorobanRpcUrl) {
      return res.status(500).json({
        success: false,
        error: { 
          message: 'SOROBAN_RPC_URL no está configurado. Por favor, configura las variables de entorno.',
          code: 'SOROBAN_NOT_CONFIGURED'
        }
      });
    }

    // En producción, esto debe usar el SDK de Soroban real
    // Por ahora, retornamos error indicando que necesita implementación
    console.log('🔄 Intentando invocar contrato Soroban:', {
      contractAddress,
      function: functionName,
      network: network || 'testnet',
      rpcUrl: sorobanRpcUrl
    });

    return res.status(501).json({
      success: false,
      error: { 
        message: 'Invocación de contratos Soroban no implementada. Por favor, integra el SDK de Soroban (@stellar/stellar-sdk) en el backend.',
        code: 'NOT_IMPLEMENTED',
        details: {
          contractAddress,
          function: functionName,
          requiredSDK: '@stellar/stellar-sdk',
          documentation: 'https://developers.stellar.org/docs/smart-contracts/getting-started'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en /api/soroban/invoke-contract:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error invocando contrato' }
    });
  }
});

// Exportar para Vercel
module.exports = app; 