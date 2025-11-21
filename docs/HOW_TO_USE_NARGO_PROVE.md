# 🔧 Cómo Usar `nargo prove` - Establecer Parámetros

## ❓ ¿Cómo se establecen los parámetros cuando ejecuto `nargo prove`?

**Respuesta**: Los parámetros se establecen en el archivo **`Prover.toml`** que está en el directorio del circuito.

---

## 📝 Archivo `Prover.toml`

Cuando ejecutas `nargo prove`, Noir busca el archivo `Prover.toml` en el directorio del circuito y lee los valores de ahí.

### **Ubicación:**
```
circuits/savings-proof/
├── Nargo.toml          # Configuración del proyecto
├── Prover.toml         # ⭐ Valores de entrada para el proof
├── src/
│   └── main.nr         # Circuito
└── proofs/             # Proofs generados
```

### **Formato de `Prover.toml`:**

```toml
balance = "600"
target_amount = "500"
```

**Importante:**
- Los valores deben ser strings (entre comillas)
- Los nombres deben coincidir con los parámetros del circuito
- El orden no importa

---

## 🔄 Flujo Cuando Ejecutas `nargo prove`

### **Paso 1: Ejecutas el comando**
```bash
cd circuits/savings-proof
nargo prove
```

### **Paso 2: Noir lee `Prover.toml`**
```
nargo prove
  ↓
Lee Prover.toml
  ↓
balance = "600"
target_amount = "500"
```

### **Paso 3: Pasa valores al circuito**
```rust
// main.nr
fn main(balance: u64, target_amount: u64) -> pub u64 {
    // balance = 600 (viene de Prover.toml)
    // target_amount = 500 (viene de Prover.toml)
    assert(balance >= target_amount, "balance is below target");
    balance - target_amount
}
```

### **Paso 4: Genera el proof**
```
✅ Proof generado en: proofs/savings_proof.proof
```

---

## 🧪 Cómo Hacer Diferentes Pruebas

### **Método 1: Editar `Prover.toml` directamente**

```bash
# Editar el archivo
nano circuits/savings-proof/Prover.toml
# o
code circuits/savings-proof/Prover.toml
```

**Ejemplo 1: Balance mayor que meta**
```toml
balance = "1000"
target_amount = "500"
```

**Ejemplo 2: Balance igual a meta**
```toml
balance = "500"
target_amount = "500"
```

**Ejemplo 3: Balance menor que meta (debería fallar)**
```toml
balance = "300"
target_amount = "500"
```

Luego ejecuta:
```bash
cd circuits/savings-proof
nargo prove
```

### **Método 2: Usar script para cambiar valores**

Crea un script `test-proof.sh`:

```bash
#!/bin/bash

# test-proof.sh
BALANCE=$1
TARGET=$2

if [ -z "$BALANCE" ] || [ -z "$TARGET" ]; then
  echo "Uso: ./test-proof.sh <balance> <target>"
  echo "Ejemplo: ./test-proof.sh 1000 500"
  exit 1
fi

cd circuits/savings-proof

# Actualizar Prover.toml
cat > Prover.toml << EOF
balance = "$BALANCE"
target_amount = "$TARGET"
EOF

# Generar proof
echo "Generando proof con balance=$BALANCE, target=$TARGET..."
nargo prove

if [ $? -eq 0 ]; then
  echo "✅ Proof generado exitosamente"
else
  echo "❌ Error generando proof"
fi
```

**Uso:**
```bash
chmod +x test-proof.sh
./test-proof.sh 1000 500
./test-proof.sh 750 600
./test-proof.sh 300 500  # Debería fallar
```

### **Método 3: Usar variables de entorno (avanzado)**

Puedes crear un script que use variables:

```bash
#!/bin/bash
# test-with-env.sh

BALANCE=${1:-600}  # Default 600
TARGET=${2:-500}   # Default 500

cd circuits/savings-proof

echo "balance = \"$BALANCE\"" > Prover.toml
echo "target_amount = \"$TARGET\"" >> Prover.toml

nargo prove
```

**Uso:**
```bash
./test-with-env.sh          # Usa defaults (600, 500)
./test-with-env.sh 1000 800 # Usa 1000, 800
```

---

## 📋 Ejemplos de Pruebas

### **Prueba 1: Meta alcanzada**
```bash
cd circuits/savings-proof
cat > Prover.toml << EOF
balance = "1000"
target_amount = "500"
EOF
nargo prove
# ✅ Debería generar proof exitosamente
```

### **Prueba 2: Meta exacta**
```bash
cat > Prover.toml << EOF
balance = "500"
target_amount = "500"
EOF
nargo prove
# ✅ Debería generar proof (balance >= target es true)
```

### **Prueba 3: Meta no alcanzada (debería fallar)**
```bash
cat > Prover.toml << EOF
balance = "300"
target_amount = "500"
EOF
nargo prove
# ❌ Debería fallar con: "balance is below target"
```

### **Prueba 4: Valores grandes**
```bash
cat > Prover.toml << EOF
balance = "1000000"
target_amount = "500000"
EOF
nargo prove
# ✅ Debería funcionar con valores grandes
```

---

## 🔍 Verificar el Proof Generado

Después de generar el proof, puedes verificar:

```bash
# Ver el proof generado
cat circuits/savings-proof/proofs/savings_proof.proof

# Verificar el proof
cd circuits/savings-proof
nargo verify
```

---

## 🛠️ Script Completo de Pruebas

Crea `test-multiple-proofs.sh`:

```bash
#!/bin/bash

cd circuits/savings-proof

echo "🧪 Ejecutando múltiples pruebas..."

# Prueba 1: Balance mayor
echo "Prueba 1: balance=1000, target=500"
cat > Prover.toml << EOF
balance = "1000"
target_amount = "500"
EOF
nargo prove && echo "✅ Prueba 1 exitosa" || echo "❌ Prueba 1 falló"

# Prueba 2: Balance igual
echo "Prueba 2: balance=500, target=500"
cat > Prover.toml << EOF
balance = "500"
target_amount = "500"
EOF
nargo prove && echo "✅ Prueba 2 exitosa" || echo "❌ Prueba 2 falló"

# Prueba 3: Balance menor (debería fallar)
echo "Prueba 3: balance=300, target=500 (debería fallar)"
cat > Prover.toml << EOF
balance = "300"
target_amount = "500"
EOF
nargo prove && echo "⚠️ Prueba 3: No debería pasar" || echo "✅ Prueba 3: Falló correctamente"

echo "🎉 Pruebas completadas"
```

**Uso:**
```bash
chmod +x test-multiple-proofs.sh
./test-multiple-proofs.sh
```

---

## 📝 Resumen

1. **`nargo prove` lee `Prover.toml`** para obtener los valores
2. **Para cambiar valores**: Edita `Prover.toml` antes de ejecutar `nargo prove`
3. **Para pruebas rápidas**: Usa scripts que actualicen `Prover.toml` automáticamente
4. **El circuito recibe los valores** de `Prover.toml` como parámetros

---

## 💡 Tips

- **Guarda diferentes configuraciones**: Crea `Prover.toml.example1`, `Prover.toml.example2`, etc.
- **Usa scripts**: Automatiza las pruebas con scripts bash
- **Verifica siempre**: Usa `nargo verify` para verificar los proofs generados
- **Limpia proofs antiguos**: `rm proofs/*.proof` antes de nuevas pruebas

