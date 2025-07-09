const express = require('express');
const crypto = require('crypto');

const router = express.Router();

/**
 * Verificar la firma del webhook de Bitso/Juno
 * @param {string} payload - Cuerpo del webhook
 * @param {string} signature - Firma del header
 * @param {string} secret - Secret para verificar
 * @returns {boolean}
 */
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
    console.error('❌ Error verificando firma del webhook:', error);
    return false;
  }
}

/**
 * Webhook para recibir notificaciones de Juno
 * Tipos de eventos esperados:
 * - DEPOSIT_RECEIVED: Cuando se recibe un depósito SPEI
 * - ISSUANCE_COMPLETED: Cuando se completa el minteo de MXNB
 * - REDEMPTION_COMPLETED: Cuando se completa una redención
 */
router.post('/webhook/juno', (req, res) => {
  console.log('📥 Webhook de Juno recibido');
  console.log('Headers:', req.headers);
  
  const signature = req.headers['x-bitso-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verificar firma si está configurada
  const webhookSecret = process.env.JUNO_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.log('❌ Firma del webhook inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }
    console.log('✅ Firma del webhook verificada');
  }
  
  const event = req.body;
  console.log('📄 Evento recibido:', event);
  
  try {
    // Procesar diferentes tipos de eventos
    switch (event.type) {
      case 'DEPOSIT_RECEIVED':
        handleDepositReceived(event.data);
        break;
        
      case 'ISSUANCE_COMPLETED':
        handleIssuanceCompleted(event.data);
        break;
        
      case 'REDEMPTION_COMPLETED':
        handleRedemptionCompleted(event.data);
        break;
        
      case 'REDEMPTION_FAILED':
        handleRedemptionFailed(event.data);
        break;
        
      default:
        console.log(`ℹ️ Tipo de evento no manejado: ${event.type}`);
    }
    
    // Responder exitosamente para confirmar recepción
    res.status(200).json({ 
      received: true, 
      timestamp: new Date().toISOString() 
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

/**
 * Manejar evento de depósito recibido
 */
function handleDepositReceived(data) {
  console.log('💰 Depósito recibido:', data);
  
  // Aquí podrías:
  // 1. Actualizar base de datos local
  // 2. Notificar al frontend via WebSocket
  // 3. Enviar notificación push al usuario
  // 4. Actualizar balance en caché
  
  // Ejemplo de log estructurado
  console.log('📊 Depósito procesado:', {
    amount: data.amount,
    clabe: data.receiver_clabe,
    tracking_code: data.tracking_code,
    timestamp: data.created_at
  });
}

/**
 * Manejar evento de issuance completado
 */
function handleIssuanceCompleted(data) {
  console.log('🪙 Issuance completado:', data);
  
  // Aquí podrías:
  // 1. Actualizar balance de MXNB del usuario
  // 2. Notificar al frontend
  // 3. Registrar en analytics
  
  console.log('📊 Issuance procesado:', {
    amount: data.amount,
    asset: data.asset,
    transaction_id: data.id,
    timestamp: data.created_at
  });
}

/**
 * Manejar evento de redención completada
 */
function handleRedemptionCompleted(data) {
  console.log('✅ Redención completada:', data);
  
  // Aquí podrías:
  // 1. Actualizar balance del usuario
  // 2. Notificar éxito al frontend
  // 3. Actualizar historial de transacciones
  
  console.log('📊 Redención procesada:', {
    amount: data.amount,
    bank_account: data.destination_bank_account_id,
    transaction_id: data.id,
    timestamp: data.updated_at
  });
}

/**
 * Manejar evento de redención fallida
 */
function handleRedemptionFailed(data) {
  console.log('❌ Redención fallida:', data);
  
  // Aquí podrías:
  // 1. Revertir cambios en balance
  // 2. Notificar error al usuario
  // 3. Registrar para análisis
  
  console.log('📊 Redención fallida:', {
    amount: data.amount,
    error: data.error_message,
    transaction_id: data.id,
    timestamp: data.updated_at
  });
}

// Endpoint para testing de webhooks
router.post('/webhook/test', (req, res) => {
  console.log('🧪 Test webhook recibido:', req.body);
  res.json({ 
    message: 'Test webhook recibido correctamente',
    timestamp: new Date().toISOString(),
    data: req.body
  });
});

module.exports = router; 