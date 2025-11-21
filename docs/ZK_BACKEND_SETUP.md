# 🔧 Configuración del Backend para ZK Proofs

## 📋 Requisitos

1. **Backend corriendo** en puerto 4000
2. **Nargo instalado** (opcional, para proofs reales)
3. **Node.js** >= 16.0.0

## 🚀 Iniciar el Backend

```bash
cd backend
npm install  # Solo la primera vez
npm run dev  # O npm start para producción
```

El backend debería estar corriendo en: `http://localhost:4000`

## ✅ Verificar que el Backend Funciona

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Probar Generación de Proof
```bash
curl -X POST http://localhost:4000/api/zk/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"balance": "600", "targetAmount": "500"}'
```

Deberías recibir una respuesta como:
```json
{
  "success": true,
  "proof": "0x...",
  "publicInputs": ["100"],
  "proofId": "0x...",
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "generatedWith": "nargo" // o "simulated"
  }
}
```

## 🔧 Configuración

### Para Proofs Reales con Nargo

1. Asegúrate de que `nargo` esté instalado:
   ```bash
   which nargo
   # Debería mostrar: /Users/gerryp/.nargo/bin/nargo
   ```

2. El backend intentará ejecutar:
   ```bash
   cd circuits/savings-proof
   /Users/gerryp/.nargo/bin/nargo prove
   ```

3. Si `nargo` no está disponible, el backend usará un método simulado (pero funcional)

### Variables de Entorno

No se requieren variables de entorno adicionales para los endpoints de ZK Proofs.

## 📡 Endpoints Disponibles

### 1. Generar ZK Proof
```
POST /api/zk/generate-proof
```

**Body:**
```json
{
  "balance": "600",
  "targetAmount": "500"
}
```

**Response:**
```json
{
  "success": true,
  "proof": "0x...",
  "publicInputs": ["100"],
  "proofId": "0x...",
  "metadata": {
    "timestamp": "...",
    "generatedWith": "nargo" | "simulated"
  }
}
```

### 2. Verificar Proof en Soroban
```
POST /api/soroban/invoke-contract
```

**Body:**
```json
{
  "contractAddress": "0x...",
  "function": "verify_proof_with_stored_vk",
  "args": ["0x..."],
  "network": "testnet"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "proofId": "0x...",
  "txHash": "0x...",
  "metadata": {
    "timestamp": "...",
    "network": "testnet",
    "note": "Verificación simulada - En producción usar SDK Soroban"
  }
}
```

## 🐛 Troubleshooting

### Error: "Backend no disponible"
- Verifica que el backend esté corriendo: `curl http://localhost:4000/api/health`
- Verifica que el proxy en `vite.config.ts` esté configurado correctamente

### Error: "nargo no disponible"
- El backend usará un método simulado automáticamente
- Para proofs reales, instala nargo: `curl -L https://noir-lang.github.io/noirup/install | bash`

### Error: "Cannot find module"
- Ejecuta `npm install` en el directorio `backend/`

### Error: CORS
- El backend ya tiene CORS configurado para `localhost:8080`
- Si usas otro puerto, agrega el origen en `backend/index.js`

## 📝 Notas

- **En desarrollo**: Los proofs pueden ser simulados si `nargo` no está disponible
- **En producción**: Deberías usar el SDK de Soroban real para verificación on-chain
- **Pruebas**: Los endpoints funcionan incluso sin `nargo`, pero los proofs serán simulados

## 🔄 Flujo Completo

1. Frontend llama a `/api/zk/generate-proof`
2. Backend intenta ejecutar `nargo prove`
3. Si `nargo` está disponible → Proof real
4. Si `nargo` no está disponible → Proof simulado (pero funcional)
5. Backend retorna proof + proofId
6. Frontend llama a `/api/soroban/invoke-contract` para verificar
7. Backend simula verificación (en producción usar SDK Soroban)
8. Frontend muestra resultado de verificación

