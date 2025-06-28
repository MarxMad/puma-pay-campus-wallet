# 🔑 Configuración Portal SDK para PumaPay

## 📋 **Resumen**

PumaPay ahora integra **Portal MPC SDK** basándose en el [Portal Hackathon Kit oficial](https://github.com/portal-hq/portal-hackathon-kit-react-native-mxnb) para crear wallets MPC con MXNB en Arbitrum Sepolia.

## 🚀 **Estado Actual**

✅ **Portal Web SDK instalado** (`@portal-hq/web`)  
✅ **Servicio Portal MPC creado** (`src/services/portal.ts`)  
✅ **Modo mock funcional** para desarrollo  
🔄 **Pendiente:** Credenciales reales de Portal  

## 🔧 **Configuración Requerida**

### **1. Variables de Entorno**

Crea un archivo `.env` con las siguientes variables:

```bash
# Portal MPC Configuration
VITE_PORTAL_API_KEY=your_portal_api_key_here

# Alchemy RPC (opcional, usa endpoint público por defecto)
VITE_ALCHEMY_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/your_api_key

# MXNB Contract Address (se configurará cuando esté disponible)
VITE_MXNB_CONTRACT_ADDRESS=0x...

# Bitso API (opcional)
VITE_BITSO_API_KEY=your_bitso_api_key
VITE_BITSO_API_SECRET=your_bitso_api_secret
```

### **2. Obtener Credenciales Portal**

Para obtener tu `VITE_PORTAL_API_KEY`:

1. 📧 **Portal Community Slack**: Únete al [Portal Community Slack](https://portalcommunity.slack.com)
2. 🎯 **Canal #mxnb-hackathon**: Solicita acceso al hackathon kit
3. 🔑 **Portal Admin Dashboard**: Te darán acceso al dashboard para generar API keys
4. 📄 **Documentación**: [Portal MXNB Hackathon Hub](https://docs.portalhq.io/support/mxnb-hackathon-hub)

## 🛠️ **Funcionalidades Implementadas**

### **Portal MPC Service** (`src/services/portal.ts`)

```typescript
// ✅ Crear wallet MPC
const wallet = await portalService.createWallet();

// ✅ Obtener balances
const mxnbBalance = await portalService.getMXNBBalance();
const ethBalance = await portalService.getETHBalance();

// ✅ Enviar tokens
const txHash = await portalService.sendMXNB(toAddress, amount);

// ✅ Faucet testnet
const faucetTx = await portalService.fundWalletFromFaucet();

// ✅ Autenticación social (modo mock)
const user = await portalService.loginWithGoogle();
```

### **Integración en Componentes**

- **Welcome.tsx**: Botones de autenticación social
- **Home.tsx**: Balance y transacciones reales
- **Login.tsx**: Formulario tradicional + Portal

## 🎯 **Next Steps**

1. **Obtener credenciales reales** del Portal Admin Dashboard
2. **Configurar variables de entorno** con API keys reales
3. **Testear en Arbitrum Sepolia** con MXNB testnet
4. **Integrar faucet** para obtener ETH y MXNB de prueba
5. **Implementar backup/recovery** cuando los tipos estén disponibles

## 🔗 **Referencias**

- [Portal Web SDK Docs](https://docs.portalhq.io/guides/web)
- [Portal Hackathon Kit React Native](https://github.com/portal-hq/portal-hackathon-kit-react-native-mxnb)
- [Portal NPM Package](https://www.npmjs.com/package/@portal-hq/web)
- [MXNB Hackathon Hub](https://docs.portalhq.io/support/mxnb-hackathon-hub)

## 💡 **Modo Mock vs Producción**

### **Modo Mock (Actual)**
- ⚡ Funciona sin credenciales
- 🎲 Balances y transacciones simulados
- 🧪 Perfecto para desarrollo y testing

### **Modo Producción (Próximo)**
- 🔐 Requiere Portal API Key real
- 🌐 Conecta a Arbitrum Sepolia real
- 💰 Balances y transacciones reales con MXNB

---

**PumaPay está listo para conectar con Portal MPC en cuanto tengas las credenciales! 🎉** 