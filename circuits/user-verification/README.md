# 🔐 Circuito de Verificación de Usuario

## 📋 Descripción

Este circuito verifica que un usuario cumple requisitos básicos (edad, estudiante activo, semestre) sin revelar sus datos personales exactos.

## 🎯 Casos de Uso

- Verificar elegibilidad para descuentos de estudiante
- Verificar acceso a eventos del campus
- Verificar requisitos para programas especiales
- Verificar identidad sin revelar datos personales

## 🔧 Parámetros

### **Entrada (Privados):**
- `age`: Edad del usuario
- `is_student_active`: 1 = activo, 0 = inactivo
- `semester`: Semestre actual del estudiante

### **Entrada (Públicos):**
- `min_age`: Edad mínima requerida
- `min_semester`: Semestre mínimo requerido

### **Salida (Pública):**
- Código de verificación (valor calculado que indica verificación exitosa)

## 📝 Uso

### **1. Editar `Prover.toml`:**

```toml
age = "20"
is_student_active = "1"
semester = "5"
min_age = "18"
min_semester = "1"
```

### **2. Generar proof:**

```bash
cd circuits/user-verification
/Users/gerryp/.nargo/bin/nargo prove
```

### **3. Verificar proof:**

```bash
/Users/gerryp/.nargo/bin/nargo verify
```

## ✅ Verificaciones

El circuito verifica:
1. ✅ `age >= min_age` (usuario tiene edad mínima)
2. ✅ `is_student_active == 1` (usuario es estudiante activo)
3. ✅ `semester >= min_semester` (usuario está en semestre mínimo o superior)

## 🔒 Privacidad

**Se revela:**
- ✅ Código de verificación (que indica que pasó todas las verificaciones)

**NO se revela:**
- 🔒 Edad exacta
- 🔒 Semestre exacto
- 🔒 Estado de estudiante (solo que es activo)

## 📊 Ejemplos

### **Ejemplo 1: Usuario elegible**
```toml
age = "20"
is_student_active = "1"
semester = "5"
min_age = "18"
min_semester = "1"
```
✅ Proof generado exitosamente

### **Ejemplo 2: Usuario menor de edad**
```toml
age = "17"
is_student_active = "1"
semester = "3"
min_age = "18"
min_semester = "1"
```
❌ Falla: "User is below minimum age"

### **Ejemplo 3: Usuario inactivo**
```toml
age = "20"
is_student_active = "0"
semester = "5"
min_age = "18"
min_semester = "1"
```
❌ Falla: "User is not an active student"

