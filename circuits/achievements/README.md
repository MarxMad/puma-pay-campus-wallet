# 🏆 Circuito de Logros y Achievements

## 📋 Descripción

Este circuito verifica que un usuario cumple requisitos para obtener logros (badges) basados en su comportamiento financiero, sin revelar datos exactos.

## 🎯 Casos de Uso

- Desbloquear badges de ahorrador (Bronze, Silver, Gold)
- Verificar elegibilidad para recompensas especiales
- Rankings anónimos de logros
- Gamificación financiera

## 🔧 Parámetros

### **Entrada (Privados):**
- `savings_months`: Meses consecutivos de ahorro
- `total_savings`: Ahorro total acumulado
- `transactions_count`: Número de transacciones realizadas
- `budget_compliance_rate`: Porcentaje de cumplimiento de presupuesto (0-100)

### **Entrada (Públicos):**
- `min_months`: Meses mínimos requeridos
- `min_total_savings`: Ahorro mínimo requerido
- `min_transactions`: Transacciones mínimas requeridas
- `min_compliance_rate`: Tasa mínima de cumplimiento requerida

### **Salida (Pública):**
- Código de logro: `1` = Bronze, `2` = Silver, `3` = Gold

## 📝 Uso

### **1. Editar `Prover.toml`:**

```toml
savings_months = "6"
total_savings = "3000"
transactions_count = "50"
budget_compliance_rate = "85"
min_months = "3"
min_total_savings = "1000"
min_transactions = "20"
min_compliance_rate = "70"
```

### **2. Generar proof:**

```bash
cd circuits/achievements
/Users/gerryp/.nargo/bin/nargo prove
```

### **3. Verificar proof:**

```bash
/Users/gerryp/.nargo/bin/nargo verify
```

## ✅ Verificaciones

El circuito verifica:
1. ✅ `savings_months >= min_months` (meses consecutivos suficientes)
2. ✅ `total_savings >= min_total_savings` (ahorro total suficiente)
3. ✅ `transactions_count >= min_transactions` (transacciones suficientes)
4. ✅ `budget_compliance_rate >= min_compliance_rate` (cumplimiento de presupuesto)

## 🏅 Niveles de Logro

### **Bronze (1):**
- Cumple requisitos mínimos

### **Silver (2):**
- `savings_months >= min_months * 2`
- `total_savings >= min_total_savings * 2`

### **Gold (3):**
- `savings_months >= min_months * 3`
- `total_savings >= min_total_savings * 3`

## 🔒 Privacidad

**Se revela:**
- ✅ Nivel de logro alcanzado (Bronze/Silver/Gold)
- ✅ Que cumplió todos los requisitos

**NO se revela:**
- 🔒 Meses exactos de ahorro
- 🔒 Ahorro total exacto
- 🔒 Número exacto de transacciones
- 🔒 Tasa exacta de cumplimiento

## 📊 Ejemplos

### **Ejemplo 1: Logro Gold**
```toml
savings_months = "9"        # >= 3 * 3 = 9 ✅
total_savings = "3000"      # >= 1000 * 3 = 3000 ✅
transactions_count = "50"   # >= 20 ✅
budget_compliance_rate = "85" # >= 70 ✅
```
✅ Proof generado → Retorna `3` (Gold)

### **Ejemplo 2: Logro Silver**
```toml
savings_months = "6"        # >= 3 * 2 = 6 ✅
total_savings = "2000"      # >= 1000 * 2 = 2000 ✅
transactions_count = "30"   # >= 20 ✅
budget_compliance_rate = "75" # >= 70 ✅
```
✅ Proof generado → Retorna `2` (Silver)

### **Ejemplo 3: Logro Bronze**
```toml
savings_months = "3"        # >= 3 ✅
total_savings = "1000"      # >= 1000 ✅
transactions_count = "25"   # >= 20 ✅
budget_compliance_rate = "70" # >= 70 ✅
```
✅ Proof generado → Retorna `1` (Bronze)

### **Ejemplo 4: No cumple requisitos**
```toml
savings_months = "2"        # < 3 ❌
total_savings = "500"       # < 1000 ❌
transactions_count = "10"   # < 20 ❌
budget_compliance_rate = "60" # < 70 ❌
```
❌ Falla: No cumple requisitos mínimos

