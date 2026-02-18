# 🔄 Cómo Resetear PumaPay Campus a Cero

## 🎯 Para empezar con balance $0.00 y sin transacciones

### Método 1: Usando la consola del navegador (Más fácil)

1. **Abre la consola del navegador**:
   - Chrome/Safari: `F12` o `Cmd+Option+I` (Mac)
   - Pega este código:

```javascript
// Limpiar todos los datos de PumaPay
localStorage.removeItem('pumapay_initialized');
localStorage.removeItem('pumapay_mxnb_balance');
localStorage.removeItem('pumapay_transactions');
localStorage.removeItem('pumapay_global_budget');
console.log('✅ Datos limpiados! Recargando...');
window.location.reload();
```

### Método 2: Usando el Debug Panel

1. Ve a: `http://localhost:8080/debug`
2. Clic en **"Inicializar Limpio"** o **"Reset a Cero"**

### Método 3: Limpiar Storage completo

```javascript
// En consola del navegador - limpia TODO
Object.keys(localStorage)
  .filter(key => key.startsWith('pumapay_'))
  .forEach(key => localStorage.removeItem(key));
window.location.reload();
```

## ✅ Resultado Esperado

Después de ejecutar cualquier método:

- **Balance**: $0.00 MXNB
- **Transacciones**: Array vacío (sin historial)
- **Presupuesto**: $2,500 límite mensual, $0 gastado
- **Categorías**: Solo las predeterminadas
- **Gráfico semanal**: Barras grises (sin gastos)

## 🧪 Para Probar el Sistema

1. **Empezar desde cero** (balance $0.00)
2. **Ir a `/receive`** → "Simular Mesada $100" → Balance: $100.00
3. **Ir a `/send`** → Enviar $30 → Balance: $70.00
4. **Ver en `/home`** → Transacciones reales, balance actualizado

## 🔍 Verificar Estado

```javascript
// En consola del navegador
console.log('Balance:', JSON.parse(localStorage.getItem('pumapay_mxnb_balance')));
console.log('Transacciones:', JSON.parse(localStorage.getItem('pumapay_transactions')));
console.log('Inicializado:', localStorage.getItem('pumapay_initialized'));
```

---

**Nota**: Si ves balances extraños como $609.86, ejecuta cualquiera de estos métodos para empezar limpio. 