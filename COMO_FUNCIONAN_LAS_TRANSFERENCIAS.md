# Cómo Funcionan las Transferencias MXNB en PumaPay

## 📋 Resumen

**NO necesitas crear un contrato propio** para las transferencias. El sistema funciona así:

1. ✅ **Contrato MXNB ya existe**: Es un token ERC20 estándar desplegado en Arbitrum Sepolia
2. ✅ **Portal SDK maneja las wallets**: Crea wallets MPC (Multi-Party Computation) automáticamente
3. ✅ **sendAsset hace la magia**: Internamente llama al método `transfer()` del contrato ERC20 MXNB

## 🔄 Flujo de una Transferencia

### 1. El Usuario Inicia una Transferencia
```
Usuario ingresa:
- Dirección destino: 0x742d35Cc6634C0532925a3b8D5C9c19b34c8c123
- Monto: 100 MXNB
```

### 2. Portal SDK Prepara la Transacción
```typescript
// En src/services/portal.ts
await portal.sendAsset('eip155:421614', {
  amount: '100',
  to: '0x742d35Cc6634C0532925a3b8D5C9c19b34c8c123',
  token: '0x...' // Dirección del contrato MXNB
});
```

### 3. Portal SDK Internamente Hace Esto:
```
1. Obtiene la wallet MPC del usuario (sin necesidad de seed phrase)
2. Construye una transacción que llama a:
   contractMXNB.transfer(destino, cantidad)
3. Firma la transacción usando la tecnología MPC
4. Envía la transacción a Arbitrum Sepolia
5. Retorna el hash de la transacción
```

### 4. La Transacción se Ejecuta en Arbitrum
```
- Se llama al método transfer() del contrato ERC20 MXNB
- El contrato actualiza los balances:
  - Balance del remitente: -100 MXNB
  - Balance del destinatario: +100 MXNB
- La transacción queda registrada en el blockchain
```

## 🏗️ Arquitectura Técnica

### Componentes Involucrados:

```
┌─────────────────────────────────────────────────┐
│            Frontend (React/TypeScript)          │
│  - src/pages/Send.tsx                           │
│  - Usuario ingresa dirección y monto            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│          Portal SDK (@portal-hq/web)            │
│  - Maneja wallets MPC                           │
│  - Firma transacciones sin seed phrase          │
│  - Envía transacciones a la blockchain          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│     Contrato ERC20 MXNB en Arbitrum Sepolia     │
│  - Ya está desplegado                           │
│  - Métodos estándar: transfer(), balanceOf()    │
│  - No necesitas crearlo ni desplegarlo           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         Arbitrum Sepolia (Blockchain)           │
│  - Registra todas las transacciones             │
│  - Mantiene el estado de los balances           │
└─────────────────────────────────────────────────┘
```

## 🔑 Lo Que Necesitas Configurar

### Variables de Entorno (`.env`):
```bash
# 1. API Key de Portal (del Portal Dashboard)
VITE_PORTAL_API_KEY=tu_api_key_aqui

# 2. Dirección del contrato MXNB (la provee Portal/Bitso)
VITE_MXNB_CONTRACT_ADDRESS=0x...  # Dirección del token MXNB

# 3. (Opcional) RPC URL de Alchemy para mejor performance
VITE_ALCHEMY_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/...
```

### ¿Dónde Obtener Estas Credenciales?

1. **VITE_PORTAL_API_KEY**: 
   - Ve al [Portal Dashboard](https://portalhq.io/dashboard)
   - Crea un proyecto
   - Copia tu API Key

2. **VITE_MXNB_CONTRACT_ADDRESS**:
   - Te la proporciona Portal o Bitso
   - Es la dirección del contrato ERC20 MXNB ya desplegado
   - Debe ser algo como: `0x742d35Cc6634C0532925a3b8D5C9c19b34c8c123`

3. **VITE_ALCHEMY_RPC_URL** (Opcional):
   - Crea cuenta en [Alchemy](https://www.alchemy.com/)
   - Crea una app en Arbitrum Sepolia
   - Copia la URL RPC

## 📝 Código Relevante

### Enviar MXNB (src/services/portal.ts):
```typescript
async sendMXNB(to: string, amount: number): Promise<string> {
  // 1. Inicializar Portal SDK
  await this.initialize();
  
  // 2. Usar sendAsset que internamente llama a transfer() del contrato
  const result = await this.portal.sendAsset(ARBITRUM_SEPOLIA_CHAIN_ID, {
    amount: amount.toString(),
    to: to,
    token: MXNB_CONTRACT_ADDRESS  // ← Dirección del contrato ERC20
  });
  
  // 3. Retornar hash de transacción
  return result.txHash;
}
```

### Obtener Balance (src/services/ethersBalance.ts):
```typescript
async getMXNBBalance(walletAddress: string): Promise<number> {
  // 1. Conectar al contrato ERC20 MXNB
  const contract = new ethers.Contract(
    MXNB_CONTRACT_ADDRESS,  // ← Dirección del contrato
    ERC20_ABI,               // ← ABI estándar ERC20
    provider
  );
  
  // 2. Llamar a balanceOf() del contrato
  const rawBalance = await contract.balanceOf(walletAddress);
  
  // 3. Formatear según los decimales del token
  const decimals = await contract.decimals();
  return parseFloat(ethers.utils.formatUnits(rawBalance, decimals));
}
```

## ❓ Preguntas Frecuentes

### ¿Necesito crear un contrato propio?
**No.** El contrato MXNB ya existe como un ERC20 estándar. Solo necesitas su dirección.

### ¿Cómo funciona Portal SDK?
Portal SDK crea **wallets MPC** (Multi-Party Computation). Esto significa:
- No necesitas seed phrases
- La clave privada está dividida entre múltiples partes
- Portal maneja la seguridad
- Las transacciones se firman automáticamente

### ¿Qué es sendAsset?
`sendAsset()` es un método del Portal SDK que:
1. Construye una transacción ERC20 `transfer()`
2. La firma usando MPC
3. La envía a la blockchain
4. Retorna el hash de transacción

### ¿Necesito gas (ETH) para enviar MXNB?
**Sí**, pero Portal puede manejar esto automáticamente:
- Portal puede financiar las wallets con ETH para gas
- O puedes usar su sistema de "gasless transactions" si está disponible

### ¿Las transacciones son reales?
**Sí**, siempre que tengas:
- ✅ API Key de Portal válida
- ✅ Dirección del contrato MXNB correcta
- ✅ Wallets con balance de MXNB

## 🚀 Próximos Pasos

1. **Obtener credenciales**: Configura las variables de entorno
2. **Probar en testnet**: Usa Arbitrum Sepolia primero
3. **Monitorear transacciones**: Ve a [Arbiscan Sepolia](https://sepolia.arbiscan.io)

## 📚 Referencias

- [Portal SDK Documentation](https://docs.portalhq.io/)
- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)
- [Arbitrum Documentation](https://docs.arbitrum.io/)

