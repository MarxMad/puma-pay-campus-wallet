# 🔄 Flujo de Datos para ZK Proofs - ¿De dónde vienen balance y meta?

## ❓ Pregunta: ¿Cómo sabe el circuito el balance y la meta?

**Respuesta**: El circuito **NO los "sabe"**. Los **recibe como parámetros** cuando se ejecuta `nargo prove`.

---

## 📊 Cómo Funciona el Circuito

### **El Circuito (`main.nr`):**

```rust
fn main(balance: u64, target_amount: u64) -> pub u64 {
    assert(balance >= target_amount, "balance is below target");
    balance - target_amount
}
```

**Lo que hace:**
1. Recibe `balance` y `target_amount` como parámetros
2. Verifica que `balance >= target_amount`
3. Retorna la diferencia (público)
4. **NO revela** los valores exactos de `balance` ni `target_amount`

---

## 🔄 Flujo Completo: De Dónde Vienen los Datos

### **1. Balance del Usuario**

El balance debe venir del sistema real de PumaPay:

```typescript
// Opción 1: Desde el hook useBalance (recomendado)
import { useBalance } from '@/hooks/useBalance';
const { balance } = useBalance(); // Balance REAL del usuario

// Opción 2: Desde blockchain directamente
import { ethersBalanceService } from '@/services/ethersBalance';
const balance = await ethersBalanceService.getMXNBBalance(userAddress);

// Opción 3: Desde Juno API
import { junoService } from '@/services/junoService';
const balance = await junoService.getBalance();
```

### **2. Meta de Ahorro**

La meta debe venir del contrato Soroban:

```typescript
import { sorobanService } from '@/services/sorobanService';

const goal = await sorobanService.getSavingsGoal(
  userAddress,
  SAVINGS_GOALS_CONTRACT_ADDRESS
);
const targetAmount = goal.targetAmount; // Meta REAL del contrato
```

---

## 🛠️ Cómo Conectar el Demo con Datos Reales

### **Problema Actual:**

En `ZKDemo.tsx` los valores están hardcodeados:
```typescript
const [balance, setBalance] = useState(600); // ❌ Hardcodeado
const [targetAmount, setTargetAmount] = useState(500); // ❌ Hardcodeado
```

### **Solución: Usar Datos Reales**

```typescript
import { useBalance } from '@/hooks/useBalance';
import { useAuth } from '@/contexts/AuthContext';
import { sorobanService } from '@/services/sorobanService';

export const ZKDemo: React.FC = () => {
  const { balance: realBalance, refreshBalance } = useBalance(); // ✅ Balance REAL
  const { user } = useAuth();
  const [targetAmount, setTargetAmount] = useState<number | null>(null);
  const [loadingGoal, setLoadingGoal] = useState(true);

  // Cargar meta del contrato al montar
  useEffect(() => {
    const loadGoal = async () => {
      if (!user?.address) return;
      
      try {
        const goal = await sorobanService.getSavingsGoal(
          user.address,
          import.meta.env.VITE_SAVINGS_GOALS_CONTRACT || ''
        );
        
        if (goal.targetAmount) {
          setTargetAmount(goal.targetAmount);
        } else {
          // Si no tiene meta, usar valor por defecto o pedir al usuario
          setTargetAmount(500); // Valor por defecto
        }
      } catch (error) {
        console.error('Error cargando meta:', error);
        setTargetAmount(500); // Fallback
      } finally {
        setLoadingGoal(false);
      }
    };
    
    loadGoal();
  }, [user?.address]);

  const handleGenerateProof = async () => {
    if (!realBalance || !targetAmount) {
      setError('Balance o meta no disponibles');
      return;
    }
    
    // Usar valores REALES
    const result = await zkProofService.generateProof({
      balance: realBalance,      // ✅ Balance REAL
      targetAmount: targetAmount, // ✅ Meta REAL
    });
    // ...
  };

  // ...
};
```

---

## 📝 Cómo se Pasan los Valores al Circuito

### **Paso 1: Frontend envía valores al backend**

```typescript
// Frontend
await zkProofService.generateProof({
  balance: 600,        // Del sistema real
  targetAmount: 500,   // Del contrato Soroban
});
```

### **Paso 2: Backend actualiza Prover.toml**

```javascript
// backend/index.js
const proverToml = `balance = "600"
target_amount = "500"
`;

await fs.writeFile(
  path.join(circuitPath, 'Prover.toml'),
  proverToml
);
```

### **Paso 3: Backend ejecuta nargo prove**

```bash
cd circuits/savings-proof
nargo prove
```

**Lo que hace `nargo prove`:**
1. Lee `Prover.toml`: `balance = "600"`, `target_amount = "500"`
2. Pasa estos valores al circuito:
   ```rust
   main(balance: 600, target_amount: 500) // ✅ Valores reales
   ```
3. El circuito verifica: `600 >= 500` ✅
4. Genera proof que demuestra esto sin revelar 600 ni 500
5. Solo revela la diferencia: `100` (público)

---

## ✅ Resumen

1. **El circuito está bien** ✅ - Recibe parámetros correctamente
2. **El problema**: En el demo usas valores hardcodeados (600, 500)
3. **La solución**: 
   - Balance: Usar `useBalance()` para obtener balance real
   - Meta: Usar `sorobanService.getSavingsGoal()` para obtener meta del contrato
4. **El flujo**:
   - Frontend obtiene datos reales → Envía al backend → Backend actualiza Prover.toml → nargo prove → Circuito verifica

---

## 🚀 Próximo Paso

Actualizar `ZKDemo.tsx` para usar datos reales en lugar de valores hardcodeados. ¿Quieres que lo haga ahora?
