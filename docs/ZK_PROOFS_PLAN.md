# 🔐 Plan de Implementación: ZK Proofs + DeFindex para Educación Financiera

## 🎯 Objetivo General

Transformar PumaPay en una plataforma de educación financiera y ahorro que utiliza **Zero-Knowledge Proofs** para proteger la privacidad de los estudiantes mientras permite comparativas, rankings y recompensas basadas en comportamiento financiero responsable.

## 📋 Casos de Uso de ZK Proofs

### 1. **Verificación de Metas de Ahorro (Savings Goals)**
**Problema**: Los estudiantes quieren demostrar que alcanzaron una meta de ahorro sin revelar su balance exacto.

**Solución ZK**:
- Probar que `balance >= meta_objetivo` sin revelar el balance
- Generar proof client-side usando Noir/Ultrahonk
- Verificar en contrato Soroban para desbloquear recompensas

**Ejemplo**: "Ahorré más de $500 MXNB este mes" → Proof válido sin revelar si ahorró $501 o $5000.

### 2. **Cumplimiento de Presupuesto (Budget Compliance)**
**Problema**: Verificar que un estudiante no excedió su presupuesto sin revelar sus gastos detallados.

**Solución ZK**:
- Probar que `gastos_totales <= presupuesto_mensual` sin revelar categorías ni montos
- Habilitar descuentos automáticos para estudiantes responsables
- Rankings anónimos de "mejor gestión de presupuesto"

**Ejemplo**: "Mantuve mi presupuesto este mes" → Proof que permite acceso a descuentos exclusivos.

### 3. **Historial de Buen Comportamiento Financiero**
**Problema**: Demostrar consistencia en ahorro sin exponer transacciones individuales.

**Solución ZK**:
- Probar que `ahorro_mes_N >= umbral` para N meses consecutivos
- Generar "badge" de buen comportamiento sin revelar datos
- Habilitar préstamos estudiantiles o becas basadas en comportamiento

**Ejemplo**: "He ahorrado consistentemente 3 meses seguidos" → Proof para elegibilidad de programas especiales.

### 4. **Comparativas Anónimas con DeFindex**
**Problema**: Los estudiantes quieren compararse con otros sin revelar su identidad o datos exactos.

**Solución ZK + DeFindex**:
- Probar que `mi_ahorro >= percentil_X` sin revelar el monto exacto
- DeFindex agrega datos anónimos para rankings del campus
- Rankings: "Estás en el top 20% de ahorradores" sin revelar identidad

**Ejemplo**: Dashboard muestra "Estás mejor que el 75% de estudiantes" basado en proofs agregados.

### 5. **Verificación de Elegibilidad para Recompensas**
**Problema**: Comercios quieren ofrecer descuentos a "buenos ahorradores" sin conocer sus balances.

**Solución ZK**:
- Probar que `balance >= umbral` o `ahorro_mes >= meta` sin revelar montos
- Contrato Soroban verifica proof y emite "token de descuento"
- QR code con proof para canjear en comercios afiliados

**Ejemplo**: "Descuento 15% para estudiantes que ahorraron $300+ este mes" → Proof en QR.

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Generación de proofs client-side (Noir/Ultrahonk)    │
│  - UI para metas de ahorro y presupuestos               │
│  - Dashboard de educación financiera                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Stellar Soroban Contracts                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  savings_goals.soroban                         │   │
│  │  - Verificar proofs de metas de ahorro         │   │
│  │  - Emitir tokens de recompensa                 │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  budget_compliance.soroban                     │   │
│  │  - Verificar cumplimiento de presupuesto        │   │
│  │  - Generar badges de comportamiento             │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ultrahonk_verifier.soroban                      │   │
│  │  - Verificar proofs de Ultrahonk                │   │
│  │  - Basado en: ultrahonk_soroban_contract        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  DeFindex Integration                    │
│  - Agregación anónima de datos financieros             │
│  - Rankings y comparativas del campus                  │
│  - Analytics educativos                                │
└─────────────────────────────────────────────────────────┘
```

## 📦 Estructura de Archivos

```
puma-pay-campus-wallet/
├── contracts/
│   ├── savings-goals/
│   │   ├── src/lib.rs              # Contrato de metas de ahorro
│   │   └── Cargo.toml
│   ├── budget-compliance/
│   │   ├── src/lib.rs              # Contrato de cumplimiento presupuesto
│   │   └── Cargo.toml
│   └── ultrahonk-verifier/
│       ├── src/lib.rs              # Verificador de proofs Ultrahonk
│       └── Cargo.toml
├── circuits/
│   ├── savings-proof/
│   │   ├── src/main.nr             # Circuito Noir para ahorro
│   │   └── Prover.toml
│   ├── budget-proof/
│   │   ├── src/main.nr             # Circuito Noir para presupuesto
│   │   └── Prover.toml
│   └── behavior-proof/
│       ├── src/main.nr             # Circuito para comportamiento
│       └── Prover.toml
├── src/
│   ├── services/
│   │   ├── zkProofService.ts       # Servicio para generar proofs
│   │   ├── savingsService.ts       # Gestión de metas de ahorro
│   │   └── defindexService.ts      # Integración con DeFindex
│   ├── hooks/
│   │   ├── useSavingsGoals.tsx     # Hook para metas de ahorro
│   │   └── useZKProof.tsx          # Hook para generar proofs
│   └── pages/
│       ├── SavingsGoals.tsx         # Página de metas de ahorro
│       ├── FinancialEducation.tsx   # Dashboard educativo
│       └── Rankings.tsx            # Rankings anónimos
└── docs/
    └── ZK_PROOFS_PLAN.md           # Este archivo
```

## 🚀 Plan de Implementación (Hackathon)

### Fase 1: Setup y Contratos Base (Día 1-2)

#### 1.1 Instalar Dependencias
```bash
# Instalar Noir
curl -L https://noirup.org/install | bash
noirup

# Instalar Stellar CLI (ya hecho)
stellar --version

# Clonar referencia de ultrahonk
git clone https://github.com/tupui/ultrahonk_soroban_contract.git
cd ultrahonk_soroban_contract
# Estudiar estructura y adaptar
```

#### 1.2 Crear Contrato Base de Verificación
```rust
// contracts/ultrahonk-verifier/src/lib.rs
use soroban_sdk::{contract, contractimpl, Env, Bytes};

#[contract]
pub struct UltrahonkVerifier;

#[contractimpl]
impl UltrahonkVerifier {
    pub fn verify_savings_proof(
        env: Env,
        proof: Bytes,
        public_inputs: Bytes,
        verification_key: Bytes
    ) -> bool {
        // Integrar verificación de Ultrahonk
        // Basado en: ultrahonk_soroban_contract
        // Retornar true si proof es válido
    }
}
```

#### 1.3 Crear Contrato de Metas de Ahorro
```rust
// contracts/savings-goals/src/lib.rs
use soroban_sdk::{contract, contractimpl, Env, Address, Symbol};

#[contract]
pub struct SavingsGoals;

#[contractimpl]
impl SavingsGoals {
    pub fn set_savings_goal(env: Env, user: Address, target_amount: i128) {
        // Guardar meta de ahorro del usuario
    }
    
    pub fn verify_goal_achieved(
        env: Env,
        user: Address,
        proof: Bytes
    ) -> bool {
        // Verificar proof de que balance >= target_amount
        // Llamar a ultrahonk_verifier
    }
    
    pub fn claim_reward(env: Env, user: Address) {
        // Emitir token de recompensa si goal alcanzado
    }
}
```

### Fase 2: Circuitos Noir (Día 2-3)

#### 2.1 Circuito de Meta de Ahorro
```rust
// circuits/savings-proof/src/main.nr
use dep::std;

fn main(
    balance: Field,
    target_amount: Field,
    // Public inputs para verificación
) -> pub Field {
    // Probar que balance >= target_amount
    // Sin revelar balance exacto
    assert(balance >= target_amount);
    balance
}
```

#### 2.2 Circuito de Cumplimiento de Presupuesto
```rust
// circuits/budget-proof/src/main.nr
fn main(
    total_expenses: Field,
    monthly_budget: Field,
) -> pub Field {
    // Probar que gastos <= presupuesto
    assert(total_expenses <= monthly_budget);
    total_expenses
}
```

### Fase 3: Servicios Frontend (Día 3-4)

#### 3.1 Servicio de ZK Proofs
```typescript
// src/services/zkProofService.ts
import { generateProof } from '@noir-lang/noir_js';

export interface SavingsProofInput {
  balance: bigint;
  targetAmount: bigint;
}

export class ZKProofService {
  async generateSavingsProof(input: SavingsProofInput): Promise<{
    proof: string;
    publicInputs: string[];
  }> {
    // Generar proof usando circuito Noir
    const proof = await generateProof('savings-proof', input);
    return {
      proof: proof.proof,
      publicInputs: proof.publicInputs
    };
  }
  
  async verifyProofOnChain(
    contractAddress: string,
    proof: string,
    publicInputs: string[]
  ): Promise<boolean> {
    // Llamar a contrato Soroban para verificar
    // Usar stellarService
  }
}
```

#### 3.2 Servicio de Metas de Ahorro
```typescript
// src/services/savingsService.ts
export class SavingsService {
  async createSavingsGoal(targetAmount: number, deadline: Date) {
    // Guardar meta localmente y en contrato
  }
  
  async checkGoalProgress() {
    // Obtener balance actual
    // Comparar con meta
    // Generar proof si se alcanzó
  }
  
  async claimReward(proof: string) {
    // Verificar proof en contrato
    // Reclamar recompensa (token/badge)
  }
}
```

### Fase 4: Integración DeFindex (Día 4-5)

#### 4.1 Servicio DeFindex
```typescript
// src/services/defindexService.ts
export class DeFindexService {
  async submitAnonymousData(
    proof: string,
    percentile: number
  ) {
    // Enviar proof agregado a DeFindex
    // Sin revelar identidad ni montos exactos
  }
  
  async getCampusRankings() {
    // Obtener rankings agregados del campus
    // "Top 10% de ahorradores"
    // "Promedio de gasto en comida: $X"
  }
  
  async getPersonalRanking(proof: string) {
    // Comparar proof personal con agregados
    // "Estás mejor que el 75% de estudiantes"
  }
}
```

### Fase 5: UI y Educación Financiera (Día 5-6)

#### 5.1 Página de Metas de Ahorro
```typescript
// src/pages/SavingsGoals.tsx
- Crear/editar metas de ahorro
- Visualizar progreso
- Generar proof cuando se alcance meta
- Reclamar recompensas
```

#### 5.2 Dashboard de Educación Financiera
```typescript
// src/pages/FinancialEducation.tsx
- Tips de ahorro personalizados
- Comparativas anónimas con otros estudiantes
- Rankings del campus (sin revelar identidad)
- Badges por logros financieros
```

#### 5.3 Página de Rankings
```typescript
// src/pages/Rankings.tsx
- "Estás en el top X% de ahorradores"
- Comparativa de gastos por categoría (agregada)
- Promedios del campus
- Todo basado en proofs, sin revelar datos personales
```

## 🎓 Casos de Uso Educativos

### 1. **Gamificación de Ahorro**
- Badges por alcanzar metas: "Ahorrador Bronze", "Ahorrador Silver", "Ahorrador Gold"
- Cada badge requiere proof de meta alcanzada
- Badges visibles públicamente pero sin revelar montos

### 2. **Desafíos del Campus**
- "Desafío de Ahorro Mensual": estudiantes que ahorren X cantidad
- Rankings anónimos: "Top 10 ahorradores del mes"
- Recompensas: descuentos en comercios, becas, etc.

### 3. **Educación Comparativa**
- "El estudiante promedio gasta $X en comida este mes"
- "Tu gasto en transporte es Y% menor que el promedio"
- Todo basado en datos agregados de DeFindex

### 4. **Programas de Recompensas**
- Comercios ofrecen descuentos a "buenos ahorradores"
- Verificación mediante proof: "Tengo balance >= $X" sin revelar monto exacto
- QR code con proof para canjear descuento

## 🔒 Privacidad y Seguridad

### Garantías de ZK Proofs
1. **No revelación de montos**: Solo se prueba que `balance >= meta`, no el balance exacto
2. **No revelación de transacciones**: Solo se prueba cumplimiento, no detalles
3. **No revelación de identidad**: Rankings son anónimos
4. **Verificación on-chain**: Proofs verificados en Soroban, no en servidor centralizado

### Flujo de Privacidad
```
Usuario → Genera Proof Local → Verifica en Soroban → Resultado Público
         (Datos privados)      (Solo proof)         (Solo verdadero/falso)
```

## 📊 Métricas de Éxito (Hackathon)

### Técnicas
- ✅ Contrato Ultrahonk verifier desplegado y funcionando
- ✅ Al menos 2 circuitos Noir compilados y generando proofs
- ✅ Integración con Soroban verificando proofs on-chain
- ✅ DeFindex integrado con datos agregados

### Funcionales
- ✅ Usuarios pueden crear metas de ahorro
- ✅ Sistema genera proofs cuando se alcanzan metas
- ✅ Rankings anónimos funcionando
- ✅ Dashboard educativo con comparativas

### UX
- ✅ UI intuitiva para crear metas y ver progreso
- ✅ Visualización clara de rankings sin revelar datos
- ✅ Badges y recompensas visibles

## 🚧 Próximos Pasos Post-Hackathon

1. **Más Circuitos**: Comportamiento a largo plazo, consistencia, etc.
2. **Más Integraciones**: Más comercios con recompensas basadas en proofs
3. **Analytics Avanzados**: Más insights educativos con DeFindex
4. **Mobile App**: Extender a app móvil con generación de proofs
5. **Programas Institucionales**: Becas y préstamos basados en comportamiento probado

## 📚 Referencias

- [Ultrahonk Soroban Contract](https://github.com/tupui/ultrahonk_soroban_contract)
- [Noir Documentation](https://noir-lang.org/)
- [Stellar Soroban Docs](https://developers.stellar.org/docs/smart-contracts)
- [DeFindex Documentation](https://defindex.io/docs) (si está disponible)

---

**Este plan transforma PumaPay en una plataforma de educación financiera que protege la privacidad mientras incentiva el ahorro responsable mediante ZK proofs y comparativas anónimas.**

