# 📋 Estado de Despliegue - Savings Goals Contract

## ✅ Contratos Desplegados

### 1. Savings Goals Contract ✅ (v2)
- **Dirección**: `CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN`
- **Red**: Stellar Testnet
- **WASM Hash**: `7087d8ab8b07a4033a663b12c0d2fb25ea2c7732d91ea298a9205df0ba0916b7`
- **Versión**: v2 (con `saved_amount` y funciones de depósito)
- **Explorador**: https://stellar.expert/explorer/testnet/contract/CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN
- **Estado**: ✅ Desplegado y funcional
- **Nuevas funciones**:
  - ✅ `deposit_to_goal(amount)` - Depositar fondos en la "cajita de ahorro"
  - ✅ `withdraw_from_goal(amount)` - Retirar fondos de la "cajita de ahorro"
  - ✅ `saved_amount` - Campo para rastrear el balance guardado por meta

### 2. Simple Verifier Contract ✅
- **Estado**: ✅ **DESPLEGADO** (Versión simplificada para desarrollo)
- **Dirección**: `CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT`
- **WASM Hash**: `8fa1bc2f6876e9ebdcc085e9db40e35a0394b6c0d00b8851c009c5b02ebd3399`
- **Tamaño**: 10,293 bytes (10KB)
- **Network**: Testnet
- **Explorer**: https://stellar.expert/explorer/testnet/contract/CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT
- **Configurado en savings-goals**: ✅ Sí

**⚠️ Nota Importante**: Este es un verificador simplificado que:
- ✅ Valida formato básico de proofs
- ✅ Genera proof_id y previene duplicados
- ❌ **NO hace verificación criptográfica completa**
- ✅ Útil para desarrollo y testing del flujo completo

**Para producción**, se recomienda usar el `ultrahonk-verifier` completo cuando esté disponible.

### 3. Ultrahonk Verifier Contract ⚠️
- **Estado**: ⚠️ **ERROR AL DESPLEGAR** - Error 500 del servidor RPC
- **Razón**: El contrato es muy grande (750KB/733KB) y el servidor RPC de testnet está retornando error 500
- **WASM Hash**: `a5b9579faaec57e79644fa6135b2430fbf3cde05d8b9d4f967a9eb5f620004e8`
- **Tamaño**: 750,715 bytes (750KB)
- **Intentos realizados**:
  - ✅ Compilación exitosa
  - ❌ Despliegue falla con error 500 del servidor
  - ❌ Probado con diferentes flags y configuraciones
  - ❌ Probado con RPC URL explícito y network passphrase

**Posibles causas**:
1. Límite de tamaño del servidor RPC de testnet para contratos
2. Problema temporal del servidor
3. Necesidad de usar un RPC alternativo o contactar soporte de Stellar

**Solución temporal**: Se creó y desplegó el `simple-verifier` como alternativa ligera para desarrollo.

## 🔧 Próximos Pasos

1. **Desplegar Ultrahonk Verifier**:
   ```bash
   cd contracts/ultrahonk-verifier
   stellar contract deploy \
     --wasm target/wasm32v1-none/release/ultrahonk_verifier.wasm \
     --source-account issuer \
     --network testnet \
     --alias ultrahonk-verifier
   ```

2. **Configurar Verificador en Savings Goals** (✅ YA CONFIGURADO):
   El verificador simple ya está configurado en el contrato savings-goals v2:
   ```bash
   # Ya ejecutado:
   stellar contract invoke \
     --id CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN \
     --source-account issuer \
     --network testnet \
     -- set_verifier \
     --caller GCRHEPSAZUV7X5BKRZI4PQY4JK46DKVTU7TYKUUPPXJ5RM62Q23Q7TGZ \
     --verifier CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT
   ```

3. **Configurar Verification Key (VK)**:
   El verificador necesita tener configurado el VK del circuito:
   ```bash
   stellar contract invoke \
     --id <direccion-verificador> \
     --source-account issuer \
     --network testnet \
     -- set_vk \
     --vk_json <vk-json-string>
   ```

## 📝 Notas

- ✅ El contrato `savings-goals` v2 está desplegado y funcional con todas las nuevas características.
- ✅ El verificador simple está configurado y `submit_proof` funciona (validación de formato).
- ✅ El frontend está integrado y listo para probar el flujo completo:
  - Crear metas de ahorro
  - Depositar fondos en las "cajitas"
  - Generar ZK proofs cuando `saved_amount >= target_amount`
  - Verificar proofs on-chain
- ⚠️ Para producción, se recomienda usar el `ultrahonk-verifier` completo cuando esté disponible (actualmente bloqueado por tamaño).

