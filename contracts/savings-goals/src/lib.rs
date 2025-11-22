#![no_std]
extern crate alloc;

use soroban_sdk::{
    contract, contracterror, contractimpl, symbol_short, Address, Bytes, BytesN, Env, IntoVal,
    Symbol,
};

#[derive(Clone, Debug)]
#[soroban_sdk::contracttype]
pub struct Goal {
    pub target_amount: i128,
    pub saved_amount: i128, // Balance guardado en esta "cajita"
    pub deadline_ts: Option<i64>,
    pub achieved: bool,
    pub proof_id: Option<BytesN<32>>,
}

#[contracterror]
#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    VerifierNotConfigured = 1,
    GoalNotFound = 2,
    AlreadyAchieved = 3,
    InvalidAmount = 4,
    NotAuthorized = 5,
    VerifierCallFailed = 6,
}

#[contract]
pub struct SavingsGoals;

#[contractimpl]
impl SavingsGoals {
    /// Configura el contrato verificador Ultrahonk (una sola dirección global).
    pub fn set_verifier(env: Env, caller: Address, verifier: Address) {
        Self::assert_admin(&env, &caller);
        env.storage().instance().set(&Self::verifier_key(), &verifier);
    }

    /// Crea o actualiza la meta de ahorro del invocador.
    pub fn set_savings_goal(
        env: Env,
        user: Address,
        target_amount: i128,
        deadline_ts: Option<i64>,
    ) {
        user.require_auth();
        if target_amount <= 0 {
            env.panic_with_error(Error::InvalidAmount);
        }

        // Si ya existe una meta, preservar el saved_amount
        let saved_amount: i128 = match env.storage().persistent().get::<_, Goal>(&Self::goal_key(&user)) {
            Some(existing) => existing.saved_amount,
            None => 0,
        };

        let goal = Goal {
            target_amount,
            saved_amount,
            deadline_ts,
            achieved: false,
            proof_id: None,
        };

        env.storage()
            .persistent()
            .set(&Self::goal_key(&user), &goal);
    }

    /// Deposita dinero en la "cajita" de ahorro del usuario.
    /// El dinero se suma al saved_amount de la meta.
    pub fn deposit_to_goal(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<i128, Error> {
        user.require_auth();
        
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut goal: Goal = env
            .storage()
            .persistent()
            .get(&Self::goal_key(&user))
            .ok_or(Error::GoalNotFound)?;

        if goal.achieved {
            return Err(Error::AlreadyAchieved);
        }

        goal.saved_amount += amount;

        env.storage()
            .persistent()
            .set(&Self::goal_key(&user), &goal);

        Ok(goal.saved_amount)
    }

    /// Retira dinero de la "cajita" de ahorro (opcional, para flexibilidad).
    pub fn withdraw_from_goal(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<i128, Error> {
        user.require_auth();
        
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut goal: Goal = env
            .storage()
            .persistent()
            .get(&Self::goal_key(&user))
            .ok_or(Error::GoalNotFound)?;

        if goal.saved_amount < amount {
            return Err(Error::InvalidAmount); // Fondos insuficientes
        }

        goal.saved_amount -= amount;

        env.storage()
            .persistent()
            .set(&Self::goal_key(&user), &goal);

        Ok(goal.saved_amount)
    }

    /// Obtiene la meta de ahorro de un usuario.
    pub fn get_savings_goal(env: Env, user: Address) -> Option<Goal> {
        env.storage().persistent().get(&Self::goal_key(&user))
    }

    /// Envía un proof blob (generado con Noir + Ultrahonk) y marca la meta como cumplida.
    /// Retorna el proof_id (keccak del blob) que regresa el contrato verificador.
    pub fn submit_proof(
        env: Env,
        user: Address,
        proof_blob: Bytes,
    ) -> Result<BytesN<32>, Error> {
        user.require_auth();
        let mut goal: Goal = env
            .storage()
            .persistent()
            .get(&Self::goal_key(&user))
            .ok_or(Error::GoalNotFound)?;

        if goal.achieved {
            return Err(Error::AlreadyAchieved);
        }

        let verifier: Address = env
            .storage()
            .instance()
            .get(&Self::verifier_key())
            .ok_or(Error::VerifierNotConfigured)?;

        let proof_id = Self::invoke_verifier(&env, &verifier, proof_blob)?;

        goal.achieved = true;
        goal.proof_id = Some(proof_id.clone());

        env.storage()
            .persistent()
            .set(&Self::goal_key(&user), &goal);

        Ok(proof_id)
    }

    fn invoke_verifier(
        env: &Env,
        verifier: &Address,
        proof_blob: Bytes,
    ) -> Result<BytesN<32>, Error> {
        use soroban_sdk::Vec;

        let mut args = Vec::new(env);
        args.push_back(proof_blob.into_val(env));
        let fn_symbol = Symbol::new(env, "verify_proof_with_stored_vk");
        let result: BytesN<32> = env.invoke_contract(verifier, &fn_symbol, args);

        Ok(result)
    }

    fn verifier_key() -> Symbol {
        symbol_short!("vrf")
    }

    fn goal_key(user: &Address) -> (Symbol, Address) {
        (symbol_short!("goal"), user.clone())
    }

    fn admin_key() -> Symbol {
        symbol_short!("admin")
    }

    fn assert_admin(env: &Env, caller: &Address) {
        caller.require_auth();
        let admin: Address = env
            .storage()
            .instance()
            .get(&Self::admin_key())
            .unwrap_or_else(|| {
                env.storage()
                    .instance()
                    .set(&Self::admin_key(), caller);
                caller.clone()
            });

        if caller != &admin {
            env.panic_with_error(Error::NotAuthorized);
        }
    }
}

