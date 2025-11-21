# Course Completion ZK Circuit

## 📋 Descripción

Circuito ZK para verificar que un estudiante completó un curso exitosamente sin revelar su puntuación exacta ni sus respuestas individuales.

## 🔐 Privacidad

**Datos Privados (no se revelan):**
- `score`: Puntuación exacta obtenida
- `questions_answered`: Número de preguntas respondidas

**Datos Públicos (se revelan):**
- `passing_score`: Puntuación mínima requerida para pasar
- `total_questions`: Total de preguntas del cuestionario
- **Retorno**: Nivel de badge obtenido (1 = Bronze, 2 = Silver, 3 = Gold)

## 📊 Parámetros

### Entrada

| Parámetro | Tipo | Descripción | Visibilidad |
|-----------|------|-------------|--------------|
| `score` | `u64` | Puntuación obtenida | 🔒 Privado |
| `passing_score` | `u64` | Puntuación mínima para pasar | 🔓 Público |
| `questions_answered` | `u64` | Preguntas respondidas | 🔒 Privado |
| `total_questions` | `u64` | Total de preguntas | 🔓 Público |

### Salida

| Valor | Badge | Descripción |
|-------|-------|-------------|
| `1` | Bronze | Puntuación >= passing_score (70%+) |
| `2` | Silver | Puntuación >= passing_score * 2 (80%+) |
| `3` | Gold | Puntuación >= passing_score * 3 (90%+) |

## 🚀 Uso

### Compilar el circuito

```bash
cd circuits/course-completion
nargo compile
```

### Generar proof

```bash
nargo prove
```

Esto generará:
- `proofs/course_completion.proof`: El proof ZK
- `Verifier.toml`: Inputs públicos para verificación

### Verificar proof

```bash
nargo verify
```

## 📝 Ejemplo de Valores

### Ejemplo 1: Gold Badge
```toml
score = "9"
passing_score = "7"
questions_answered = "10"
total_questions = "10"
```
**Resultado**: Badge Gold (3) - 90% de aciertos

### Ejemplo 2: Silver Badge
```toml
score = "8"
passing_score = "7"
questions_answered = "10"
total_questions = "10"
```
**Resultado**: Badge Silver (2) - 80% de aciertos

### Ejemplo 3: Bronze Badge
```toml
score = "7"
passing_score = "7"
questions_answered = "10"
total_questions = "10"
```
**Resultado**: Badge Bronze (1) - 70% de aciertos

## 🔗 Integración

Este circuito se integra con:
- **Frontend**: `src/services/zkCourseProofService.ts`
- **Backend**: Endpoint `/api/zk/generate-course-proof`
- **Contrato Soroban**: `contracts/course-completion/src/lib.rs`

## 🎯 Casos de Uso

1. **Verificación de Completitud**: Demostrar que completaste un curso sin revelar tu puntuación exacta
2. **Badges**: Obtener badges (Bronze, Silver, Gold) basados en rendimiento
3. **Rankings Anónimos**: Participar en rankings del campus sin revelar puntuaciones
4. **Recompensas**: Reclamar tokens MXNB por completar cursos

## ⚠️ Notas

- El circuito asume que `passing_score` es aproximadamente el 70% del total
- Los umbrales de badges son relativos a `passing_score`
- Ajusta los múltiplos en `main.nr` según tus criterios de evaluación

