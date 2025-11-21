// Circuito para verificación de logros y badges
// Verifica que un usuario cumple requisitos para obtener un logro sin revelar datos

fn main(
    savings_months: u64,          // Meses consecutivos de ahorro (privado)
    total_savings: u64,           // Ahorro total acumulado (privado)
    transactions_count: u64,      // Número de transacciones (privado)
    budget_compliance_rate: u64,  // Porcentaje de cumplimiento de presupuesto (privado)
    min_months: u64,              // Meses mínimos requeridos (público)
    min_total_savings: u64,       // Ahorro mínimo requerido (público)
    min_transactions: u64,        // Transacciones mínimas requeridas (público)
    min_compliance_rate: u64      // Tasa mínima de cumplimiento (público)
) -> pub u64 {
    // Verificar meses consecutivos de ahorro
    assert(savings_months >= min_months, "Insufficient consecutive savings months");
    
    // Verificar ahorro total acumulado
    assert(total_savings >= min_total_savings, "Insufficient total savings");
    
    // Verificar número mínimo de transacciones
    assert(transactions_count >= min_transactions, "Insufficient transaction count");
    
    // Verificar cumplimiento de presupuesto (porcentaje)
    assert(budget_compliance_rate >= min_compliance_rate, "Budget compliance rate too low");
    
    // Retornar código de logro desbloqueado
    // 1 = Bronze, 2 = Silver, 3 = Gold (basado en los valores)
    let gold_months_ok = savings_months >= min_months * 3;
    let gold_savings_ok = total_savings >= min_total_savings * 3;
    let silver_months_ok = savings_months >= min_months * 2;
    let silver_savings_ok = total_savings >= min_total_savings * 2;
    
    let is_gold = gold_months_ok & gold_savings_ok;
    let is_silver = silver_months_ok & silver_savings_ok;
    
    if (is_gold) {
        3 // Gold
    } else if (is_silver) {
        2 // Silver
    } else {
        1 // Bronze
    }
}

