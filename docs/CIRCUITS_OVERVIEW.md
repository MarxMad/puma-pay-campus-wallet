# 🔐 Resumen de Circuitos ZK en PumaPay

## ✅ Circuitos Implementados

### **1. Savings Proof** (`circuits/savings-proof/`)
**Propósito**: Verificar que un usuario alcanzó su meta de ahorro sin revelar el balance exacto.

**Parámetros:**
- `balance` (privado): Balance actual del usuario
- `target_amount` (privado): Meta de ahorro
- Retorna: Diferencia pública (`balance - target_amount`)

**Estado**: ✅ Funcionando

---

### **2. User Verification** (`circuits/user-verification/`)
**Propósito**: Verificar que un usuario cumple requisitos (edad, estudiante activo, semestre) sin revelar datos personales.

**Parámetros:**
- `age` (privado): Edad del usuario
- `is_student_active` (privado): 1 = activo, 0 = inactivo
- `semester` (privado): Semestre actual
- `min_age` (público): Edad mínima requerida
- `min_semester` (público): Semestre mínimo requerido

**Estado**: ✅ Funcionando

---

### **3. Achievements** (`circuits/achievements/`)
**Propósito**: Verificar que un usuario cumple requisitos para obtener logros (badges) sin revelar datos financieros exactos.

**Parámetros:**
- `savings_months` (privado): Meses consecutivos de ahorro
- `total_savings` (privado): Ahorro total acumulado
- `transactions_count` (privado): Número de transacciones
- `budget_compliance_rate` (privado): Porcentaje de cumplimiento
- Retorna: Nivel de logro (1 = Bronze, 2 = Silver, 3 = Gold)

**Estado**: ✅ Funcionando

---

## 📁 Estructura de Archivos

```
circuits/
├── savings-proof/
│   ├── Nargo.toml
│   ├── Prover.toml          # Valores de entrada
│   ├── Verifier.toml        # Generado automáticamente
│   ├── src/
│   │   └── main.nr          # Circuito
│   ├── proofs/              # Proofs generados
│   └── target/              # Artefactos compilados
│
├── user-verification/
│   ├── Nargo.toml
│   ├── Prover.toml
│   ├── src/
│   │   └── main.nr
│   └── proofs/
│
└── achievements/
    ├── Nargo.toml
    ├── Prover.toml
    ├── src/
    │   └── main.nr
    └── proofs/
```

---

## 🔄 Flujo de Uso

### **1. Editar `Prover.toml`**
Poner los valores que quieres probar

### **2. Generar Proof**
```bash
cd circuits/<circuito>
/Users/gerryp/.nargo/bin/nargo prove
```

### **3. Verificar Proof**
```bash
/Users/gerryp/.nargo/bin/nargo verify
```

---

## 🚀 Próximos Circuitos a Implementar

1. **Budget Compliance** - Verificar cumplimiento de presupuesto
2. **Consistent Savings** - Verificar ahorro consistente por N meses
3. **Transaction Limits** - Verificar que no se excedieron límites

---

## 📚 Documentación

- [Cómo usar nargo prove](./HOW_TO_USE_NARGO_PROVE.md)
- [Flujo de datos ZK](./ZK_PROOF_DATA_FLOW.md)
- [Verificar proofs reales](./HOW_TO_VERIFY_REAL_PROOF.md)

