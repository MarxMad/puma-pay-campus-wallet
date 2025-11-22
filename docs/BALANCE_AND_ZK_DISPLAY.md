# 💰 Balance y Visualización de ZK Proofs

## 📊 ¿De dónde vienen los valores?

### Balance
El balance **NO está hardcodeado**. Se obtiene dinámicamente del frontend:

1. **Fuente principal**: Stellar blockchain
   - Se obtiene desde la cuenta del usuario usando `stellarService.getBalances(user.address)`
   - Prioriza USDC, si no hay USDC usa XLM nativo
   - Se actualiza automáticamente cuando hay transacciones

2. **Fuente secundaria**: Transacciones locales
   - Si no hay balance en Stellar, se calcula desde `localStorage` (transacciones guardadas)
   - Fórmula: `balance = totalIncome - totalExpenses`

3. **Hook usado**: `useBalance()`
   ```typescript
   const { balance } = useBalance();
   // balance.available contiene el balance actual
   ```

### Meta de Ahorro
La meta **NO está hardcodeada**. Se crea desde el frontend:

1. **Usuario ingresa el monto** en el formulario
2. **Se guarda** en el contrato `savings-goals` (on-chain) o localmente
3. **Se usa para comparar** con el balance actual

### Valores en el Proof
Cuando se genera el proof ZK:

```typescript
// En useSavingsGoals.tsx
const currentBalance = balance.balance || 0; // Del hook useBalance()
const targetAmount = goal.targetAmount; // De la meta creada

// Se envían al backend
await zkProofService.generateProof({
  balance: currentBalance,      // ✅ Del frontend (Stellar/localStorage)
  targetAmount: goal.targetAmount, // ✅ Del frontend (usuario)
});
```

---

## 🎨 Visualización de ZK Proofs en el Frontend

### Componentes Agregados

#### 1. `ZKProofBadge`
Badge reutilizable que muestra que se está usando ZK Proof:

```tsx
<ZKProofBadge variant="success" size="sm" />
```

**Variantes**:
- `default`: Azul (info)
- `success`: Verde (verificado)
- `info`: Púrpura (información)
- `warning`: Naranja (advertencia)

#### 2. `ZKProofInfo`
Panel informativo que explica qué son los ZK Proofs:

```tsx
<ZKProofInfo />
```

Muestra:
- Qué son los ZK Proofs
- Cómo protegen la privacidad
- Qué se verifica on-chain

### Ubicaciones en la UI

#### 1. **Hero Section (Balance)**
- Badge "ZK Protected" junto al balance
- Texto que indica que el balance viene de Stellar
- Muestra la dirección del usuario (primeros 8 caracteres)

#### 2. **Info Panel (Arriba del formulario)**
- Panel completo explicando ZK Proofs
- Beneficios de privacidad
- Qué se verifica on-chain

#### 3. **Lista de Metas**
- Badge "ZK Proof" en el header
- Badge verde en metas logradas con proof verificado

#### 4. **Estado de Meta Lograda**
- Badge "Verificado con ZK Proof"
- Proof ID visible (primeros 16 caracteres)
- Mensaje: "Tu balance real permanece privado"

#### 5. **Estado "Puedes Generar Proof"**
- Badge "🔒 Privado"
- Explicación: "El proof ZK demuestra que alcanzaste tu meta sin revelar tu balance real"

---

## 🔍 Flujo Visual Completo

### 1. Usuario Ve su Balance
```
Balance disponible          [ZK Protected]
$1,234.56 USDC
Balance obtenido desde Stellar (GCRHEPSA...)
```

### 2. Usuario Crea Meta
```
[Panel ZK Proof Info]
  🔒 Protección con Zero-Knowledge Proofs
  Demuestra que alcanzaste tu meta sin revelar tu balance real.
  • Tu balance permanece completamente privado
  • Solo se verifica que balance ≥ objetivo
  • Verificación on-chain en Stellar/Soroban

[Formulario]
  Monto objetivo: [500]
  El balance se obtiene automáticamente desde tu cuenta Stellar.
```

### 3. Meta Creada
```
Meta de ahorro
Objetivo: $500.00
Progreso: $1,234.56 / $500.00 (247.0%)
```

### 4. Puede Generar Proof
```
[🔒 Privado] ¡Puedes generar un proof ZK!
Tu balance es suficiente para alcanzar la meta.
✨ El proof ZK demuestra que alcanzaste tu meta sin revelar tu balance real
[Generar proof]
```

### 5. Proof Generado
```
¡Meta alcanzada!
🛡️ Verificado con ZK Proof
Proof ID: 0x19a4fa32ec79af...
Tu balance real permanece privado
[Reclamar recompensa]
```

---

## 📝 Mensajes Clave para el Usuario

### Privacidad
- ✅ "Tu balance real permanece privado"
- ✅ "Sin revelar tu balance real"
- ✅ "ZK Protected"

### Verificación
- ✅ "Verificado con ZK Proof"
- ✅ "Verificación on-chain en Stellar/Soroban"
- ✅ "Proof ID: 0x..."

### Transparencia
- ✅ "Balance obtenido desde Stellar (dirección...)"
- ✅ "El balance se obtiene automáticamente desde tu cuenta Stellar"

---

## 🎯 Resumen

### Valores NO Hardcodeados
- ✅ **Balance**: Se obtiene de Stellar o transacciones locales
- ✅ **Meta**: El usuario la ingresa en el formulario
- ✅ **Proof**: Se genera con valores reales del usuario

### Visualización de ZK
- ✅ Badges en múltiples lugares
- ✅ Panel informativo explicativo
- ✅ Mensajes claros sobre privacidad
- ✅ Indicadores visuales de verificación

### Flujo Completo
1. Usuario ve balance real (Stellar)
2. Usuario crea meta (input)
3. Sistema detecta cuando puede generar proof
4. Usuario genera proof (valores reales)
5. Proof se verifica on-chain
6. Meta marcada como lograda con badge ZK

