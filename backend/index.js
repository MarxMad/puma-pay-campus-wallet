const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const bitsoWebhook = require('./bitso-webhook');
const { createClient } = require('@supabase/supabase-js');
const {
  Horizon,
  Networks,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  StrKey,
  Contract,
  xdr,
  SorobanRpc,
} = require('@stellar/stellar-sdk');

const execAsync = promisify(exec);

const decryptSecretKey = (encryptedSecretKey) => {
  if (!encryptedSecretKey) return null;
  const bytes = CryptoJS.AES.decrypt(encryptedSecretKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Portal API Configuration
const PORTAL_API_BASE_URL = 'https://api.portalhq.io/api/v1';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : null;

const STELLAR_NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const STELLAR_HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const STELLAR_ASSET_CODE = process.env.STELLAR_ASSET_CODE || null;
const STELLAR_ASSET_ISSUER = process.env.STELLAR_ASSET_ISSUER || null;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'pumapay-stellar-secret-key-2024';
const STELLAR_NETWORK_PASSPHRASE = STELLAR_NETWORK === 'mainnet'
  ? Networks.PUBLIC
  : Networks.TESTNET;
const stellarServer = new Horizon.Server(STELLAR_HORIZON_URL);

// Soroban RPC Configuration
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || (STELLAR_NETWORK === 'testnet' 
  ? 'https://soroban-testnet.stellar.org'
  : 'https://soroban-rpc.mainnet.stellar.org');
const sorobanRpc = new SorobanRpc.Server(SOROBAN_RPC_URL);

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

/**
 * Enviar XLM/MXNB en Stellar firmando en backend
 * Endpoint: POST /api/stellar/send
 */
app.post('/api/stellar/send', async (req, res) => {
  console.log('📥 Endpoint /api/stellar/send llamado');
  const { destination, amount, userId, email } = req.body || {};

  if (!destination || !amount || (!userId && !email)) {
    return res.status(400).json({
      success: false,
      error: { message: 'destination, amount y userId o email son requeridos.' }
    });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error: { message: 'Supabase no está configurado en el backend.' }
    });
  }

  if (!StrKey.isValidEd25519PublicKey(destination)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Dirección Stellar inválida. Debe comenzar con "G".' }
    });
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'El monto debe ser un número positivo.' }
    });
  }

  try {
    let query = supabaseAdmin
      .from('usuarios')
      .select('id,email,clabe,wallet_address')
      .limit(1);

    query = userId ? query.eq('id', userId) : query.eq('email', email);
    const { data: userRow, error: userError } = await query.single();

    if (userError || !userRow) {
      return res.status(404).json({
        success: false,
        error: { message: 'Usuario no encontrado en Supabase.' }
      });
    }

    if (!userRow.clabe) {
      return res.status(400).json({
        success: false,
        error: { message: 'El usuario no tiene secret key almacenada.' }
      });
    }

    let secretKey;
    try {
      secretKey = decryptSecretKey(userRow.clabe);
    } catch (error) {
      console.error('❌ Error desencriptando secret key:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'No se pudo desencriptar la secret key del usuario.' }
      });
    }

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        error: { message: 'Secret key desencriptada inválida.' }
      });
    }

    const sourceKeypair = Keypair.fromSecret(secretKey);
    const sourcePublicKey = sourceKeypair.publicKey();

    if (userRow.wallet_address && userRow.wallet_address !== sourcePublicKey) {
      console.warn('⚠️ La dirección desencriptada no coincide con la almacenada en Supabase.');
    }

    const account = await stellarServer.loadAccount(sourcePublicKey);
    const fee = await stellarServer.fetchBaseFee();

    const amountStr = amountNum.toFixed(7).replace(/0+$/, '').replace(/\.$/, '');
    const asset = STELLAR_ASSET_CODE && STELLAR_ASSET_ISSUER
      ? new Asset(STELLAR_ASSET_CODE, STELLAR_ASSET_ISSUER)
      : Asset.native();

    const transaction = new TransactionBuilder(account, {
      fee: fee.toString(),
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset,
          amount: amountStr,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);
    const result = await stellarServer.submitTransaction(transaction);

    console.log('✅ Transacción Stellar enviada:', result.hash);
    res.json({
      success: true,
      hash: result.hash,
      ledger: result.ledger,
      envelope_xdr: result.envelope_xdr,
      result_xdr: result.result_xdr,
    });
  } catch (error) {
    console.error('❌ Error enviando XLM en backend:', error.response?.data || error);
    res.status(500).json({
      success: false,
      error: {
        message: error.response?.data?.extras?.result_codes || error.message || 'Error enviando transacción en Stellar',
        details: error.response?.data || null,
      },
    });
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

// ================================
// ENDPOINTS DE SOROBAN (CONTRATOS)
// ================================

/**
 * Función helper para convertir valores JS a XDR de Soroban
 */
function jsValueToXdr(value, type = 'string') {
  try {
    if (value === null || value === undefined) {
      return xdr.ScVal.scvVoid();
    }

    switch (type) {
      case 'address':
        // Address Stellar (G...)
        return xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(xdr.PublicKey.publicKeyTypeEd25519(StrKey.decodeEd25519PublicKey(value))));
      case 'i128':
        // Número entero (i128)
        const num = BigInt(value);
        const hi = Number(num >> 64n);
        const lo = Number(num & 0xffffffffffffffffn);
        return xdr.ScVal.scvI128(new xdr.Int128Parts({ 
          hi: xdr.Int64.fromString(hi.toString()), 
          lo: xdr.Uint64.fromString(lo.toString()) 
        }));
      case 'i64':
        // Número entero (i64)
        return xdr.ScVal.scvI64(xdr.Int64.fromString(value.toString()));
      case 'bytes':
        // Bytes (hex string con 0x)
        const hex = value.startsWith('0x') ? value.slice(2) : value;
        return xdr.ScVal.scvBytes(Buffer.from(hex, 'hex'));
      case 'string':
        // String
        return xdr.ScVal.scvString(value.toString());
      default:
        return xdr.ScVal.scvString(value.toString());
    }
  } catch (error) {
    console.error('Error convirtiendo valor a XDR:', error, value, type);
    throw new Error(`Error convirtiendo valor a XDR: ${error.message}`);
  }
}

/**
 * Invocar contrato Soroban
 * Endpoint: POST /api/soroban/invoke-contract
 */
app.post('/api/soroban/invoke-contract', async (req, res) => {
  console.log('📥 Endpoint /api/soroban/invoke-contract llamado');
  try {
    const { contractAddress, function: functionName, args, network, userId, email } = req.body;

    if (!contractAddress || !functionName) {
      return res.status(400).json({
        success: false,
        error: { message: 'contractAddress y function son requeridos' }
      });
    }

    // Para funciones que requieren autenticación, necesitamos la secret key del usuario
    let userSecretKey = null;
    if (userId || email) {
      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          error: { message: 'Supabase no está configurado en el backend.' }
        });
      }

      let query = supabaseAdmin
        .from('usuarios')
        .select('id,email,clabe,wallet_address')
        .limit(1);

      query = userId ? query.eq('id', userId) : query.eq('email', email);
      const { data: userRow, error: userError } = await query.single();

      if (userError || !userRow || !userRow.clabe) {
        return res.status(404).json({
          success: false,
          error: { message: 'Usuario no encontrado o sin secret key almacenada.' }
        });
      }

      try {
        userSecretKey = decryptSecretKey(userRow.clabe);
      } catch (error) {
        console.error('❌ Error desencriptando secret key:', error);
        return res.status(500).json({
          success: false,
          error: { message: 'No se pudo desencriptar la secret key del usuario.' }
        });
      }
    }

    // Crear contrato instance
    const contract = new Contract(contractAddress);

    // Convertir argumentos a XDR
    // Para set_savings_goal: [user: Address, target_amount: i128, deadline_ts: Option<i64>]
    // Para get_savings_goal: [user: Address]
    const xdrArgs = (args || []).map((arg, index) => {
      // Si es null o undefined, retornar Void (para Option types)
      if (arg === null || arg === undefined) {
        return xdr.ScVal.scvVoid();
      }
      
      // Intentar detectar el tipo automáticamente
      if (typeof arg === 'string' && arg.startsWith('G')) {
        // Es una dirección Stellar
        return jsValueToXdr(arg, 'address');
      } else if (typeof arg === 'string' && /^0x[a-fA-F0-9]+$/i.test(arg)) {
        // Es bytes hex
        return jsValueToXdr(arg, 'bytes');
      } else if (typeof arg === 'number' || (!isNaN(Number(arg)) && arg !== '')) {
        // Es un número (i128 o i64 dependiendo del contexto)
        // Para set_savings_goal: index 1 es i128, index 2 es i64
        if (functionName === 'set_savings_goal' && index === 1) {
          return jsValueToXdr(arg, 'i128');
        } else if (functionName === 'set_savings_goal' && index === 2) {
          return jsValueToXdr(arg, 'i64');
        }
        // Por defecto, usar i128
        return jsValueToXdr(arg, 'i128');
      } else {
        // String normal
        return jsValueToXdr(arg, 'string');
      }
    });

    // Determinar si es una llamada de solo lectura o una transacción
    const readOnlyFunctions = ['get_savings_goal'];
    const isReadOnly = readOnlyFunctions.includes(functionName);

    if (isReadOnly) {
      // Llamada de solo lectura (simulate)
      // simulateTransaction necesita XDR string, no objeto
      // Construir una transacción temporal para simulación usando una cuenta dummy
      const dummyKeypair = Keypair.random();
      
      // Crear una cuenta dummy simple para la simulación
      // No necesitamos cargar la cuenta real del servidor para simulaciones
      const dummyAccount = {
        accountId: () => dummyKeypair.publicKey(),
        sequenceNumber: () => '0',
        incrementSequenceNumber: () => {},
      };

      const simulationTx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(functionName, ...xdrArgs))
        .setTimeout(30)
        .build();

      // simulateTransaction puede aceptar el objeto Transaction directamente
      // El SDK lo convertirá a XDR internamente
      const result = await sorobanRpc.simulateTransaction(simulationTx);

      if (result.errorResult) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Error en simulación del contrato',
            code: 'CONTRACT_ERROR',
            details: result.errorResult
          }
        });
      }

      // Decodificar resultado
      let decodedResult = null;
      if (result.result && result.result.retval) {
        const retval = result.result.retval;
        // Intentar decodificar según el tipo esperado
        if (retval.switch() === xdr.ScValType.scvMap) {
          // Es un struct (Goal)
          const map = retval.map();
          decodedResult = {};
          if (map) {
            map.forEach(entry => {
              const key = entry.key().toString();
              const val = entry.val();
              if (val.switch() === xdr.ScValType.scvI128) {
                decodedResult[key] = val.i128().toString();
              } else if (val.switch() === xdr.ScValType.scvBool) {
                decodedResult[key] = val.b();
              } else if (val.switch() === xdr.ScValType.scvBytes) {
                decodedResult[key] = '0x' + Buffer.from(val.bytes()).toString('hex');
              } else if (val.switch() === xdr.ScValType.scvI64) {
                decodedResult[key] = val.i64().toString();
              } else if (val.switch() === xdr.ScValType.scvVoid) {
                decodedResult[key] = null;
              }
            });
          }
        } else if (retval.switch() === xdr.ScValType.scvVoid) {
          decodedResult = null;
        } else if (retval.switch() === xdr.ScValType.scvBytes) {
          decodedResult = '0x' + Buffer.from(retval.bytes()).toString('hex');
        }
      }

      return res.json({
        success: true,
        goal: decodedResult,
        result: result.result
      });
    } else {
      // Transacción que requiere firma
      if (!userSecretKey) {
        return res.status(400).json({
          success: false,
          error: { 
            message: 'Esta función requiere autenticación. Proporciona userId o email.',
            code: 'AUTH_REQUIRED'
          }
        });
      }

      const sourceKeypair = Keypair.fromSecret(userSecretKey);
      const sourceAccount = await stellarServer.loadAccount(sourceKeypair.publicKey());

      // Construir transacción
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(functionName, ...xdrArgs))
        .setTimeout(30)
        .build();

      // Simular primero
      // simulateTransaction puede aceptar el objeto Transaction directamente
      // El SDK lo convertirá a XDR internamente
      let simulation;
      try {
        // En SDK v12, simulateTransaction puede tener problemas con el parsing
        // Intentar usar el método directamente y capturar errores de parsing
        simulation = await sorobanRpc.simulateTransaction(transaction);
      } catch (simError) {
        console.error('❌ Error en simulateTransaction:', simError);
        console.error('Error name:', simError.name);
        console.error('Error message:', simError.message);
        
        // Si es un error de parsing (Bad union switch), puede ser un problema de versión del SDK
        // o un formato inesperado de la respuesta del servidor RPC
        if (simError.message && simError.message.includes('Bad union switch')) {
          return res.status(500).json({
            success: false,
            error: {
              message: 'Error de parsing en la respuesta de simulación. Esto puede ser un problema de versión del SDK de Stellar.',
              code: 'PARSING_ERROR',
              details: {
                error: 'Bad union switch: 4',
                suggestion: 'Intenta actualizar @stellar/stellar-sdk a la última versión o verifica la configuración del servidor RPC',
                sdkVersion: '12.1.0'
              }
            }
          });
        }
        
        return res.status(500).json({
          success: false,
          error: {
            message: `Error simulando transacción: ${simError.message || 'Error desconocido'}`,
            code: 'SIMULATION_ERROR',
            details: simError.toString()
          }
        });
      }
      
      if (simulation.errorResult) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Error en simulación del contrato',
            code: 'CONTRACT_ERROR',
            details: simulation.errorResult
          }
        });
      }
      
      // Verificar que simulation.transactionData existe
      if (!simulation.transactionData) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'La simulación no retornó transactionData',
            code: 'MISSING_TRANSACTION_DATA'
          }
        });
      }

      // Aplicar recursos de la simulación
      // Usar assembleTransaction si está disponible (versiones recientes del SDK)
      let finalTransaction;
      
      try {
        // Verificar si assembleTransaction existe como método estático o de instancia
        const hasAssembleTransaction = typeof SorobanRpc.assembleTransaction === 'function' ||
                                      typeof sorobanRpc.assembleTransaction === 'function';
        
        if (hasAssembleTransaction) {
          // Método moderno: usar assembleTransaction
          const assembleFn = SorobanRpc.assembleTransaction || sorobanRpc.assembleTransaction;
          finalTransaction = assembleFn(transaction, simulation).build();
        } else {
          // Fallback: usar el método manual para versiones antiguas
          // Reconstruir la transacción desde XDR con los datos de Soroban aplicados
          const txXdr = transaction.toXDR();
          const txEnv = xdr.TransactionEnvelope.fromXDR(txXdr, 'base64');
          
          // Aplicar los datos de Soroban de la simulación
          if (simulation.transactionData) {
            const sorobanData = simulation.transactionData;
            const tx = txEnv.v1().tx();
            
            // Crear o actualizar la extensión de Soroban
            if (!tx.ext() || tx.ext().switch() !== xdr.TransactionExt.transactionExtV1) {
              tx.ext(xdr.TransactionExt.transactionExtV1({
                ext: xdr.ExtensionPoint.ext(0),
                sorobanData: sorobanData
              }));
            } else {
              tx.ext().v1().sorobanData(sorobanData);
            }
            
            // Reconstruir la transacción desde XDR
            finalTransaction = TransactionBuilder.fromXDR(
              txEnv.toXDR('base64'),
              STELLAR_NETWORK_PASSPHRASE
            );
          } else {
            finalTransaction = transaction;
          }
        }
      } catch (error) {
        console.error('Error aplicando datos de Soroban:', error);
        // Si falla, intentar usar la transacción original (puede fallar al enviar)
        finalTransaction = transaction;
      }

      // Firmar y enviar
      finalTransaction.sign(sourceKeypair);
      const sendResult = await sorobanRpc.sendTransaction(finalTransaction);

      if (sendResult.errorResult) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Error enviando transacción',
            code: 'TRANSACTION_ERROR',
            details: sendResult.errorResult
          }
        });
      }

      // Esperar a que se confirme (con manejo de errores para Bad union switch)
      let getResult = null;
      let decodedResult = null;
      
      try {
        getResult = await sorobanRpc.getTransaction(sendResult.hash);
        let attempts = 0;
        while (getResult && getResult.status === 'NOT_FOUND' && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            getResult = await sorobanRpc.getTransaction(sendResult.hash);
          } catch (getError) {
            // Si hay un error de parsing, continuar sin el resultado detallado
            console.warn('⚠️ Error obteniendo detalles de transacción:', getError.message);
            break;
          }
          attempts++;
        }

        // Decodificar resultado si está disponible
        if (getResult && getResult.resultValue) {
          try {
            const retval = getResult.resultValue;
            if (retval.switch() === xdr.ScValType.scvBytes) {
              decodedResult = '0x' + Buffer.from(retval.bytes()).toString('hex');
            } else if (retval.switch() === xdr.ScValType.scvI128) {
              decodedResult = retval.i128().toString();
            }
          } catch (decodeError) {
            console.warn('⚠️ Error decodificando resultado:', decodeError.message);
            // Continuar sin el resultado decodificado
          }
        }
      } catch (getTxError) {
        // Si hay un error de parsing (Bad union switch), aún podemos retornar el hash
        console.warn('⚠️ Error obteniendo transacción después de enviar:', getTxError.message);
        // Continuar sin el resultado detallado, pero retornar el hash de la transacción
      }

      return res.json({
        success: true,
        txHash: sendResult.hash,
        proofId: decodedResult,
        result: getResult.resultValue ? getResult.resultValue.toString() : null
      });
    }

  } catch (error) {
    console.error('❌ Error en /api/soroban/invoke-contract:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: error.message || 'Error invocando contrato',
        details: error.response?.data || null
      }
    });
  }
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
    // Soporta tanto 'balance' (legacy) como 'saved_amount' (nuevo)
    const { balance, saved_amount, targetAmount } = req.body;
    const savedAmount = saved_amount || balance; // Usar saved_amount si está disponible

    if (!savedAmount || !targetAmount) {
      return res.status(400).json({
        success: false,
        error: { message: 'saved_amount (o balance) y targetAmount son requeridos' }
      });
    }

    const savedAmountNum = parseInt(savedAmount);
    const targetNum = parseInt(targetAmount);

    if (savedAmountNum < targetNum) {
      return res.status(400).json({
        success: false,
        error: { message: 'saved_amount debe ser mayor o igual a targetAmount' }
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

    // Actualizar Prover.toml con los valores (usar saved_amount)
    const proverToml = `saved_amount = "${savedAmountNum}"
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
      publicInputs = [(savedAmountNum - targetNum).toString()]; // Solo diferencia pública
      
      // Crear proof_blob en el formato esperado por el verificador
      // Formato: [4-byte count][public_inputs (32 bytes cada uno)][proof bytes]
      const fields = publicInputs.length;
      const fieldsBytes = Buffer.alloc(4);
      fieldsBytes.writeUInt32BE(fields, 0);
      
      // Public inputs como bytes (cada uno es 32 bytes, big-endian)
      const publicInputsBytes = Buffer.concat(
        publicInputs.map(input => {
          const num = BigInt(input);
          const buffer = Buffer.alloc(32);
          // Escribir en los últimos 8 bytes (u64)
          buffer.writeBigUInt64BE(num, 24);
          return buffer;
        })
      );
      
      // Proof como bytes hex
      const proofHexClean = proofHex.startsWith('0x') ? proofHex.slice(2) : proofHex;
      const proofBytes = Buffer.from(proofHexClean, 'hex');
      
      // Concatenar todo para crear el proof_blob
      const proofBlob = Buffer.concat([fieldsBytes, publicInputsBytes, proofBytes]);
      const proofBlobHex = '0x' + proofBlob.toString('hex');
      
      console.log('✅ Proof generado exitosamente con nargo');
      console.log(`📦 Proof blob creado: ${proofBlob.length} bytes`);
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

    // Generar proof ID (hash del proof_blob completo)
    const proofId = '0x' + crypto.createHash('sha256').update(proofBlob).digest('hex');

    res.json({
      success: true,
      proof: proofHex, // Proof original en hex
      proofBlob: proofBlobHex, // Proof blob en formato para el verificador
      publicInputs,
      proofId,
      metadata: {
        timestamp: new Date().toISOString(),
        generatedWith: 'nargo',
        proofBlobSize: proofBlob.length
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

// Exportar para Vercel
module.exports = app; 