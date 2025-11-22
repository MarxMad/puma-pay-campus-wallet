# 🚀 Setup de ZK Proofs Reales - Guía Completa

## 📋 Resumen

Esta guía explica cómo generar y usar ZK proofs reales con el circuito Noir y el verificador simple desplegado en Soroban.

## ✅ Estado Actual

- ✅ **Circuito Noir**: Compilado y funcionando (`circuits/savings-proof`)
- ✅ **Backend API**: Genera proofs reales con `nargo prove` (`/api/zk/generate-proof`)
- ✅ **Verificador Simple**: Desplegado en testnet (`CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT`)
- ✅ **Savings Goals Contract**: Configurado con el verificador simple
- ⚠️ **VK (Verification Key)**: Pendiente de generar con bb CLI

## 🔧 Paso 1: Generar Verification Key (VK)

### Instalar bb CLI (Barretenberg)

```bash
# macOS
curl -L https://github.com/AztecProtocol/barretenberg/releases/latest/download/bb-macos -o /usr/local/bin/bb
chmod +x /usr/local/bin/bb

# Linux
curl -L https://github.com/AztecProtocol/barretenberg/releases/latest/download/bb-linux -o /usr/local/bin/bb
chmod +x /usr/local/bin/bb
```

### Generar VK desde el circuito compilado

```bash
cd circuits/savings-proof

# 1. Compilar el circuito (si no está compilado)
nargo compile

# 2. Generar el VK usando bb
bb write_vk -b target/savings_proof.json -o vk.json
```

O usar el script helper:

```bash
./scripts/generate-vk.sh circuits/savings-proof circuits/savings-proof/vk.json
```

### Configurar VK en el Verificador Simple

```bash
# Leer el contenido del VK
VK_CONTENT=$(cat circuits/savings-proof/vk.json)

# Configurar en el verificador simple
stellar contract invoke \
  --id CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT \
  --source-account issuer \
  --network testnet \
  -- set_vk \
  --vk_json "$VK_CONTENT"
```

**Nota**: El verificador simple actualmente no usa el VK para verificación criptográfica (solo valida formato), pero es bueno configurarlo para compatibilidad futura.

## 🔄 Paso 2: Generar Proof Real

### Desde el Frontend

El frontend llama automáticamente al backend cuando el usuario logra una meta:

```typescript
// En savingsService.ts
const proof = await zkProofService.generateProof({
  balance: currentBalance,
  targetAmount: goal.targetAmount,
});
```

### Desde el Backend Directamente

```bash
curl -X POST http://localhost:3001/api/zk/generate-proof \
  -H "Content-Type: application/json" \
  -d '{
    "balance": "600",
    "targetAmount": "500"
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "proof": "0x19a4fa32ec79aff6a1d4219c32ca3538a190acf8b5900ffdc4a9a2a25400f876...",
  "proofBlob": "0x00000001...",
  "publicInputs": ["100"],
  "proofId": "0x...",
  "metadata": {
    "timestamp": "2025-11-21T...",
    "generatedWith": "nargo",
    "proofBlobSize": 14116
  }
}
```

## 📦 Formato del Proof Blob

El `proofBlob` tiene el siguiente formato:

```
[4 bytes: count][N * 32 bytes: public_inputs][proof bytes]
```

- **Count**: Número de public inputs (4 bytes, big-endian)
- **Public Inputs**: Cada uno es 32 bytes (big-endian, u64 en los últimos 8 bytes)
- **Proof**: Bytes del proof generado por nargo

**Ejemplo para savings-proof**:
- 1 public input (diferencia: `balance - target_amount`)
- Proof: ~14,000 bytes
- Total: ~14,116 bytes

## 🧪 Paso 3: Probar el Flujo Completo

### 1. Crear una Meta de Ahorro

```typescript
await savingsService.createSavingsGoal(
  userAddress,
  500, // targetAmount
  null // deadline (opcional)
);
```

### 2. Cuando el Usuario Alcanza la Meta

```typescript
// El frontend detecta que balance >= targetAmount
const proof = await savingsService.generateProofIfAchieved(
  goalId,
  currentBalance,
  userAddress
);

// El proof se envía automáticamente al contrato savings-goals
// El contrato llama al verificador simple
// El verificador valida el formato y retorna proof_id
```

### 3. Verificar en el Contrato

```bash
# Verificar que el proof fue aceptado
stellar contract invoke \
  --id CDSYLJVCXZKXCTEGRFJXEWL4VYLN5HRZ5ILZ266PTKO3QU6GMK6EHXKD \
  --source-account issuer \
  --network testnet \
  -- get_savings_goal \
  --user <user_address>
```

## 🔍 Verificación Manual

### Verificar Proof en el Verificador Simple

```bash
# Obtener proof_blob del backend
PROOF_BLOB="0x00000001..." # Del response del backend

# Enviar al verificador
stellar contract invoke \
  --id CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT \
  --source-account issuer \
  --network testnet \
  -- verify_proof_with_stored_vk \
  --proof_blob "$PROOF_BLOB"
```

### Verificar si un Proof Fue Verificado

```bash
PROOF_ID="0x..." # Del response anterior

stellar contract invoke \
  --id CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT \
  --source-account issuer \
  --network testnet \
  -- is_verified \
  --proof_id "$PROOF_ID"
```

## 📝 Notas Importantes

### Verificador Simple vs Ultrahonk

| Característica | Simple Verifier | Ultrahonk Verifier |
|----------------|----------------|-------------------|
| **Verificación Criptográfica** | ❌ Solo formato | ✅ Completa |
| **Tamaño** | 10KB | 750KB |
| **Uso** | Desarrollo/Testing | Producción |
| **Seguridad** | ⚠️ No garantiza validez | ✅ Garantiza validez |

**⚠️ IMPORTANTE**: El verificador simple **NO verifica criptográficamente** los proofs. Solo valida el formato. Para producción, usar el verificador Ultrahonk completo cuando esté disponible.

### Formato del Proof

- El proof generado por `nargo prove` es un string hexadecimal
- El backend crea el `proofBlob` en el formato correcto
- El frontend puede usar el `proofBlob` directamente del backend o crearlo localmente

### Troubleshooting

**Error: "nargo no está disponible"**
```bash
# Instalar nargo
curl -L https://noir-lang.github.io/noirup/install | bash
source ~/.nargo/env
```

**Error: "bb CLI no encontrado"**
- Ver sección "Instalar bb CLI" arriba

**Error: "Proof generado es inválido"**
- Verificar que `balance >= targetAmount`
- Verificar que el circuito está compilado correctamente
- Verificar que nargo está funcionando: `nargo prove`

**Error: "InvalidProofFormat" en el contrato**
- Verificar que el `proofBlob` tiene el formato correcto
- Verificar que el tamaño mínimo es correcto (4 + 32 + 100 bytes)

## 🔗 Referencias

- [Noir Documentation](https://noir-lang.org/)
- [Barretenberg GitHub](https://github.com/AztecProtocol/barretenberg)
- [Stellar Soroban Documentation](https://developers.stellar.org/docs/smart-contracts)

