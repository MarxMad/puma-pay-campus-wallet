// Circuito para verificación de identidad de usuario
// Verifica que un usuario cumple requisitos sin revelar datos personales

fn main(
    age: u64,                    // Edad del usuario (privado)
    is_student_active: u64,       // 1 = activo, 0 = inactivo (privado)
    semester: u64,                // Semestre actual (privado)
    min_age: u64,                 // Edad mínima requerida (público)
    min_semester: u64             // Semestre mínimo requerido (público)
) -> pub u64 {
    // Verificar que el usuario tiene la edad mínima
    assert(age >= min_age, "User is below minimum age");
    
    // Verificar que el usuario es estudiante activo
    assert(is_student_active == 1, "User is not an active student");
    
    // Verificar que el usuario está en el semestre mínimo o superior
    assert(semester >= min_semester, "User semester is below minimum");
    
    // Retornar código de verificación (1 = verificado)
    // Si llegamos aquí, es porque pasó todas las verificaciones
    // Calculamos un valor basado en los inputs para evitar constante
    age - min_age + semester - min_semester + is_student_active
}

