# PumaPay Campus Wallet - Backend

Backend para PumaPay Campus Wallet con integración completa a las APIs de Juno para issuance y redemption de tokens MXNB.

## 🚀 Características

- **Issuance (Minteo)**: Depósitos SPEI que automáticamente mintean tokens MXNB
- **Redemption**: Conversión de tokens MXNB a pesos mexicanos vía transferencia bancaria
- **Balance y Transacciones**: Consulta de saldos e historial completo
- **Webhooks**: Notificaciones en tiempo real de Juno
- **Cuentas Bancarias**: Gestión de cuentas para redemptions

## 📦 Instalación

1. **Clonar e instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
```bash
# Copiar archivo de ejemplo
cp config.example.js config.js

# O crear archivo .env
touch .env
```

3. **Añadir credenciales de Juno:**
```bash
# En .env o config.js
BITSO_APIKEY=tu_api_key_de_juno
BITSO_SECRET_APIKEY=tu_secret_key_de_juno
```

## 🔑 Obtener API Keys

1. Ir a [Juno Dashboard](https://stage.buildwithjuno.com/settings/api-keys)
2. Crear nuevas API keys con permisos:
   - View balances
   - View account information
   - Create redemptions
   - View transactions

## 🏃‍♂️ Uso

### Desarrollo:
```bash
npm run dev
```

### Producción:
```bash
npm start
```

El servidor estará disponible en `http://localhost:4000`

## 📚 Endpoints Disponibles

### 🪙 Issuance (Minteo)

#### `GET /api/account-details`
Obtener CLABEs para recibir depósitos SPEI.

**Respuesta:**
```json
{
  "success": true,
  "payload": {
    "response": [
      {
        "clabe": "710969000000324311",
        "type": "AUTO_PAYMENT",
        "status": "ENABLED"
      }
    ]
  }
}
```

#### `POST /api/mock-deposit` (Solo Testing)
Crear depósito simulado en environment de stage.

**Body:**
```json
{
  "amount": "1000",
  "receiver_clabe": "710969000000324311",
  "receiver_name": "PumaPay",
  "sender_clabe": "123456789012345678",
  "sender_name": "Usuario Test"
}
```

### 💰 Balance y Transacciones

#### `GET /api/balance`
Obtener balance actual de MXNB.

**Respuesta:**
```json
{
  "success": true,
  "payload": {
    "balances": [
      {
        "asset": "mxnbj",
        "balance": 1000.00
      }
    ]
  }
}
```

#### `GET /api/transactions`
Obtener historial de transacciones.

**Query Parameters:**
- `limit`: Número de transacciones (default: 50)
- `offset`: Offset para paginación (default: 0)
- `status`: Filtrar por status
- `type`: Filtrar por tipo

### 🏦 Redemption

#### `GET /api/bank-accounts`
Obtener cuentas bancarias registradas.

#### `POST /api/register-bank`
Registrar nueva cuenta bancaria.

**Body:**
```json
{
  "tag": "Mi Cuenta Principal",
  "recipient_legal_name": "Juan Pérez",
  "clabe": "646180110412345678",
  "ownership": "COMPANY_OWNED"
}
```

#### `POST /api/redeem`
Redimir tokens MXNB a pesos mexicanos.

**Body:**
```json
{
  "amount": 500,
  "destination_bank_account_id": "0b338ba9-7c3a-4a13-964b-0c0ca6bb473e"
}
```

### 🔧 Utilidades

#### `GET /api/health`
Health check del servidor.

#### `GET /api/info`
Información detallada de todos los endpoints.

#### `POST /api/webhook/juno`
Webhook para recibir notificaciones de Juno.

## 🌐 Integración con Frontend

El backend está configurado para trabajar con el frontend de PumaPay. Asegúrate de que las URLs coincidan:

**Frontend development:** `http://localhost:3000` o `http://localhost:5173`
**Backend development:** `http://localhost:4000`

## 🔒 Seguridad

- Todas las peticiones a Juno usan autenticación HMAC-SHA256
- Verificación de firmas en webhooks
- Headers de idempotencia para evitar duplicados
- Validación exhaustiva de parámetros

## 🚨 Manejo de Errores

El backend maneja errores de manera consistente:

```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "CODIGO_ERROR",
    "details": { ... }
  }
}
```

## 📋 Logs

El servidor genera logs detallados con emojis para fácil identificación:

- 📥 Endpoint llamado
- 🔄 Procesando petición
- ✅ Éxito
- ❌ Error
- 🔐 Autenticación
- 💰 Transacciones financieras

## 🔗 Enlaces Útiles

- [Documentación de Juno](https://docs.bitso.com/juno/docs)
- [Dashboard de Juno](https://stage.buildwithjuno.com)
- [API Reference](https://docs.bitso.com/juno/reference)

## 🤝 Soporte

Para soporte con las APIs de Juno, contactar al equipo de Bitso/Juno a través de su documentación oficial. 