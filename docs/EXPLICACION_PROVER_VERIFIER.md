# 📚 Explicación: Prover.toml vs Verifier.toml

## ❓ ¿Por qué no veo la prueba en la consola?

**Respuesta corta**: Si no ves output, es porque el proof **falló** o ya estaba generado. Te explico todo:

---

## 📝 ¿Qué es `Prover.toml`?

**`Prover.toml`** = Valores de ENTRADA para GENERAR el proof

```toml
balance = "600"        # ← Valor que pasas al circuito
target_amount = "500"  # ← Valor que pasas al circuito
```

**Cuándo se usa**: Cuando ejecutas `nargo prove`
- Lee estos valores
- Los pasa al circuito `main.nr`
- Genera el proof si `balance >= target_amount`
- Guarda el proof en `proofs/savings_proof.proof`

---

## 📝 ¿Qué es `Verifier.toml`?

**`Verifier.toml`** = Valores PÚBLICOS para VERIFICAR el proof

```toml
return = "0x0000000000000000000000000000000000000000000000000000000000000064"
```

**Cuándo se usa**: Cuando ejecutas `nargo verify`
- Lee el proof generado
- Verifica que el proof es válido
- Usa los valores públicos (return) para verificar

**Nota**: `Verifier.toml` se genera automáticamente cuando ejecutas `nargo prove`. NO lo editas manualmente.

---

## 🔄 Flujo Completo

### **1. Generar Proof (`nargo prove`)**

```bash
cd circuits/savings-proof
nargo prove
```

**Lo que hace:**
1. Lee `Prover.toml`:
   ```toml
   balance = "600"
   target_amount = "500"
   ```

2. Ejecuta el circuito:
   ```rust
   main(balance: 600, target_amount: 500)
   // Verifica: 600 >= 500 ✅
   // Retorna: 100 (diferencia)
   ```

3. Genera el proof en `proofs/savings_proof.proof`

4. Genera `Verifier.toml` automáticamente:
   ```toml
   return = "0x0000000000000000000000000000000000000000000000000000000000000064"
   # (100 en hexadecimal)
   ```

**Output en consola:**
```
✅ Proof generado exitosamente
📁 Ubicación: proofs/savings_proof.proof
```

### **2. Verificar Proof (`nargo verify`)**

```bash
nargo verify
```

**Lo que hace:**
1. Lee el proof de `proofs/savings_proof.proof`
2. Lee `Verifier.toml` (valores públicos)
3. Verifica que el proof es válido

**Output en consola:**
```
✅ Proof verificado exitosamente
```

---

## ❌ ¿Por qué no veo output?

### **Caso 1: El proof falló**

Si en `Prover.toml` tienes:
```toml
balance = "400"
target_amount = "500"
```

Y ejecutas `nargo prove`, verás:
```
error: Assertion failed: 'balance is below target'
```

**Solución**: Cambia los valores en `Prover.toml`:
```toml
balance = "600"      # ← Mayor o igual que target
target_amount = "500"
```

### **Caso 2: El proof ya existe**

Si el proof ya fue generado y no cambiaste `Prover.toml`, `nargo prove` puede no mostrar output o mostrar un mensaje de que ya existe.

**Solución**: 
- Cambia los valores en `Prover.toml` para generar un nuevo proof
- O borra el proof anterior: `rm proofs/savings_proof.proof`

### **Caso 3: nargo no muestra output detallado**

Por defecto, `nargo prove` solo muestra errores. Si todo está bien, puede no mostrar nada.

**Solución**: Verifica que el proof se generó:
```bash
ls -lh proofs/savings_proof.proof
cat proofs/savings_proof.proof
```

---

## 🧪 Prueba Completa Paso a Paso

### **Paso 1: Configurar valores válidos**

```bash
cd circuits/savings-proof
cat > Prover.toml << EOF
balance = "600"
target_amount = "500"
EOF
```

### **Paso 2: Generar proof**

```bash
/Users/gerryp/.nargo/bin/nargo prove
```

**Deberías ver:**
- Si funciona: El proof se genera (puede no mostrar output, pero el archivo se crea)
- Si falla: Verás el error de assertion

### **Paso 3: Verificar que se generó**

```bash
ls -lh proofs/
# Deberías ver: savings_proof.proof

cat proofs/savings_proof.proof
# Deberías ver: Un string hexadecimal largo
```

### **Paso 4: Verificar el proof**

```bash
/Users/gerryp/.nargo/bin/nargo verify
```

**Deberías ver:**
```
✅ Proof verificado exitosamente
```

---

## 📋 Resumen

| Archivo | Propósito | ¿Lo editas? |
|---------|-----------|-------------|
| **`Prover.toml`** | Valores de entrada para generar proof | ✅ **SÍ** - Aquí pones balance y target |
| **`Verifier.toml`** | Valores públicos para verificar | ❌ **NO** - Se genera automáticamente |

**Flujo:**
1. Editas `Prover.toml` con tus valores
2. Ejecutas `nargo prove` → Genera proof
3. Ejecutas `nargo verify` → Verifica proof

---

## 🔧 Tu Caso Actual

Tienes en `Prover.toml`:
```toml
balance = "400"
target_amount = "500"
```

**Problema**: 400 < 500, entonces el proof falla.

**Solución**: Cambia a:
```toml
balance = "600"
target_amount = "500"
```

Luego ejecuta:
```bash
/Users/gerryp/.nargo/bin/nargo prove
```

---

## 💡 Tips

1. **Siempre verifica que `balance >= target_amount`** antes de ejecutar
2. **El proof se guarda en `proofs/`** aunque no veas output
3. **Usa `nargo verify`** para confirmar que el proof es válido
4. **`Verifier.toml` se genera automáticamente** - no lo edites

