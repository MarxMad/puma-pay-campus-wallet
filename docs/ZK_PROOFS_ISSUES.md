# 🔐 Issues de GitHub para Implementación ZK Proofs

## Comandos para crear issues

### Issue 1: Setup y Contrato Base Ultrahonk

```bash
gh issue create \
  --title "Setup Ultrahonk Verifier Contract en Soroban" \
  --body "### Objetivo
Crear contrato base de verificación de proofs Ultrahonk en Soroban, basado en el ejemplo de \`ultrahonk_soroban_contract\`.

### Tareas
- Clonar y estudiar \`https://github.com/tupui/ultrahonk_soroban_contract\`
- Crear \`contracts/ultrahonk-verifier/\` con estructura Scarb
- Implementar función \`verify_proof\` que acepta proof, public inputs y verification key
- Compilar y desplegar en Stellar testnet
- Documentar proceso de verificación

### Referencias
- https://github.com/tupui/ultrahonk_soroban_contract
- Stellar Soroban Smart Contracts docs
" \
  --label stellar
```

### Issue 2: Contrato de Metas de Ahorro

```bash
gh issue create \
  --title "Contrato Soroban: Savings Goals (Metas de Ahorro)" \
  --body "### Objetivo
Crear contrato Soroban que gestiona metas de ahorro y verifica proofs de cumplimiento.

### Tareas
- Crear \`contracts/savings-goals/src/lib.rs\`
- Funciones:
  - \`set_savings_goal(user, target_amount, deadline)\`
  - \`verify_goal_achieved(user, proof)\` - llama a ultrahonk_verifier
  - \`claim_reward(user)\` - emite token/badge si goal alcanzado
- Tests unitarios para cada función
- Desplegar en testnet y documentar

### Integración
- Usar ultrahonk_verifier para verificar proofs
- Emitir tokens MXNB o badges como recompensa
" \
  --label stellar
```

### Issue 3: Contrato de Cumplimiento de Presupuesto

```bash
gh issue create \
  --title "Contrato Soroban: Budget Compliance (Cumplimiento Presupuesto)" \
  --body "### Objetivo
Crear contrato que verifica cumplimiento de presupuesto mensual mediante ZK proofs.

### Tareas
- Crear \`contracts/budget-compliance/src/lib.rs\`
- Funciones:
  - \`verify_budget_compliance(user, proof, monthly_budget)\`
  - \`get_compliance_badge(user)\` - retorna badge si cumplió
  - \`get_streak(user)\` - meses consecutivos cumpliendo presupuesto
- Integrar con ultrahonk_verifier
- Tests y deployment

### Casos de Uso
- Verificar que gastos <= presupuesto sin revelar montos
- Generar badges de \"buen comportamiento financiero\"
- Habilitar descuentos automáticos
" \
  --label stellar
```

### Issue 4: Circuito Noir - Meta de Ahorro

```bash
gh issue create \
  --title "Circuito Noir: Savings Goal Proof" \
  --body "### Objetivo
Crear circuito Noir que prueba \`balance >= target_amount\` sin revelar balance exacto.

### Tareas
- Crear \`circuits/savings-proof/src/main.nr\`
- Implementar lógica: \`assert(balance >= target_amount)\`
- Compilar circuito y generar verification key
- Integrar con frontend para generación de proofs client-side
- Documentar inputs/outputs del circuito

### Referencias
- Noir documentation: https://noir-lang.org/
- Ejemplo: ultrahonk_soroban_contract circuits
" \
  --label stellar
```

### Issue 5: Circuito Noir - Presupuesto

```bash
gh issue create \
  --title "Circuito Noir: Budget Compliance Proof" \
  --body "### Objetivo
Crear circuito que prueba \`total_expenses <= monthly_budget\` sin revelar gastos detallados.

### Tareas
- Crear \`circuits/budget-proof/src/main.nr\`
- Implementar: \`assert(total_expenses <= monthly_budget)\`
- Compilar y generar verification key
- Integrar con frontend
- Tests con diferentes escenarios (dentro/excede presupuesto)

### Casos de Prueba
- Gastos < presupuesto → proof válido
- Gastos = presupuesto → proof válido
- Gastos > presupuesto → proof inválido
" \
  --label stellar
```

### Issue 6: Servicio Frontend ZK Proofs

```bash
gh issue create \
  --title "Servicio Frontend: ZK Proof Generation" \
  --body "### Objetivo
Crear servicio TypeScript para generar proofs client-side usando circuitos Noir.

### Tareas
- Crear \`src/services/zkProofService.ts\`
- Funciones:
  - \`generateSavingsProof(balance, targetAmount)\`
  - \`generateBudgetProof(expenses, budget)\`
  - \`verifyProofOnChain(contractAddress, proof)\`
- Integrar con \`@noir-lang/noir_js\` o similar
- Manejo de errores y loading states
- Tests unitarios

### Dependencias
- @noir-lang/noir_js
- stellarService para llamadas on-chain
" \
  --label frontend
```

### Issue 7: Servicio de Metas de Ahorro

```bash
gh issue create \
  --title "Servicio Frontend: Savings Goals Management" \
  --body "### Objetivo
Crear servicio y hooks para gestionar metas de ahorro con integración ZK.

### Tareas
- Crear \`src/services/savingsService.ts\`
- Crear \`src/hooks/useSavingsGoals.tsx\`
- Funciones:
  - \`createSavingsGoal(target, deadline)\`
  - \`checkGoalProgress()\` - obtiene balance y compara
  - \`generateProofIfAchieved()\` - genera proof si se alcanzó
  - \`claimReward(proof)\` - verifica proof y reclama recompensa
- Integrar con zkProofService y stellarService
- Persistencia local de metas

### UI
- Componente para crear/editar metas
- Visualización de progreso
- Botón para generar proof y reclamar
" \
  --label frontend
```

### Issue 8: Integración DeFindex

```bash
gh issue create \
  --title "Integración DeFindex para Rankings Anónimos" \
  --body "### Objetivo
Integrar DeFindex para agregar datos financieros anónimos y generar rankings del campus.

### Tareas
- Crear \`src/services/defindexService.ts\`
- Funciones:
  - \`submitAnonymousData(proof, percentile)\` - enviar proof agregado
  - \`getCampusRankings()\` - obtener rankings agregados
  - \`getPersonalRanking(proof)\` - comparar con agregados
- Integrar con ZK proofs para mantener privacidad
- UI para mostrar rankings anónimos

### Casos de Uso
- \"Estás en el top 20% de ahorradores\"
- \"Promedio de gasto en comida: \$X\" (agregado)
- Rankings mensuales del campus
" \
  --label frontend
```

### Issue 9: Página de Metas de Ahorro

```bash
gh issue create \
  --title "UI: Página de Metas de Ahorro con ZK Proofs" \
  --body "### Objetivo
Crear página completa para gestionar metas de ahorro con generación de proofs.

### Tareas
- Crear \`src/pages/SavingsGoals.tsx\`
- Features:
  - Formulario para crear meta (monto, deadline)
  - Visualización de progreso (barra, porcentaje)
  - Lista de metas activas/completadas
  - Botón \"Generar Proof\" cuando se alcanza meta
  - Sección de recompensas reclamadas
- Integrar con useSavingsGoals hook
- Diseño responsive y accesible

### UX
- Animaciones al alcanzar meta
- Notificaciones cuando se puede generar proof
- Visualización clara de recompensas
" \
  --label frontend
```

### Issue 10: Dashboard de Educación Financiera

```bash
gh issue create \
  --title "Dashboard de Educación Financiera con Comparativas" \
  --body "### Objetivo
Crear dashboard educativo que muestra comparativas anónimas y tips personalizados.

### Tareas
- Crear \`src/pages/FinancialEducation.tsx\`
- Features:
  - Tips de ahorro basados en comportamiento
  - Comparativas: \"Tu gasto en X es Y% menor que el promedio\"
  - Rankings anónimos del campus
  - Badges por logros financieros
  - Gráficos de progreso educativo
- Integrar con DeFindex para datos agregados
- Personalización basada en proofs del usuario

### Contenido Educativo
- Artículos sobre finanzas personales
- Videos/tutoriales
- Calculadoras (ahorro, interés compuesto)
" \
  --label frontend
```

### Issue 11: Sistema de Badges y Recompensas

```bash
gh issue create \
  --title "Sistema de Badges y Recompensas basado en ZK Proofs" \
  --body "### Objetivo
Implementar sistema de gamificación con badges y recompensas verificadas por proofs.

### Tareas
- Crear tipos para badges (Bronze, Silver, Gold ahorrador)
- Contrato Soroban para emitir badges como tokens
- UI para mostrar badges del usuario
- Lógica de desbloqueo basada en proofs:
  - \"Ahorrador Bronze\": proof de \$100+ ahorrados
  - \"Ahorrador Silver\": proof de \$500+ ahorrados
  - \"Ahorrador Gold\": proof de \$1000+ ahorrados
- Integración con comercios para canjear recompensas

### Casos de Uso
- Badges visibles en perfil (públicos)
- QR codes con proof para canjear descuentos
- Desafíos mensuales con recompensas
" \
  --label feature
```

### Issue 12: Documentación y Tests

```bash
gh issue create \
  --title "Documentación Completa y Tests para ZK Proofs" \
  --body "### Objetivo
Documentar todo el sistema de ZK proofs y crear tests comprehensivos.

### Tareas
- Documentar flujo completo: circuito → proof → verificación
- Guía de uso para desarrolladores
- Ejemplos de código para cada caso de uso
- Tests E2E:
  - Crear meta → alcanzar → generar proof → verificar → reclamar
  - Verificar presupuesto → generar proof → obtener badge
- Tests de privacidad: verificar que no se revelan datos
- Performance tests: tiempo de generación de proofs

### Documentación
- README en \`circuits/\` explicando cada circuito
- README en \`contracts/\` explicando cada contrato
- Guía de usuario para crear metas y generar proofs
" \
  --label docs
```

---

**Ejecutar estos comandos en orden para crear todos los issues en GitHub.**

