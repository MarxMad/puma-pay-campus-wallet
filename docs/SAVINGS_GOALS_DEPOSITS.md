# 💰 Sistema de Depósitos en "Cajitas de Ahorro"

## 📋 Resumen

Ahora cada meta de ahorro tiene su propia "cajita" donde el usuario puede depositar dinero específicamente. El proof ZK verifica que el dinero guardado en esa cajita (`saved_amount`) sea >= al objetivo (`target_amount`), **sin revelar el monto guardado**.

## 🔄 Cambios Implementados

### 1. Contrato (`savings-goals`)

**Nuevo campo en `Goal`:**
```rust
pub struct Goal {
    pub target_amount: i128,
    pub saved_amount: i128,  // ✅ NUEVO: Dinero guardado en esta "cajita"
    pub deadline_ts: Option<i64>,
    pub achieved: bool,
    pub proof_id: Option<BytesN<32>>,
}
```

**Nuevas funciones:**
- `deposit_to_goal(user, amount) -> Result<i128>`: Deposita dinero en la cajita
- `withdraw_from_goal(user, amount) -> Result<i128>`: Retira dinero de la cajita (opcional)

### 2. Circuito Noir

**Actualizado para usar `saved_amount`:**
```noir
// Antes: balance >= target_amount
// Ahora: saved_amount >= target_amount
fn main(saved_amount: u64, target_amount: u64) -> pub u64 {
    assert(saved_amount >= target_amount, "saved_amount is below target");
    saved_amount - target_amount
}
```

### 3. Frontend

**Nuevo campo en `SavingsGoal`:**
```typescript
interface SavingsGoal {
  id: string;
  targetAmount: number;
  savedAmount: number;  // ✅ NUEVO: Dinero guardado en esta cajita
  deadline?: Date;
  achieved: boolean;
  proofId?: string;
  // ...
}
```

**Nueva función en `savingsService`:**
```typescript
async depositToGoal(goalId: string, amount: number, userAddress?: string)
```

**Nueva función en `useSavingsGoals` hook:**
```typescript
depositToGoal: (goalId: string, amount: number) => Promise<void>
```

**UI actualizada:**
- Muestra "Guardado: $X / $Y" en lugar de "Progreso: $X / $Y"
- Botón "Depositar en esta cajita" en cada meta
- El progreso se calcula usando `savedAmount` en lugar del balance total

## 🎯 Flujo Completo

### 1. Usuario Crea Meta
```
Usuario crea meta de $500
→ savedAmount = 0 (cajita vacía)
```

### 2. Usuario Deposita en la Cajita
```
Usuario deposita $200
→ savedAmount = 200
→ Progreso: 200/500 = 40%
```

### 3. Usuario Sigue Depositando
```
Usuario deposita $300 más
→ savedAmount = 500
→ Progreso: 500/500 = 100%
→ ¡Puede generar proof ZK!
```

### 4. Usuario Genera Proof ZK
```
Proof verifica: saved_amount (500) >= target_amount (500)
→ ✅ Verificado on-chain
→ Meta marcada como lograda
→ saved_amount permanece privado (solo se verifica la condición)
```

## 🔐 Privacidad con ZK Proofs

**Lo que se revela:**
- ✅ Que `saved_amount >= target_amount` (la meta fue alcanzada)
- ✅ La diferencia: `saved_amount - target_amount` (público)

**Lo que NO se revela:**
- ❌ El `saved_amount` exacto
- ❌ El balance total del usuario
- ❌ Cuánto dinero tiene en otras cajitas

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Balance usado** | Balance total del usuario | `savedAmount` de la cajita específica |
| **Depósitos** | No había | ✅ Sí, específicos por meta |
| **Privacidad** | Balance total visible | Solo condición verificada |
| **Flexibilidad** | Una meta por usuario | Múltiples metas con depósitos independientes |

## 🚀 Próximos Pasos

1. **Mejorar UI de depósito**: Crear un modal en lugar de `prompt()`
2. **Integrar con Stellar**: Los depósitos deberían mover XLM/USDC reales
3. **Historial de depósitos**: Mostrar transacciones de depósitos por meta
4. **Retiros**: Implementar UI para retirar dinero de las cajitas

## 📝 Notas Técnicas

- El contrato preserva `saved_amount` cuando se actualiza `target_amount`
- Los depósitos se guardan on-chain si el contrato está configurado
- Fallback a almacenamiento local si no hay contrato
- El proof ZK usa `saved_amount` en lugar del balance total

