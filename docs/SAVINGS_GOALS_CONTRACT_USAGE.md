# 📘 Uso del Contrato Savings Goals - Guía Completa

Este documento explica cómo estamos usando las funciones del contrato `savings-goals` y cómo están implementadas en el frontend.

---

## 🏗️ Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Components   │  │   Hooks      │  │  Services    │      │
│  │(SavingsGoals)│→ │(useSavings)  │→ │(savingsService│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP POST
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/soroban/invoke-contract                         │  │
│  │  - Firma transacciones con secret key del usuario     │  │
│  │  - Convierte args a XDR                               │  │
│  │  - Simula y envía transacciones                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ Stellar SDK
┌─────────────────────────────────────────────────────────────┐
│              STELLAR TESTNET (Soroban)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Savings Goals Contract                               │  │
│  │  CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ...   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Funciones del Contrato

### 1. `set_savings_goal(user: Address, target_amount: i128, deadline_ts: Option<i64>)`

**Propósito**: Crea o actualiza la meta de ahorro de un usuario.

**Parámetros**:
- `user`: Dirección Stellar del usuario (requiere autenticación)
- `target_amount`: Monto objetivo en la "cajita" (debe ser > 0)
- `deadline_ts`: Timestamp opcional de fecha límite

**Comportamiento**:
- Si la meta ya existe, preserva el `saved_amount` actual
- Si es nueva, inicializa `saved_amount = 0`
- Siempre resetea `achieved = false` y `proof_id = None`

**Implementación Frontend**:

```typescript
// src/services/sorobanService.ts
async setSavingsGoal(params: SetSavingsGoalParams): Promise<{ success: boolean }> {
  const response = await fetch('/api/soroban/invoke-contract', {
    method: 'POST',
    body: JSON.stringify({
      contractAddress: 'CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN',
      function: 'set_savings_goal',
      args: [
        params.userAddress,           // Address
        params.targetAmount.toString(), // i128
        params.deadlineTs ? params.deadlineTs.toString() : null // Option<i64>
      ],
      network: 'testnet',
      userId: 'current_user_id' // Para obtener secret key del backend
    })
  });
}

// src/services/savingsService.ts
async createSavingsGoal(targetAmount: number, deadline?: Date, userAddress?: string) {
  if (this.savingsGoalsContractAddress && userAddress) {
    const result = await sorobanService.setSavingsGoal({
      userAddress,
      targetAmount,
      deadlineTs: deadline ? Math.floor(deadline.getTime() / 1000) : null
    });
    // Si éxito, obtener la meta del contrato y sincronizar localmente
  }
  // Fallback a localStorage si no hay contrato
}

// src/hooks/useSavingsGoals.tsx
const createMutation = useMutation({
  mutationFn: ({ targetAmount, deadline }) => 
    savingsService.createSavingsGoal(targetAmount, deadline, user?.walletAddress)
});

// src/pages/SavingsGoals.tsx
const handleCreateGoal = async () => {
  await createGoal(targetAmount, deadline);
};
```

**Flujo Completo**:
1. Usuario completa formulario en `SavingsGoals.tsx`
2. `handleCreateGoal` llama a `createGoal` del hook
3. Hook ejecuta `savingsService.createSavingsGoal`
4. Service llama a `sorobanService.setSavingsGoal`
5. Service hace POST a `/api/soroban/invoke-contract`
6. Backend obtiene secret key del usuario desde Supabase
7. Backend firma y envía transacción a Stellar
8. Contrato guarda la meta on-chain
9. Frontend sincroniza con localStorage como backup

---

### 2. `get_savings_goal(user: Address) -> Option<Goal>`

**Propósito**: Obtiene la meta de ahorro de un usuario (lectura pública).

**Parámetros**:
- `user`: Dirección Stellar del usuario

**Retorna**: `Option<Goal>` donde `Goal` contiene:
```rust
{
  target_amount: i128,
  saved_amount: i128,      // Dinero guardado en esta "cajita"
  deadline_ts: Option<i64>,
  achieved: boolean,
  proof_id: Option<BytesN<32>>
}
```

**Implementación Frontend**:

```typescript
// src/services/sorobanService.ts
async getSavingsGoal(userAddress: string): Promise<SavingsGoal | null> {
  const response = await fetch('/api/soroban/invoke-contract', {
    method: 'POST',
    body: JSON.stringify({
      contractAddress: 'CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN',
      function: 'get_savings_goal',
      args: [userAddress],
      network: 'testnet'
      // No requiere userId porque es lectura pública
    })
  });
  return data.goal as SavingsGoal;
}

// src/services/savingsService.ts
async getSavingsGoals(userAddress?: string): Promise<SavingsGoal[]> {
  if (this.savingsGoalsContractAddress && userAddress) {
    const contractGoal = await sorobanService.getSavingsGoal(userAddress);
    if (contractGoal) {
      const goal = this.mapContractGoalToLocal(contractGoal, userAddress);
      // Sincronizar con localStorage
      return [goal];
    }
  }
  // Fallback a localStorage
  return this.getGoalsLocal();
}

// src/hooks/useSavingsGoals.tsx
const { data: goals = [] } = useQuery({
  queryKey: ['savingsGoals', user?.address],
  queryFn: () => savingsService.getSavingsGoals(user?.walletAddress || user?.address),
  enabled: !!user
});
```

**Flujo Completo**:
1. Componente `SavingsGoals.tsx` se monta
2. Hook `useSavingsGoals` ejecuta query automáticamente
3. Query llama a `savingsService.getSavingsGoals`
4. Service intenta obtener del contrato primero
5. Si hay contrato, llama a `sorobanService.getSavingsGoal`
6. Backend hace lectura sin firma (pública)
7. Frontend mapea `ContractGoal` → `SavingsGoal` local
8. Sincroniza con localStorage como backup
9. Si no hay contrato, usa solo localStorage

---

### 3. `deposit_to_goal(user: Address, amount: i128) -> Result<i128, Error>`

**Propósito**: Deposita dinero en la "cajita" de ahorro del usuario.

**Parámetros**:
- `user`: Dirección Stellar del usuario (requiere autenticación)
- `amount`: Monto a depositar (debe ser > 0)

**Validaciones**:
- `amount > 0`
- Meta debe existir (`GoalNotFound`)
- Meta no debe estar ya lograda (`AlreadyAchieved`)

**Retorna**: Nuevo `saved_amount` total después del depósito.

**Implementación Frontend**:

```typescript
// src/services/sorobanService.ts
async depositToGoal(
  userAddress: string,
  amount: number,
  savingsGoalsContractAddress?: string
): Promise<{ success: boolean; savedAmount: number }> {
  const response = await fetch('/api/soroban/invoke-contract', {
    method: 'POST',
    body: JSON.stringify({
      contractAddress: 'CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN',
      function: 'deposit_to_goal',
      args: [userAddress, amount],
      network: 'testnet',
      userId: 'current_user_id' // Para obtener secret key
    })
  });
  return {
    success: true,
    savedAmount: parseInt(data.result?.saved_amount || '0')
  };
}

// src/services/savingsService.ts
async depositToGoal(
  goalId: string,
  amount: number,
  userAddress?: string
): Promise<{ success: boolean; savedAmount: number }> {
  if (this.savingsGoalsContractAddress && userAddress) {
    const result = await sorobanService.depositToGoal(
      userAddress,
      amount,
      this.savingsGoalsContractAddress
    );
    if (result.success) {
      // Actualizar meta local con nuevo savedAmount
      goal.savedAmount = result.savedAmount;
      await this.updateGoalLocal(goal);
      return result;
    }
  }
  // Fallback: actualizar localmente
  goal.savedAmount += amount;
  await this.updateGoalLocal(goal);
  return { success: true, savedAmount: goal.savedAmount };
}

// src/hooks/useSavingsGoals.tsx
const depositMutation = useMutation({
  mutationFn: async ({ goalId, amount }) => {
    return savingsService.depositToGoal(
      goalId,
      amount,
      user?.walletAddress || user?.address
    );
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
  }
});

// src/pages/SavingsGoals.tsx
const handleDepositToGoal = async (goalId: string, amount: number) => {
  await depositToGoal(goalId, amount);
  // Toast de éxito
};
```

**Flujo Completo**:
1. Usuario hace clic en "Depositar en esta cajita"
2. Se abre `DepositModal` con input de monto
3. Usuario ingresa monto y confirma
4. `handleDepositToGoal` llama a `depositToGoal` del hook
5. Hook ejecuta `savingsService.depositToGoal`
6. Service llama a `sorobanService.depositToGoal`
7. Backend obtiene secret key y firma transacción
8. Contrato incrementa `saved_amount` on-chain
9. Contrato retorna nuevo `saved_amount`
10. Frontend actualiza meta local y sincroniza con localStorage
11. UI se actualiza automáticamente (React Query invalida cache)

---

### 4. `withdraw_from_goal(user: Address, amount: i128) -> Result<i128, Error>`

**Propósito**: Retira dinero de la "cajita" de ahorro (opcional, para flexibilidad).

**Parámetros**:
- `user`: Dirección Stellar del usuario (requiere autenticación)
- `amount`: Monto a retirar (debe ser > 0)

**Validaciones**:
- `amount > 0`
- Meta debe existir
- `saved_amount >= amount` (fondos suficientes)

**Retorna**: Nuevo `saved_amount` total después del retiro.

**Implementación Frontend**:

```typescript
// src/services/sorobanService.ts
async withdrawFromGoal(
  userAddress: string,
  amount: number
): Promise<{ success: boolean; savedAmount: number }> {
  // Similar a depositToGoal pero con función 'withdraw_from_goal'
  const response = await fetch('/api/soroban/invoke-contract', {
    method: 'POST',
    body: JSON.stringify({
      contractAddress: 'CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN',
      function: 'withdraw_from_goal',
      args: [userAddress, amount],
      network: 'testnet',
      userId: 'current_user_id'
    })
  });
}
```

**Nota**: Esta función está implementada en el contrato y en `sorobanService`, pero **no está expuesta en la UI actual**. Se puede agregar fácilmente si se necesita.

---

### 5. `submit_proof(user: Address, proof_blob: Bytes) -> Result<BytesN<32>, Error>`

**Propósito**: Envía un ZK proof al contrato para marcar la meta como lograda.

**Parámetros**:
- `user`: Dirección Stellar del usuario (requiere autenticación)
- `proof_blob`: Blob completo del proof en formato `[4-byte count][public_inputs][proof_bytes]`

**Flujo Interno**:
1. Valida que la meta exista y no esté ya lograda
2. Obtiene el verificador configurado (`simple-verifier`)
3. Invoca `verifier.verify_proof_with_stored_vk(proof_blob)`
4. El verificador retorna `proof_id` (keccak256 del blob)
5. Marca `achieved = true` y guarda `proof_id`

**Implementación Frontend**:

```typescript
// src/services/zkProofService.ts
async generateProof(input: ProofInput): Promise<ProofResult> {
  const response = await fetch('/api/zk/generate-proof', {
    method: 'POST',
    body: JSON.stringify({
      savedAmount: input.savedAmount.toString(),
      targetAmount: input.targetAmount.toString()
    })
  });
  // Backend ejecuta nargo prove y retorna proofBlob
  return {
    proof: data.proof,
    publicInputs: data.publicInputs,
    proofId: data.proofId,
    proofBlob: data.proofBlob // Formato listo para el contrato
  };
}

// src/services/savingsService.ts
async generateProofIfAchieved(
  goalId: string,
  userAddress?: string
): Promise<ProofResult | null> {
  const goal = (await this.getSavingsGoals(userAddress)).find(g => g.id === goalId);
  const progress = await this.getGoalProgress(goalId, goal.savedAmount);
  
  if (!progress || !progress.canGenerateProof) {
    return null; // savedAmount < targetAmount o ya lograda
  }

  // 1. Generar proof ZK usando savedAmount de la cajita
  const proof = await zkProofService.generateProof({
    savedAmount: goal.savedAmount, // Usar savedAmount, no balance total
    targetAmount: goal.targetAmount
  });

  // 2. Usar proofBlob del backend
  const proofBlob = proof.proofBlob;

  // 3. Enviar al contrato
  if (this.savingsGoalsContractAddress && userAddress) {
    const result = await sorobanService.submitProofToSavingsGoals(
      userAddress,
      proofBlob,
      this.savingsGoalsContractAddress
    );

    if (result.verified && result.proofId) {
      // Actualizar meta con proof_id del contrato
      await this.markGoalAsAchieved(goalId, result.proofId);
      return {
        ...proof,
        proofId: result.proofId,
        verified: true,
        verificationTxHash: result.txHash
      };
    }
  }
}

// src/services/sorobanService.ts
async submitProofToSavingsGoals(
  userAddress: string,
  proofBlob: string,
  savingsGoalsContractAddress?: string
): Promise<VerificationResult> {
  const response = await fetch('/api/soroban/invoke-contract', {
    method: 'POST',
    body: JSON.stringify({
      contractAddress: 'CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN',
      function: 'submit_proof',
      args: [userAddress, proofBlob],
      network: 'testnet',
      userId: 'current_user_id'
    })
  });
  return {
    verified: true,
    proofId: data.proofId, // BytesN<32> del contrato
    txHash: data.txHash
  };
}

// src/hooks/useSavingsGoals.tsx
const generateProofMutation = useMutation({
  mutationFn: async (goalId: string) => {
    const proof = await savingsService.generateProofIfAchieved(
      goalId,
      user?.walletAddress || user?.address
    );
    if (!proof) {
      throw new Error('No se puede generar proof: la meta no está lista');
    }
    return proof;
  }
});

// src/pages/SavingsGoals.tsx
const handleGenerateProof = async (goalId: string) => {
  await generateProof(goalId);
  // Toast de éxito con proofId
};
```

**Flujo Completo**:
1. Usuario deposita hasta que `saved_amount >= target_amount`
2. Aparece botón "Generar proof" en la UI
3. Usuario hace clic en "Generar proof"
4. `handleGenerateProof` llama a `generateProof` del hook
5. Hook ejecuta `savingsService.generateProofIfAchieved`
6. Service verifica que `savedAmount >= targetAmount`
7. Service llama a `zkProofService.generateProof`
8. `zkProofService` hace POST a `/api/zk/generate-proof`
9. Backend ejecuta `nargo prove` con `saved_amount` y `target_amount`
10. Backend retorna `proofBlob` en formato correcto
11. Service llama a `sorobanService.submitProofToSavingsGoals`
12. Backend firma y envía transacción con `proof_blob`
13. Contrato invoca al verificador (`simple-verifier`)
14. Verificador valida formato y retorna `proof_id`
15. Contrato marca `achieved = true` y guarda `proof_id`
16. Frontend actualiza meta local con `proofId`
17. UI muestra badge "ZK Proof" y detalles del proof

---

### 6. `set_verifier(caller: Address, verifier: Address)` (Admin)

**Propósito**: Configura el contrato verificador (solo admin).

**Parámetros**:
- `caller`: Dirección del admin (debe ser la primera cuenta que llamó esta función)
- `verifier`: Dirección del contrato verificador

**Nota**: Esta función ya fue ejecutada durante el despliegue. El verificador configurado es:
- `CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT` (Simple Verifier)

---

## 🔄 Flujo Completo de Usuario

### Escenario: Usuario crea meta, deposita, y genera proof

```
1. CREAR META
   ┌─────────────────────────────────────────┐
   │ Usuario completa formulario            │
   │ Target: $500, Deadline: 30 días        │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Frontend: createGoal($500, deadline)   │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Backend: set_savings_goal               │
   │ - user: GCRHEPSAZUV7X5BKRZI4PQY4JK...   │
   │ - target_amount: 500                   │
   │ - deadline_ts: 1735689600              │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Contrato: Goal creada                   │
   │ - target_amount: 500                   │
   │ - saved_amount: 0                      │
   │ - achieved: false                       │
   └─────────────────────────────────────────┘

2. DEPOSITAR
   ┌─────────────────────────────────────────┐
   │ Usuario hace clic "Depositar"           │
   │ Ingresa: $200                           │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Frontend: depositToGoal(goalId, 200)    │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Backend: deposit_to_goal                │
   │ - user: GCRHEPSAZUV7X5BKRZI4PQY4JK...  │
   │ - amount: 200                          │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Contrato: saved_amount = 200             │
   │ Retorna: saved_amount = 200             │
   └─────────────────────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Frontend: UI muestra "Guardado: $200"   │
   └─────────────────────────────────────────┘

3. DEPOSITAR MÁS
   ┌─────────────────────────────────────────┐
   │ Usuario deposita otros $350             │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Contrato: saved_amount = 550            │
   │ (200 + 350 = 550 >= 500 ✓)             │
   └─────────────────────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Frontend: Aparece botón "Generar proof" │
   └─────────────────────────────────────────┘

4. GENERAR PROOF
   ┌─────────────────────────────────────────┐
   │ Usuario hace clic "Generar proof"       │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Backend: /api/zk/generate-proof          │
   │ - savedAmount: 550                      │
   │ - targetAmount: 500                      │
   │ Ejecuta: nargo prove                     │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Backend retorna: proofBlob              │
   │ Formato: [4 bytes][public_inputs][proof]│
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Backend: submit_proof                   │
   │ - user: GCRHEPSAZUV7X5BKRZI4PQY4JK...  │
   │ - proof_blob: 0x1234abcd...             │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Contrato: invoke_verifier(proof_blob)    │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Simple Verifier: verify_proof...        │
   │ - Valida formato                        │
   │ - Genera proof_id (keccak256)           │
   │ Retorna: proof_id                       │
   └──────────────┬──────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Contrato:                                │
   │ - achieved = true                       │
   │ - proof_id = 0xabcd1234...             │
   └─────────────────────────────────────────┘
                  ↓
   ┌─────────────────────────────────────────┐
   │ Frontend: UI muestra                    │
   │ - Badge "ZK Proof ✓"                    │
   │ - "Verificado con ZK Proof"             │
   │ - Proof ID: 0xabcd1234...                │
   └─────────────────────────────────────────┘
```

---

## 🔐 Autenticación y Seguridad

### ¿Cómo se autentica el usuario?

1. **Backend obtiene secret key**:
   ```javascript
   // backend/index.js
   const { userId, email } = req.body;
   const { data: userRow } = await supabaseAdmin
     .from('usuarios')
     .select('clabe') // Secret key encriptada
     .eq('id', userId)
     .single();
   
   const userSecretKey = decryptSecretKey(userRow.clabe);
   ```

2. **Backend firma transacción**:
   ```javascript
   const sourceKeypair = Keypair.fromSecret(userSecretKey);
   const transaction = new TransactionBuilder(sourceAccount, {...})
     .addOperation(contract.call(functionName, ...args))
     .build();
   
   transaction.sign(sourceKeypair);
   ```

3. **Contrato valida autenticación**:
   ```rust
   // contracts/savings-goals/src/lib.rs
   pub fn deposit_to_goal(env: Env, user: Address, amount: i128) {
       user.require_auth(); // Valida que user firmó la transacción
       // ...
   }
   ```

### ¿Qué funciones requieren autenticación?

- ✅ `set_savings_goal` - Requiere `user.require_auth()`
- ✅ `deposit_to_goal` - Requiere `user.require_auth()`
- ✅ `withdraw_from_goal` - Requiere `user.require_auth()`
- ✅ `submit_proof` - Requiere `user.require_auth()`
- ❌ `get_savings_goal` - **NO requiere autenticación** (lectura pública)
- ✅ `set_verifier` - Requiere `assert_admin()` (solo primera cuenta)

---

## 📊 Mapeo de Datos

### Contrato → Frontend

```rust
// Contrato (Rust)
pub struct Goal {
    pub target_amount: i128,
    pub saved_amount: i128,
    pub deadline_ts: Option<i64>,
    pub achieved: bool,
    pub proof_id: Option<BytesN<32>>,
}
```

```typescript
// Frontend (TypeScript)
export interface SavingsGoal {
  id: string;                    // Generado localmente: `contract-${userAddress}`
  targetAmount: number;           // target_amount
  savedAmount: number;            // saved_amount
  deadline?: Date;                // deadline_ts * 1000
  achieved: boolean;              // achieved
  proofId?: string;               // proof_id como hex string
  createdAt: Date;                 // No disponible en contrato (local)
  achievedAt?: Date;               // No disponible en contrato (local)
}
```

### Conversión de Tipos

| Tipo Contrato | Tipo Frontend | Conversión |
|---------------|---------------|------------|
| `i128` | `number` | `parseInt(string)` |
| `Option<i64>` | `Date \| undefined` | `new Date(timestamp * 1000)` |
| `Option<BytesN<32>>` | `string \| undefined` | `'0x' + bytes.to_hex()` |
| `Address` | `string` | Directo (Stellar address) |

---

## 🛠️ Fallbacks y Resiliencia

### Estrategia de Fallback

El sistema está diseñado para funcionar **con o sin contrato**:

1. **Si hay contrato configurado**:
   - Intenta operación on-chain primero
   - Si falla, usa localStorage como fallback
   - Sincroniza localStorage con contrato

2. **Si NO hay contrato**:
   - Usa solo localStorage
   - Funciona completamente offline

### Ejemplo de Fallback

```typescript
// src/services/savingsService.ts
async depositToGoal(goalId: string, amount: number, userAddress?: string) {
  // Intento 1: On-chain
  if (this.savingsGoalsContractAddress && userAddress) {
    try {
      const result = await sorobanService.depositToGoal(...);
      if (result.success) {
        // Actualizar local también
        goal.savedAmount = result.savedAmount;
        await this.updateGoalLocal(goal);
        return result;
      }
    } catch (error) {
      console.warn('No se pudo depositar on-chain:', error);
      // Continuar con fallback
    }
  }

  // Fallback: LocalStorage
  goal.savedAmount += amount;
  await this.updateGoalLocal(goal);
  return { success: true, savedAmount: goal.savedAmount };
}
```

---

## 🎯 Resumen de Implementación

| Función Contrato | Servicio Frontend | Hook | Componente | Estado |
|------------------|-------------------|------|------------|--------|
| `set_savings_goal` | `savingsService.createSavingsGoal` | `createGoal` | `SavingsGoals.tsx` | ✅ |
| `get_savings_goal` | `savingsService.getSavingsGoals` | `useQuery` | `SavingsGoals.tsx` | ✅ |
| `deposit_to_goal` | `savingsService.depositToGoal` | `depositToGoal` | `DepositModal` | ✅ |
| `withdraw_from_goal` | `sorobanService.withdrawFromGoal` | - | - | ⚠️ No expuesto en UI |
| `submit_proof` | `savingsService.generateProofIfAchieved` | `generateProof` | `SavingsGoals.tsx` | ✅ |
| `set_verifier` | - | - | - | ✅ Configurado en despliegue |

---

## 📝 Notas Importantes

1. **`saved_amount` vs `balance`**: 
   - `saved_amount` es el dinero guardado en **esta cajita específica**
   - `balance` es el balance total de la cuenta Stellar
   - Los ZK proofs usan `saved_amount`, no `balance`

2. **Autenticación**:
   - Todas las funciones de escritura requieren `userId` o `email` en el backend
   - El backend obtiene la secret key desde Supabase
   - El contrato valida con `user.require_auth()`

3. **Sincronización**:
   - El frontend sincroniza automáticamente con localStorage
   - Si hay contrato, siempre intenta on-chain primero
   - localStorage actúa como backup y cache

4. **ZK Proofs**:
   - Solo se pueden generar cuando `saved_amount >= target_amount`
   - El proof se genera con `saved_amount` y `target_amount` del circuito Noir
   - El verificador valida el formato y genera `proof_id`
   - Una vez verificado, la meta queda `achieved = true` permanentemente

---

## 🔗 Referencias

- **Contrato**: `contracts/savings-goals/src/lib.rs`
- **Servicio Soroban**: `src/services/sorobanService.ts`
- **Servicio Savings**: `src/services/savingsService.ts`
- **Hook**: `src/hooks/useSavingsGoals.tsx`
- **Componente**: `src/pages/SavingsGoals.tsx`
- **Backend**: `backend/index.js` (endpoints `/api/soroban/invoke-contract` y `/api/zk/generate-proof`)

