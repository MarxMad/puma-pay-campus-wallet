# 🧪 Guía de Pruebas - ZK Proofs desde el Frontend

## ✅ Checklist Pre-Prueba

Antes de empezar, verifica que todo esté configurado:

### 1. Variables de Entorno

Crea o actualiza tu archivo `.env` en la raíz del proyecto:

```env
# Contrato Savings Goals (desplegado en testnet)
VITE_SAVINGS_GOALS_CONTRACT=CDSYLJVCXZKXCTEGRFJXEWL4VYLN5HRZ5ILZ266PTKO3QU6GMK6EHXKD

# Red Stellar
VITE_STELLAR_NETWORK=testnet

# Backend URL (ajusta el puerto si es diferente)
VITE_BACKEND_URL=http://localhost:3001
```

### 2. Backend Corriendo

```bash
# En una terminal, inicia el backend
cd backend
npm start
# o
node index.js
```

Verifica que el backend esté respondiendo:
```bash
curl http://localhost:3001/api/health
```

### 3. Frontend Corriendo

```bash
# En otra terminal, inicia el frontend
npm run dev
```

### 4. Usuario Autenticado

Asegúrate de estar logueado en la aplicación con una cuenta que tenga:
- Una dirección Stellar válida
- Saldo suficiente para crear metas

---

## 🚀 Flujo de Prueba Paso a Paso

### Paso 1: Crear una Meta de Ahorro

1. **Navega a la página de Savings Goals**
   - Ve a `/savings-goals` en el frontend
   - O haz clic en el menú de navegación

2. **Crea una nueva meta**
   - Haz clic en el botón "Crear Meta" o "+"
   - Ingresa un monto objetivo (ej: `500`)
   - Opcional: Selecciona una fecha límite
   - Haz clic en "Crear"

3. **Verifica que la meta se creó**
   - Deberías ver la meta en la lista
   - Si el contrato está configurado, se guardará on-chain
   - Si no, se guardará localmente

**Qué esperar:**
- ✅ Toast de éxito: "Meta creada"
- ✅ La meta aparece en la lista
- ✅ Muestra el progreso (0% inicialmente)

---

### Paso 2: Simular que Alcanzaste la Meta

Para probar el flujo completo, necesitas que tu balance sea mayor o igual al objetivo.

**Opción A: Ajustar el balance temporalmente (para testing)**

1. Abre las DevTools del navegador (F12)
2. En la consola, ejecuta:
   ```javascript
   // Guardar balance original
   const originalBalance = localStorage.getItem('pumapay_balance');
   
   // Establecer balance temporal para testing
   localStorage.setItem('pumapay_balance', '600'); // Mayor que tu meta (500)
   ```
3. Recarga la página

**Opción B: Crear una meta menor que tu balance actual**

Si tu balance actual es, por ejemplo, 1000 XLM:
- Crea una meta de 500 XLM
- Ya estarás por encima del objetivo

---

### Paso 3: Generar el Proof ZK

1. **En la página de Savings Goals**
   - Busca la meta que creaste
   - Si tu balance >= objetivo, verás un botón "Generar Proof" o "Reclamar Recompensa"

2. **Haz clic en "Generar Proof" o "Reclamar"**
   - Esto iniciará el proceso de generación del proof

**Qué está pasando detrás de escena:**
1. Frontend llama a `/api/zk/generate-proof` con `balance` y `targetAmount`
2. Backend ejecuta `nargo prove` para generar el proof real
3. Backend crea el `proofBlob` en el formato correcto
4. Frontend recibe el proof y el proofBlob

**Qué esperar:**
- ⏳ Indicador de carga mientras se genera el proof
- ✅ Toast de éxito: "Proof generado exitosamente"
- ⚠️ Si hay error, verás un mensaje descriptivo

**Posibles errores:**
- ❌ "nargo no está disponible" → Instala nargo
- ❌ "balance debe ser mayor o igual a targetAmount" → Ajusta el balance
- ❌ "Error generando proof" → Revisa los logs del backend

---

### Paso 4: Verificar el Proof en el Contrato

Después de generar el proof, automáticamente se enviará al contrato.

**Qué está pasando:**
1. Frontend envía el `proofBlob` al contrato `savings-goals`
2. El contrato llama al `simple-verifier` para validar
3. El verificador valida el formato y retorna `proof_id`
4. El contrato marca la meta como `achieved = true`

**Qué esperar:**
- ✅ Toast: "Meta lograda y verificada on-chain"
- ✅ La meta muestra un badge de "Completada" o "Lograda"
- ✅ Se muestra el `proof_id` (opcional)

**Si hay error:**
- ❌ "Contrato no configurado" → Verifica `VITE_SAVINGS_GOALS_CONTRACT`
- ❌ "Error verificando proof" → Revisa los logs del backend
- ❌ "Usuario no autenticado" → Asegúrate de estar logueado

---

## 🔍 Verificación Manual

### Verificar en el Backend

Revisa los logs del backend para ver el proceso:

```bash
# Deberías ver algo como:
📥 Endpoint /api/zk/generate-proof llamado
🔄 Ejecutando nargo prove...
✅ Proof generado exitosamente con nargo
📦 Proof blob creado: 14116 bytes
```

### Verificar en el Contrato (Opcional)

Puedes verificar directamente en el contrato usando Stellar CLI:

```bash
# Obtener la meta del usuario
stellar contract invoke \
  --id CDSYLJVCXZKXCTEGRFJXEWL4VYLN5HRZ5ILZ266PTKO3QU6GMK6EHXKD \
  --source-account issuer \
  --network testnet \
  -- get_savings_goal \
  --user <tu_direccion_stellar>
```

Deberías ver:
- `achieved: true`
- `proof_id: <hash>`

---

## 🐛 Troubleshooting

### El botón "Generar Proof" no aparece

**Causa**: El balance no es suficiente o la meta no está activa.

**Solución**:
1. Verifica tu balance actual
2. Asegúrate de que `balance >= targetAmount`
3. Recarga la página

### Error: "nargo no está disponible"

**Causa**: El backend no puede encontrar nargo.

**Solución**:
```bash
# Instalar nargo
curl -L https://noir-lang.github.io/noirup/install | bash
source ~/.nargo/env

# Verificar instalación
nargo --version

# Reiniciar el backend
```

### Error: "Contrato no configurado"

**Causa**: La variable de entorno no está configurada.

**Solución**:
1. Verifica que `.env` existe y tiene `VITE_SAVINGS_GOALS_CONTRACT`
2. Reinicia el servidor de desarrollo (`npm run dev`)
3. Limpia la caché del navegador

### El proof se genera pero no se verifica

**Causa**: El contrato no está configurado o hay error en la verificación.

**Solución**:
1. Verifica los logs del backend
2. Verifica que el verificador simple esté desplegado
3. Verifica que `savings-goals` tenga configurado el verificador

### El proof se genera pero tarda mucho

**Causa**: `nargo prove` puede tardar 10-30 segundos.

**Solución**:
- Es normal que tarde, especialmente la primera vez
- Muestra un indicador de carga al usuario
- Considera aumentar el timeout en el backend si es necesario

---

## 📊 Flujo Completo Visual

```
Usuario
  │
  ├─> Crea Meta (500 XLM)
  │   └─> Frontend → Backend → Contrato (set_savings_goal)
  │
  ├─> Balance alcanza 600 XLM
  │
  ├─> Click "Generar Proof"
  │   │
  │   ├─> Frontend → Backend (/api/zk/generate-proof)
  │   │   │
  │   │   ├─> Backend ejecuta: nargo prove
  │   │   ├─> Backend crea: proofBlob
  │   │   └─> Backend retorna: { proof, proofBlob, proofId }
  │   │
  │   └─> Frontend recibe proof
  │       │
  │       └─> Frontend → Backend → Contrato (submit_proof)
  │           │
  │           ├─> Contrato → Verificador (verify_proof_with_stored_vk)
  │           │   └─> Verificador valida formato y retorna proof_id
  │           │
  │           └─> Contrato marca: achieved = true
  │
  └─> Meta marcada como lograda ✅
```

---

## ✅ Checklist de Éxito

Al final del flujo, deberías tener:

- [ ] Meta creada y visible en la lista
- [ ] Proof generado exitosamente (toast de éxito)
- [ ] Meta marcada como "Lograda" o "Completada"
- [ ] `proof_id` visible (opcional)
- [ ] Sin errores en la consola del navegador
- [ ] Sin errores en los logs del backend

---

## 🎯 Próximos Pasos

Una vez que el flujo básico funcione:

1. **Probar con diferentes montos**: Prueba con metas pequeñas y grandes
2. **Probar con fechas límite**: Crea metas con deadline
3. **Probar múltiples metas**: Crea varias metas y prueba el flujo
4. **Verificar on-chain**: Usa Stellar Explorer para ver las transacciones
5. **Probar errores**: Intenta generar proof con balance insuficiente

---

## 📝 Notas

- El verificador simple actualmente solo valida formato, no verificación criptográfica completa
- Los proofs pueden tardar 10-30 segundos en generarse
- El backend debe tener nargo instalado y funcionando
- Las transacciones on-chain requieren que el usuario tenga fondos en testnet

