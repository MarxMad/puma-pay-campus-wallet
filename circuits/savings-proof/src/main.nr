// Verifica que el monto guardado en la "cajita" de ahorro >= objetivo
// saved_amount: dinero guardado en esta meta específica
// target_amount: objetivo de la meta
fn main(saved_amount: u64, target_amount: u64) -> pub u64 {
    assert(saved_amount >= target_amount, "saved_amount is below target");
    saved_amount - target_amount
}

