#![no_std]
extern crate alloc;

use alloc::string::String;

use soroban_sdk::{
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Bytes, BytesN,
    Env, IntoVal, Symbol,
};

#[derive(Clone, Debug)]
#[soroban_sdk::contracttype]
pub struct CourseCompletion {
    pub course_id: String,
    pub completed: bool,
    pub badge_level: u8, // 1=Bronze, 2=Silver, 3=Gold
    pub proof_id: Option<BytesN<32>>,
    pub completed_at: i64,
}

#[contracterror]
#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    VerifierNotConfigured = 1,
    CourseNotFound = 2,
    AlreadyCompleted = 3,
    InvalidBadgeLevel = 4,
    NotAuthorized = 5,
    VerifierCallFailed = 6,
}

#[contract]
pub struct CourseCompletionContract;

#[contractimpl]
impl CourseCompletionContract {
    /// Configura el contrato verificador Ultrahonk
    pub fn set_verifier(env: Env, verifier: Address) {
        Self::assert_admin(&env);
        env.storage().instance().set(&Self::verifier_key(), &verifier);
    }

    /// Envía un proof de completitud de curso y marca como completado
    /// Retorna el proof_id y el badge_level extraído del proof
    pub fn submit_course_proof(
        env: Env,
        course_id: String,
        proof_blob: Bytes,
    ) -> Result<(BytesN<32>, u8), Error> {
        let user = env.invoker();
        let completion_key = Self::completion_key(&user, &course_id);

        // Verificar si ya está completado
        if let Some(existing) = env.storage().persistent().get(&completion_key) {
            let completion: CourseCompletion = existing;
            if completion.completed {
                return Err(Error::AlreadyCompleted);
            }
        }

        let verifier: Address = env
            .storage()
            .instance()
            .get(&Self::verifier_key())
            .ok_or(Error::VerifierNotConfigured)?;

        let proof_id = Self::invoke_verifier(&env, &verifier, proof_blob)?;

        // Extraer badge_level del output público del proof
        // En producción, esto se obtendría del Verifier.toml o del proof mismo
        // Por ahora, asumimos que el badge_level viene en el proof
        // TODO: Extraer badge_level del public output del proof
        let badge_level = Self::extract_badge_level(&env, &proof_id)?;

        let completion = CourseCompletion {
            course_id: course_id.clone(),
            completed: true,
            badge_level,
            proof_id: Some(proof_id.clone()),
            completed_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&completion_key, &completion);

        Ok((proof_id, badge_level))
    }

    /// Obtiene el estado de completitud de un curso para un usuario
    pub fn get_course_completion(
        env: Env,
        user: Address,
        course_id: String,
    ) -> Option<CourseCompletion> {
        let completion_key = Self::completion_key(&user, &course_id);
        env.storage().persistent().get(&completion_key)
    }

    /// Obtiene todos los cursos completados de un usuario
    pub fn get_user_completions(env: Env, user: Address) -> Vec<CourseCompletion> {
        // En Soroban, necesitamos iterar sobre las keys
        // Por simplicidad, retornamos un vector vacío
        // En producción, usaríamos un mapeo o lista
        Vec::new(&env)
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
            &symbol_short!("vrfy_pr_vk"), // verify_proof_with_stored_vk
            args,
        );

        BytesN::<32>::try_from_val(env, &result).map_err(|_| Error::VerifierCallFailed)
    }

    /// Extrae el badge_level del proof
    /// En producción, esto se obtendría del public output del proof
    fn extract_badge_level(env: &Env, proof_id: &BytesN<32>) -> Result<u8, Error> {
        // Por ahora, retornamos un badge_level por defecto
        // En producción, esto se extraería del Verifier.toml o del proof mismo
        // El circuito course-completion retorna el badge_level como output público
        // TODO: Implementar extracción real del badge_level
        Ok(1) // Bronze por defecto
    }

    fn verifier_key() -> Symbol {
        symbol_short!("vrf")
    }

    fn completion_key(user: &Address, course_id: &String) -> (Symbol, Address, String) {
        (symbol_short!("comp"), user.clone(), course_id.clone())
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
            panic_with_error(env, &Error::NotAuthorized);
        }
    }
}

