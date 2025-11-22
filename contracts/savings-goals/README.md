# 🛡️ ZK Savings Proofs – PumaPay

Este módulo conecta los circuitos Noir (`circuits/savings-proof`) con los contratos Soroban (`savings-goals` + `ultrahonk-verifier`) para demostrar metas de ahorro sin revelar saldos reales.

---

## ⚙️ Flujo de Alto Nivel

```mermaid
flowchart LR
    A[Usuario PumaPay] -->|Paso 1 Balance local| B[Noir Circuit<br>savings-proof]
    B -->|Paso 2 nargo compile| C[target/savings_proof.json]
    C -->|Paso 3 inputs Prover toml| D[nargo prove]
    D -->|Paso 4 proofs/savings_proof.proof| E[Empaquetar blob (fields + proof)]
    E -->|Paso 5 submit_proof| F[SavingsGoals Contract]
    F -->|invoke_contract| G[UltraHonk Verifier]
    G -->|Keccak proof_id| F
    F -->|Eventos / estado| H[Backend + DeFindex]
    H -->|Rankings / badges| A
```

1. El usuario deposita fondos en su "cajita de ahorro" usando `deposit_to_goal()`.
2. El frontend calcula `saved_amount`/`target_amount` y alimenta el circuito Noir.
3. `nargo prove` genera `public_inputs` y `proof` (Barretenberg) + `proof_blob`.
4. `savings-goals::submit_proof` envía `proof_blob` al contrato verificador.
5. El verificador valida el proof y devuelve `proof_id`.
6. `savings-goals` marca la meta como lograda y guarda el `proof_id`.

---

## 📁 Artefactos Noir

| Archivo | Descripción |
|---------|-------------|
| `circuits/savings-proof/Nargo.toml` | Metadata de paquete (`type = "bin"`) y dependencias. Sí, **es obligatorio** para que `nargo` reconozca el proyecto. |
| `circuits/savings-proof/Prover.toml` | Inputs por defecto (`saved_amount`, `target_amount`) para `nargo prove`. |
| `circuits/savings-proof/src/main.nr` | Circuito: verifica `saved_amount >= target_amount` (tipo `u64`) y expone `saved_amount - target`. |
| `circuits/savings-proof/target/savings_proof.json` | ABI + bytecode ACIR utilizados por el frontend (`@noir-lang/noir_js`). |
| `circuits/savings-proof/proofs/savings_proof.proof` | Ejemplo de proof generado (hex). |

**Comandos clave**

```bash
cd circuits/savings-proof
/Users/gerryp/.nargo/bin/nargo compile   # genera target/savings_proof.json
/Users/gerryp/.nargo/bin/nargo prove     # usa Prover.toml y crea proofs/savings_proof.proof
```

## 🧬 Diagrama del circuito y pruebas ZK

```mermaid
sequenceDiagram
    participant UI as Frontend (React)
    participant Noir as Circuito Noir
    participant Nargo as nargo CLI
    participant File as Artefactos (target/proofs)
    participant Saver as Contract SavingsGoals
    participant Verifier as Contract Ultrahonk

    UI->>Noir: saved_amount, target_amount
    Noir-->>UI: ACIR + ABI (`savings_proof.json`)
    UI->>Nargo: ejecutar `nargo prove`
    Nargo-->>File: genera `proofs/savings_proof.proof`
    UI->>Saver: submit_proof(proof_blob)
    Saver->>Verifier: verify_proof_with_stored_vk(blob)
    Verifier-->>Saver: proof_id válido
    Saver-->>UI: goal logrado + proof_id
```

---

## 🧠 Detalle del contrato `savings-goals`

| Función | Propósito |
|---------|-----------|
| `set_verifier(verifier: Address)` | Solo el admin (primera cuenta) puede definir qué contrato verificador validará los proofs. |
| `set_savings_goal(target_amount, deadline_ts)` | El usuario crea/actualiza su meta; rechaza valores ≤ 0 y guarda la estructura `Goal`. Preserva `saved_amount` si la meta ya existe. |
| `get_savings_goal(user)` | Lectura pública para dashboards/DeFindex. Devuelve `Goal` completo (meta, `saved_amount`, deadline, proof_id, etc.). |
| `deposit_to_goal(amount)` | El usuario deposita fondos en su "cajita de ahorro". Incrementa `saved_amount` y retorna el nuevo total. Requiere autenticación. |
| `withdraw_from_goal(amount)` | El usuario retira fondos de su "cajita de ahorro". Decrementa `saved_amount` y retorna el nuevo total. Requiere autenticación. |
| `submit_proof(proof_blob)` | Recibe `(u32 fields \|\| public_inputs \|\| proof)`, llama al verificador y marca `achieved=true` guardando el `proof_id`. |
| `assert_admin` + helpers | Lógica interna para asegurar que existe un admin y que solo él puede cambiar el verificador. |

**Estructura almacenada**

```rust
pub struct Goal {
    target_amount: i128,        // Meta de ahorro objetivo
    saved_amount: i128,        // Balance guardado en esta "cajita" específica
    deadline_ts: Option<i64>,  // Fecha límite opcional
    achieved: bool,             // Si la meta fue alcanzada y verificada con ZK proof
    proof_id: Option<BytesN<32>>, // ID del proof ZK si fue verificado
}
```

---

## 🔌 Cómo se enlaza con la app

1. **Frontend (React/TypeScript)**
   - Usa `@noir-lang/noir_js` + `@noir-lang/backend_barretenberg`.
   - Carga `src/zk/savings_proof.json` y genera proofs dinámicos.
   - Llama a `/api/savings-goals/proof` (o directamente al contrato via wallet) con el `proof_blob`.

2. **Backend / DeFindex**
   - Escucha eventos o consulta `Goal` para agregar datos anónimos.
   - Usa `proof_id` como identificador no correlacionable.

3. **Contratos Soroban**
   - `savings-goals` gestiona metas y delega ZK a `ultrahonk-verifier`.
   - `ultrahonk-verifier` implementa la lógica BN254/Keccak (copiada del repo oficial `indextree/ultrahonk_soroban_contract`).

---

## 🚀 Despliegue en Testnet

El contrato `savings-goals` ha sido desplegado exitosamente en Stellar Testnet:

- **Dirección del Contrato**: `CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN`
- **Red**: Testnet
- **WASM Hash**: `7087d8ab8b07a4033a663b12c0d2fb25ea2c7732d91ea298a9205df0ba0916b7`
- **Versión**: v2 (con `saved_amount` y funciones de depósito)
- **Explorador**: https://stellar.expert/explorer/testnet/contract/CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN
- **Verificador configurado**: `CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT` (Simple Verifier)

### Configuración para el Frontend

Agrega la siguiente variable de entorno en tu archivo `.env`:

```env
VITE_SAVINGS_GOALS_CONTRACT=CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN
VITE_STELLAR_NETWORK=testnet
```

### Comandos de Despliegue

```bash
# Compilar el contrato
cd contracts/savings-goals
stellar contract build

# Desplegar en testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/savings_goals.wasm \
  --source-account issuer \
  --network testnet \
  --alias savings-goals
```

---

## 🔐 Backend: Firma de Transacciones XLM

El backend de PumaPay implementa un endpoint seguro para firmar y enviar transacciones de XLM (o tokens personalizados) en Stellar sin exponer las secret keys al frontend.

### Endpoint: `POST /api/stellar/send`

Este endpoint permite enviar XLM o tokens Stellar firmando la transacción en el backend usando las secret keys almacenadas de forma encriptada en Supabase.

#### Parámetros de Request

```json
{
  "destination": "GCRHEPSAZUV7X5BKRZI4PQY4JK46DKVTU7TYKUUPPXJ5RM62Q23Q7TGZ",
  "amount": "10.5",
  "userId": "uuid-del-usuario",  // Opcional si se proporciona email
  "email": "usuario@example.com"  // Opcional si se proporciona userId
}
```

#### Respuesta Exitosa

```json
{
  "success": true,
  "hash": "dbef760eb6090a58586021ceff4ef576c3e653bec822333fd91211f834592acd",
  "ledger": 12345678,
  "envelope_xdr": "AAAAAgAAAAD...",
  "result_xdr": "AAAAAgAAAAD..."
}
```

#### Respuesta de Error

```json
{
  "success": false,
  "error": {
    "message": "Descripción del error"
  }
}
```

### Flujo de Implementación

1. **Validación de Entrada**
   - Verifica que `destination` sea una dirección Stellar válida (comienza con "G")
   - Valida que `amount` sea un número positivo
   - Requiere `userId` o `email` para identificar al usuario

2. **Obtención de Secret Key**
   - Consulta Supabase para obtener el registro del usuario
   - Extrae el campo `clabe` que contiene la secret key encriptada
   - Desencripta la secret key usando `CryptoJS.AES.decrypt` con la clave de encriptación configurada

3. **Construcción de Transacción**
   - Carga la cuenta del remitente desde Horizon
   - Obtiene el fee base de la red
   - Determina el asset (XLM nativo o token personalizado según configuración)
   - Construye la transacción usando `TransactionBuilder`

4. **Firma y Envío**
   - Firma la transacción con la secret key del usuario
   - Envía la transacción a la red Stellar usando Horizon
   - Retorna el hash de la transacción y detalles adicionales

### Configuración del Backend

Variables de entorno requeridas en `backend/.env`:

```env
# Stellar Network Configuration
STELLAR_NETWORK=testnet  # o 'mainnet'
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_ASSET_CODE=null  # null para XLM nativo, o código del token
STELLAR_ASSET_ISSUER=null  # null para XLM nativo, o dirección del issuer

# Encryption Key para desencriptar secret keys
ENCRYPTION_KEY=pumapay-stellar-secret-key-2024

# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE=tu-service-role-key
```

### Estructura de Datos en Supabase

La tabla `usuarios` debe contener:

- `id`: UUID del usuario
- `email`: Email del usuario
- `clabe`: Secret key de Stellar encriptada (almacenada como string encriptado)
- `wallet_address`: Dirección pública Stellar (G...) para validación

### Seguridad

- ✅ Las secret keys nunca se exponen al frontend
- ✅ Las secret keys se almacenan encriptadas en Supabase
- ✅ Solo el backend con `SUPABASE_SERVICE_ROLE` puede desencriptar
- ✅ Validación de direcciones Stellar antes de enviar
- ✅ Validación de montos para prevenir transacciones inválidas

### Ejemplo de Uso desde el Frontend

```typescript
const response = await fetch('/api/stellar/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    destination: 'GCRHEPSAZUV7X5BKRZI4PQY4JK46DKVTU7TYKUUPPXJ5RM62Q23Q7TGZ',
    amount: '10.5',
    userId: currentUser.id, // o email: currentUser.email
  }),
});

const result = await response.json();
if (result.success) {
  console.log('Transacción enviada:', result.hash);
}
```

### Dependencias del Backend

El backend utiliza las siguientes dependencias para Stellar:

```json
{
  "@stellar/stellar-sdk": "^12.1.0",
  "@supabase/supabase-js": "^2.x.x",
  "crypto-js": "^4.x.x"
}
```

---

## 🔗 Integración Frontend y Backend

Para ver cómo conectar el frontend con el contrato y usar ZK proofs, consulta la **[Guía de Integración Completa](./INTEGRATION_GUIDE.md)**.

La guía incluye:
- ✅ Flujo completo de ZK proofs con diagramas
- ✅ Cómo el contrato usa los proofs internamente
- ✅ Ejemplos de código TypeScript/React
- ✅ Integración con servicios del frontend
- ✅ Configuración del backend para invocar contratos Soroban
- ✅ Ejemplo completo de componente React

## ✅ Checklist de Integración

- [x] Diagrama principal y flujo de circuito renderizado con bloques Mermaid (asegúrate de que el visor de tu IDE o GitHub soporte bloques ```mermaid```).
- [x] Circuito Noir compila (`nargo compile`).
- [x] Proof ejemplo generado (`nargo prove` → `proofs/savings_proof.proof`).
- [x] `savings-goals` y `ultrahonk-verifier` compilados a Wasm.
- [x] Contrato `savings-goals` desplegado en Stellar Testnet (v2 con `saved_amount`).
- [x] Contrato `simple-verifier` desplegado y configurado en `savings-goals`.
- [x] Funciones `deposit_to_goal` y `withdraw_from_goal` implementadas.
- [x] Servicio `sorobanService.ts` actualizado con métodos específicos para savings-goals.
- [x] Backend implementado para invocar contratos Soroban y generar ZK proofs.
- [x] Frontend integrado con servicios (depósitos, ZK proofs, UI completa).
- [x] Documentación completa de integración creada.
- [ ] Contrato `ultrahonk-verifier` desplegado (bloqueado por tamaño, usando `simple-verifier` temporalmente).
- [ ] Pruebas end-to-end del flujo completo con transacciones reales.

Con esto tienes una guía completa de cómo funcionan los savings proofs en ZK dentro de PumaPay y cómo se conectan todas las piezas.

