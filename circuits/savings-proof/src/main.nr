fn main(balance: u64, target_amount: u64) -> pub u64 {
    assert(balance >= target_amount, "balance is below target");
    balance - target_amount
}

