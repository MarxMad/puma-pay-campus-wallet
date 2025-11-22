# 🔍 Simple Verifier Contract

## 📋 Descripción

Este es un **verificador simplificado** de ZK proofs diseñado para desarrollo y testing. Es una alternativa ligera al `ultrahonk-verifier` que permite desplegar y probar el sistema completo sin las limitaciones de tamaño del verificador completo.

## ⚠️ Importante: Versión de Desarrollo

**Este verificador NO hace verificación criptográfica completa.** Solo valida:
- Formato básico del `proof_blob`
- Estructura mínima esperada
- Genera `proof_id` (keccak256 del blob)
- Previene duplicados

**Para producción**, usar el `ultrahonk-verifier` completo cuando esté disponible.

## 📊 Comparación

| Característica | Simple Verifier | Ultrahonk Verifier |
|----------------|----------------|-------------------|
| **Tamaño** | ~10KB | ~750KB |
| **Verificación Criptográfica** | ❌ No | ✅ Sí |
| **Desplegable en Testnet** | ✅ Sí | ❌ Error 500 |
| **Uso Recomendado** | Desarrollo/Testing | Producción |

## 🚀 Despliegue

### Estado Actual

- **Dirección**: `CDZO6ESTBBBWGR4K7MO5NQIT7EYTDJRAQJR6T5XYEMMFG7VIEJSQTSIB`
- **WASM Hash**: `c478c1758d20c124213e078ed71cb7e2b6ec33dc68f35fa7d53095f08605a69d`
- **Tamaño**: 9,867 bytes (9.8KB)
- **Network**: Testnet
- **Explorer**: https://stellar.expert/explorer/testnet/contract/CDZO6ESTBBBWGR4K7MO5NQIT7EYTDJRAQJR6T5XYEMMFG7VIEJSQTSIB

### Comandos de Despliegue

```bash
cd contracts
stellar contract build --package simple-verifier
stellar contract deploy \
  --wasm target/wasm32v1-none/release/simple_verifier.wasm \
  --source-account issuer \
  --network testnet \
  --alias simple-verifier
```

## 🔧 Funciones

### `set_vk(env, vk_json: Bytes) -> BytesN<32>`

Configura el verification key (VK). En esta versión simplificada, el VK se guarda pero no se usa para verificación criptográfica.

**Nota**: El VK es opcional. Si no se configura, se usa un VK por defecto.

### `verify_proof_with_stored_vk(env, proof_blob: Bytes) -> Result<BytesN<32>, Error>`

Verifica un proof usando el VK almacenado (o el VK por defecto).

**Validaciones**:
- ✅ Formato básico del blob: `[4-byte count][public_inputs][proof]`
- ✅ Tamaño mínimo esperado
- ✅ Genera `proof_id` (keccak256)
- ❌ **NO valida criptográficamente el proof**

### `verify_proof(env, vk_json: Bytes, proof_blob: Bytes) -> Result<BytesN<32>, Error>`

Verifica un proof con VK explícito (para compatibilidad).

### `is_verified(env, proof_id: BytesN<32>) -> bool`

Consulta si un `proof_id` fue previamente verificado.

## 🔗 Integración con Savings Goals

El verificador simple está configurado en el contrato `savings-goals`:

```bash
stellar contract invoke \
  --id CDSYLJVCXZKXCTEGRFJXEWL4VYLN5HRZ5ILZ266PTKO3QU6GMK6EHXKD \
  --source-account issuer \
  --network testnet \
  -- set_verifier \
  --caller GCRHEPSAZUV7X5BKRZI4PQY4JK46DKVTU7TYKUUPPXJ5RM62Q23Q7TGZ \
  --verifier CDZO6ESTBBBWGR4K7MO5NQIT7EYTDJRAQJR6T5XYEMMFG7VIEJSQTSIB
```

## 🔄 Migración a Ultrahonk

Cuando el `ultrahonk-verifier` esté disponible:

1. Desplegar `ultrahonk-verifier` (cuando se resuelva el error 500)
2. Configurar el VK real del circuito Noir
3. Actualizar `savings-goals` para usar el nuevo verificador:

```bash
stellar contract invoke \
  --id CDSYLJVCXZKXCTEGRFJXEWL4VYLN5HRZ5ILZ266PTKO3QU6GMK6EHXKD \
  --source-account issuer \
  --network testnet \
  -- set_verifier \
  --caller GCRHEPSAZUV7X5BKRZI4PQY4JK46DKVTU7TYKUUPPXJ5RM62Q23Q7TGZ \
  --verifier <ULTRAHONK_CONTRACT_ADDRESS>
```

## 📝 Notas

- El verificador simple acepta cualquier proof con formato válido
- No garantiza seguridad criptográfica
- Útil para desarrollo y testing del flujo completo
- Compatible con la misma interfaz que `ultrahonk-verifier`

