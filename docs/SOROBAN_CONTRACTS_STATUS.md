# 📋 Estado de Contratos Soroban - ZK Proofs y Gamificación

## ✅ Contratos Implementados

### **1. Ultrahonk Verifier Contract** ✅
**Ubicación**: `contracts/ultrahonk-verifier/src/lib.rs`

**Estado**: ✅ **COMPLETADO Y FUNCIONAL**

**Funciones Principales:**
- `set_vk(env, vk_json: Bytes) -> BytesN<32>`: Guarda el verification key (VK) en el contrato
- `verify_proof(env, vk_json: Bytes, proof_blob: Bytes) -> BytesN<32>`: Verifica un proof con VK explícito
- `verify_proof_with_stored_vk(env, proof_blob: Bytes) -> BytesN<32>`: Verifica un proof usando el VK almacenado
- `is_proof_verified(env, proof_id: BytesN<32>) -> bool`: Consulta si un proof fue verificado previamente

**Cómo Consume Datos del ZK Proof:**
1. **Input**: `proof_blob` (Bytes) que contiene:
   - Formato: `[4-byte count][public_inputs][proof]`
   - Public inputs: valores públicos del circuito (32 bytes cada uno)
   - Proof: 440 o 456 field elements (compatible con diferentes versiones de bb)
   
2. **Proceso**:
   - Extrae public inputs y proof del blob usando `split_inputs_and_proof_bytes()`
   - Carga el Verification Key (VK) desde storage o lo recibe como parámetro
   - El VK contiene los parámetros del circuito (G1 points, circuit size, etc.)
   - Usa `UltraHonkVerifier::verify()` para verificar el proof
   
3. **Output**: 
   - Si es válido: retorna `proof_id` (hash keccak256 del proof_blob)
   - Si es inválido: retorna error `VerificationFailed`
   - Guarda el `proof_id` en storage para consultas futuras

**Integración:**
- Usado por `savings-goals` contract
- Usado por `course-completion` contract (cuando se implemente)

---

### **2. Savings Goals Contract** ✅
**Ubicación**: `contracts/savings-goals/src/lib.rs`

**Estado**: ✅ **COMPLETADO Y FUNCIONAL**

**Funciones Principales:**
- `set_verifier(env, verifier: Address)`: Configura el contrato verificador
- `set_savings_goal(env, target_amount: i128, deadline_ts: Option<i64>)`: Crea/actualiza meta de ahorro
- `get_savings_goal(env, user: Address) -> Option<Goal>`: Obtiene la meta de un usuario
- `submit_proof(env, proof_blob: Bytes) -> Result<BytesN<32>, Error>`: Envía proof y marca meta como alcanzada

**Cómo Consume Datos del ZK Proof:**
1. **Input**: `proof_blob` (Bytes) generado por el circuito `savings-proof`
2. **Proceso**:
   - Llama a `invoke_verifier()` que invoca `ultrahonk-verifier.verify_proof_with_stored_vk()`
   - El verificador retorna `proof_id` si el proof es válido
3. **Output**: 
   - Actualiza la meta del usuario: `achieved = true`, `proof_id = Some(proof_id)`
   - Retorna el `proof_id` para referencia

**Datos del Circuito:**
- **Privados**: `balance` (no se revela)
- **Públicos**: `target_amount` (se revela en el proof)
- **Verificación**: El circuito verifica que `balance >= target_amount`

---

## ❌ Contratos No Implementados (Necesarios)

### **3. Course Completion Contract** ❌
**Estado**: ❌ **NO IMPLEMENTADO**

**Necesario para**: Gamificación de cursos con ZK proofs

**Funciones Requeridas:**
```rust
pub fn set_verifier(env: Env, verifier: Address)
pub fn submit_course_proof(
    env: Env,
    course_id: String,
    proof_blob: Bytes
) -> Result<BytesN<32>, Error>
pub fn get_course_completion(
    env: Env,
    user: Address,
    course_id: String
) -> Option<CourseCompletion>
pub fn get_user_badges(env: Env, user: Address) -> Vec<Badge>
```

**Estructura de Datos:**
```rust
pub struct CourseCompletion {
    pub course_id: String,
    pub completed: bool,
    pub badge_level: u8, // 1=Bronze, 2=Silver, 3=Gold
    pub proof_id: Option<BytesN<32>>,
    pub completed_at: i64,
}

pub struct Badge {
    pub course_id: String,
    pub level: u8,
    pub earned_at: i64,
}
```

**Cómo Consumiría Datos del ZK Proof:**
1. **Input**: `proof_blob` del circuito `course-completion`
2. **Datos del Circuito**:
   - **Privados**: `score`, `questions_answered` (no se revelan)
   - **Públicos**: `passing_score`, `total_questions` (se revelan)
   - **Output Público**: `badge_level` (1, 2, o 3)
3. **Proceso**:
   - Llama a `ultrahonk-verifier.verify_proof_with_stored_vk(proof_blob)`
   - Extrae el `badge_level` del output público del proof
   - Guarda `CourseCompletion` con el badge level
4. **Output**: Retorna `proof_id` y actualiza el estado del curso

**Prioridad**: 🔴 **ALTA** (necesario para gamificación de cursos)

---

### **4. Budget Compliance Contract** ❌
**Estado**: ❌ **NO IMPLEMENTADO**

**Necesario para**: Verificación de cumplimiento de presupuesto

**Funciones Requeridas:**
```rust
pub fn set_verifier(env: Env, verifier: Address)
pub fn submit_budget_proof(
    env: Env,
    month: String, // "YYYY-MM"
    proof_blob: Bytes
) -> Result<BytesN<32>, Error>
pub fn get_budget_compliance(
    env: Env,
    user: Address,
    month: String
) -> Option<BudgetCompliance>
```

**Estructura de Datos:**
```rust
pub struct BudgetCompliance {
    pub month: String,
    pub total_expenses: i128,
    pub monthly_budget: i128,
    pub compliant: bool,
    pub proof_id: Option<BytesN<32>>,
}
```

**Cómo Consumiría Datos del ZK Proof:**
1. **Input**: `proof_blob` del circuito `budget-proof`
2. **Datos del Circuito**:
   - **Privados**: `total_expenses` (no se revela)
   - **Públicos**: `monthly_budget` (se revela)
   - **Verificación**: El circuito verifica que `total_expenses <= monthly_budget`
3. **Proceso**: Similar a `savings-goals`
4. **Output**: Marca el mes como compliant si el proof es válido

**Prioridad**: 🟡 **MEDIA** (funcionalidad adicional)

---

### **5. Achievements/Badges Contract** ❌
**Estado**: ❌ **NO IMPLEMENTADO**

**Necesario para**: Sistema de badges y recompensas

**Funciones Requeridas:**
```rust
pub fn submit_achievement_proof(
    env: Env,
    achievement_type: String, // "savings", "budget", "courses"
    proof_blob: Bytes
) -> Result<Badge, Error>
pub fn get_user_achievements(env: Env, user: Address) -> Vec<Badge>
pub fn mint_badge_token(env: Env, badge: Badge) -> Address // Token NFT
```

**Estructura de Datos:**
```rust
pub struct Badge {
    pub id: BytesN<32>,
    pub badge_type: String,
    pub level: u8, // 1=Bronze, 2=Silver, 3=Gold
    pub earned_at: i64,
    pub proof_id: BytesN<32>,
}
```

**Cómo Consumiría Datos del ZK Proof:**
1. **Input**: `proof_blob` del circuito `achievements`
2. **Datos del Circuito**:
   - **Privados**: `savings_months`, `total_savings`, `transactions_count`, `budget_compliance_rate`
   - **Públicos**: Mínimos requeridos
   - **Output Público**: `badge_level` (1, 2, o 3)
3. **Proceso**: Verifica proof y emite badge como token NFT
4. **Output**: Badge token que puede ser transferido/comerciado

**Prioridad**: 🟡 **MEDIA** (complementa gamificación)

---

## 📊 Resumen de Contratos

| Contrato | Estado | Prioridad | Uso |
|----------|--------|-----------|-----|
| `ultrahonk-verifier` | ✅ Completo | 🔴 Crítico | Verificación de todos los proofs |
| `savings-goals` | ✅ Completo | 🔴 Alta | Metas de ahorro |
| `course-completion` | ❌ Falta | 🔴 Alta | Gamificación de cursos |
| `budget-compliance` | ❌ Falta | 🟡 Media | Cumplimiento presupuesto |
| `achievements` | ❌ Falta | 🟡 Media | Sistema de badges |

---

## 🔄 Flujo de Consumo de ZK Proofs

### **Ejemplo: Savings Goals**

```
1. Frontend genera proof:
   └─> nargo prove (circuits/savings-proof)
   └─> proof_blob = proof + public_inputs

2. Frontend envía proof al contrato:
   └─> savings-goals.submit_proof(proof_blob)

3. Contrato savings-goals:
   └─> invoke_verifier(proof_blob)
       └─> ultrahonk-verifier.verify_proof_with_stored_vk(proof_blob)

4. Contrato ultrahonk-verifier:
   └─> split_inputs_and_proof_bytes(proof_blob)
   └─> Extrae: [public_inputs][proof]
   └─> Carga VK desde storage
   └─> UltraHonkVerifier::verify(proof, public_inputs)
   └─> Retorna: proof_id (keccak256(proof_blob))

5. Contrato savings-goals:
   └─> Recibe proof_id
   └─> Actualiza Goal: achieved = true, proof_id = proof_id
   └─> Retorna proof_id al frontend
```

### **Formato del Proof Blob**

El `proof_blob` es un array de bytes con el siguiente formato:

```
[4 bytes: count][N * 32 bytes: public_inputs][440/456 * 32 bytes: proof]
```

- **Count**: Número de public inputs (4 bytes)
- **Public Inputs**: Cada uno es 32 bytes (big-endian)
- **Proof**: 440 o 456 field elements, cada uno 32 bytes

**Ejemplo para savings-proof:**
- Public inputs: `[target_amount]` (1 valor de 32 bytes)
- Proof: 440 field elements (14,080 bytes)
- Total: 4 + 32 + 14,080 = 14,116 bytes

---

## 🛠️ Próximos Pasos

1. **Implementar `course-completion` contract** (Prioridad Alta)
   - Similar a `savings-goals`
   - Integrar con gamificación frontend
   - Emitir badges on-chain

2. **Implementar `budget-compliance` contract** (Prioridad Media)
   - Verificación mensual de presupuesto
   - Integrar con sistema de categorías

3. **Implementar `achievements` contract** (Prioridad Media)
   - Sistema de badges NFT
   - Recompensas por logros

4. **Mejorar `ultrahonk-verifier`** (Opcional)
   - Soporte para múltiples VKs (diferentes circuitos)
   - Caché de proofs verificados
   - Estadísticas de verificación

---

## 📝 Notas Técnicas

### **Verification Key (VK)**
- Se configura una vez por circuito usando `set_vk()`
- Contiene parámetros criptográficos del circuito (G1/G2 points)
- Se almacena en storage del contrato
- Hash del VK se usa para validar que es el correcto

### **Proof ID**
- Es el hash keccak256 del `proof_blob` completo
- Se usa como identificador único del proof
- Se almacena en storage para evitar re-verificación
- Permite consultar si un proof fue verificado: `is_proof_verified(proof_id)`

### **Public Inputs**
- Son valores que el circuito "revela" públicamente
- Se incluyen en el proof blob
- El verificador los usa para validar el proof
- Ejemplo: `target_amount` en savings-proof (no revela el balance real)

### **Privacidad**
- Los valores privados (ej: `balance`, `score`) **NO** se envían al contrato
- Solo se envía el proof que demuestra la veracidad sin revelar los datos
- El contrato solo sabe que la condición se cumplió, no los valores exactos

