#![no_std]
extern crate alloc;

use alloc::string::String;

use soroban_sdk::{
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Bytes, BytesN,
    Env, IntoVal, Symbol,
};

#[derive(Clone, Debug)]
#[soroban_sdk::contracttype]
pub struct Goal {
    pub target_amount: i128,
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
    pub fn set_verifier(env: Env, verifier: Address) {
        Self::assert_admin(&env);
        env.storage().instance().set(&Self::verifier_key(), &verifier);
    }

    /// Crea o actualiza la meta de ahorro del invocador.
    pub fn set_savings_goal(env: Env, target_amount: i128, deadline_ts: Option<i64>) {
        if target_amount <= 0 {
            panic_with_error(&env, &Error::InvalidAmount);
        }

        let user = env.invoker();
        let goal = Goal {
            target_amount,
            deadline_ts,
            achieved: false,
            proof_id: None,
        };

        env.storage()
            .persistent()
            .set(&Self::goal_key(&user), &goal);
    }

    /// Obtiene la meta de ahorro de un usuario.
    pub fn get_savings_goal(env: Env, user: Address) -> Option<Goal> {
        env.storage().persistent().get(&Self::goal_key(&user))
    }

    /// Envía un proof blob (generado con Noir + Ultrahonk) y marca la meta como cumplida.
    /// Retorna el proof_id (keccak del blob) que regresa el contrato verificador.
    pub fn submit_proof(env: Env, proof_blob: Bytes) -> Result<BytesN<32>, Error> {
        let user = env.invoker();
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
        let result = env.invoke_contract(
            verifier,
            &symbol_short!("verify_proof_with_stored_vk"),
            args,
        );

        BytesN::<32>::try_from_val(env, &result).map_err(|_| Error::VerifierCallFailed)
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

    fn assert_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&Self::admin_key())
            .unwrap_or_else(|| {
                let invoker = env.invoker();
                env.storage()
                    .instance()
                    .set(&Self::admin_key(), &invoker);
                invoker
            });

        if env.invoker() != admin {
            panic_with_error(&env, &Error::NotAuthorized);
        }
    }
}

