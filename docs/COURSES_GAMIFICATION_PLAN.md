# 🎮 Plan de Gamificación de Cursos con ZK Proofs

## 🎯 Objetivo

Implementar un sistema de gamificación para cursos que incluya cuestionarios, badges, puntos y verificación mediante ZK proofs, manteniendo la privacidad de los estudiantes.

---

## 📋 Features a Implementar

### **1. Sistema de Cuestionarios**
- Cuestionarios al final de cada curso
- Preguntas múltiple opción
- Puntuación basada en respuestas correctas
- Verificación de completitud sin revelar respuestas exactas

### **2. Gamificación con ZK Proofs**
- **Puntos**: Acumulación de puntos por completar cursos
- **Badges**: Desbloquear badges por logros (sin revelar puntuación exacta)
- **Rankings**: Rankings anónimos del campus
- **Recompensas**: Tokens MXNB por completar cursos

### **3. Verificación de Completitud**
- Proof que demuestra que completaste un curso sin revelar:
  - Puntuación exacta
  - Respuestas individuales
  - Tiempo exacto de completitud
- Solo se revela: "Curso completado" y nivel de badge obtenido

---

## 🔐 Circuitos ZK Necesarios

### **Circuito 1: Course Completion Proof**
```rust
// circuits/course-completion/src/main.nr
fn main(
    score: u64,              // Puntuación obtenida (privado)
    passing_score: u64,      // Puntuación mínima para pasar (público)
    questions_answered: u64, // Preguntas respondidas (privado)
    total_questions: u64     // Total de preguntas (público)
) -> pub u64 {
    // Verificar que pasó el curso
    assert(score >= passing_score, "Score below passing threshold");
    
    // Verificar que respondió todas las preguntas
    assert(questions_answered == total_questions, "Not all questions answered");
    
    // Retornar nivel de badge (1 = Bronze, 2 = Silver, 3 = Gold)
    if (score >= passing_score * 3) {
        3 // Gold (90%+)
    } else if (score >= passing_score * 2) {
        2 // Silver (80%+)
    } else {
        1 // Bronze (70%+)
    }
}
```

### **Circuito 2: Course Progress Proof**
```rust
// circuits/course-progress/src/main.nr
fn main(
    courses_completed: u64,  // Cursos completados (privado)
    quizzes_passed: u64,     // Cuestionarios pasados (privado)
    min_courses: u64,        // Mínimo requerido (público)
    min_quizzes: u64         // Mínimo requerido (público)
) -> pub u64 {
    assert(courses_completed >= min_courses, "Insufficient courses completed");
    assert(quizzes_passed >= min_quizzes, "Insufficient quizzes passed");
    
    // Retornar nivel de logro
    courses_completed + quizzes_passed
}
```

---

## 🏗️ Arquitectura

### **Frontend:**
```
src/
├── pages/
│   ├── Courses.tsx              # Lista de cursos (ya existe)
│   ├── CourseDetail.tsx         # Detalle del curso + cuestionario
│   └── CourseQuiz.tsx           # Página de cuestionario
├── components/
│   ├── QuizComponent.tsx        # Componente de cuestionario
│   ├── CourseProgress.tsx       # Barra de progreso
│   ├── CourseBadges.tsx         # Badges del curso
│   └── QuizResults.tsx          # Resultados con ZK proof
├── services/
│   ├── quizService.ts           # Gestión de cuestionarios
│   ├── courseGamificationService.ts  # Puntos, badges, rankings
│   └── zkCourseProofService.ts  # Generación de proofs de cursos
└── hooks/
    ├── useCourseProgress.tsx    # Hook para progreso
    └── useQuiz.tsx               # Hook para cuestionarios
```

### **Backend:**
```
backend/
├── routes/
│   ├── courses.js               # Endpoints de cursos
│   ├── quizzes.js               # Endpoints de cuestionarios
│   └── gamification.js          # Endpoints de gamificación
```

### **Contratos Soroban:**
```
contracts/
├── course-completion/
│   └── src/lib.rs               # Verifica proofs de completitud
└── course-badges/
    └── src/lib.rs               # Emite badges como tokens
```

---

## 📊 Flujo de Usuario

### **1. Usuario Completa Curso**
```
Usuario ve curso → Estudia contenido → Completa cuestionario
```

### **2. Generación de Proof**
```
Usuario responde cuestionario → Sistema calcula puntuación
→ Genera ZK proof (puntuación >= mínima, sin revelar exacta)
→ Proof verificado on-chain
```

### **3. Desbloqueo de Badges**
```
Proof verificado → Badge desbloqueado (Bronze/Silver/Gold)
→ Puntos agregados → Ranking actualizado (anónimo)
```

### **4. Recompensas**
```
Badge desbloqueado → Tokens MXNB emitidos
→ Puede canjear en comercios del campus
```

---

## 🎮 Elementos de Gamificación

### **Puntos:**
- Completar curso: +100 puntos
- Pasar cuestionario: +50 puntos
- Badge Bronze: +25 puntos
- Badge Silver: +50 puntos
- Badge Gold: +100 puntos

### **Badges:**
- 🥉 **Curso Completado (Bronze)**: 70%+ en cuestionario
- 🥈 **Estudiante Destacado (Silver)**: 80%+ en cuestionario
- 🥇 **Experto (Gold)**: 90%+ en cuestionario
- 📚 **Estudiante Consistente**: 5+ cursos completados
- 🎯 **Perfecto**: 100% en cuestionario

### **Rankings:**
- Top 10 estudiantes del mes (anónimo)
- Más cursos completados (sin revelar identidad)
- Mejor puntuación promedio (sin revelar puntuaciones exactas)

---

## 🔒 Privacidad con ZK Proofs

### **Se Revela:**
- ✅ Curso completado
- ✅ Badge obtenido (Bronze/Silver/Gold)
- ✅ Puntos totales (opcional, puede ser privado también)

### **NO se Revela:**
- 🔒 Puntuación exacta del cuestionario
- 🔒 Respuestas individuales
- 🔒 Tiempo de completitud
- 🔒 Intentos fallidos
- 🔒 Identidad completa (en rankings)

---

## 📝 Issues a Crear

### **Issue 1: Circuito ZK - Course Completion**
- Crear circuito que verifica completitud sin revelar puntuación

### **Issue 2: Sistema de Cuestionarios**
- Componente de cuestionario
- Almacenamiento de respuestas
- Cálculo de puntuación

### **Issue 3: Contrato Soroban - Course Completion**
- Contrato que verifica proofs de completitud
- Emisión de badges como tokens

### **Issue 4: UI de Gamificación**
- Componentes de badges
- Sistema de puntos
- Rankings anónimos

### **Issue 5: Integración Frontend-Backend**
- Servicios para cuestionarios
- Generación de proofs
- Verificación on-chain

---

## 🚀 Fase de Implementación

### **Fase 1: Circuitos y Contratos (Día 1-2)**
1. Crear circuito `course-completion`
2. Crear circuito `course-progress`
3. Crear contrato `course-completion` en Soroban
4. Crear contrato `course-badges` en Soroban

### **Fase 2: Backend (Día 2-3)**
1. Endpoints para cuestionarios
2. Endpoints para gamificación
3. Integración con circuitos ZK
4. Almacenamiento de progreso

### **Fase 3: Frontend (Día 3-4)**
1. Componente de cuestionario
2. Página de detalle de curso
3. Sistema de badges y puntos
4. Rankings anónimos

### **Fase 4: Integración (Día 4-5)**
1. Generación de proofs al completar
2. Verificación on-chain
3. Desbloqueo automático de badges
4. Emisión de tokens MXNB

---

## 📊 Métricas de Éxito

- ✅ Usuarios pueden completar cuestionarios
- ✅ Proofs se generan correctamente
- ✅ Badges se desbloquean automáticamente
- ✅ Rankings funcionan sin revelar identidad
- ✅ Tokens MXNB se emiten como recompensa

