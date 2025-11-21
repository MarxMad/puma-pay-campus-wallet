#![no_std]
extern crate alloc;

use soroban_sdk::{
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Env, Symbol,
};

/// Niveles de usuario basados en cumplimiento de metas y cursos
/// Bronze: 1-2 metas o 1-2 cursos
/// Silver: 3-5 metas o 3-5 cursos
/// Gold: 6+ metas o 6+ cursos
/// Platinum: 10+ metas Y 10+ cursos
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum UserLevel {
    Bronze = 1,
    Silver = 2,
    Gold = 3,
    Platinum = 4,
}

#[derive(Clone, Debug)]
#[soroban_sdk::contracttype]
pub struct UserLevelData {
    pub level: u8,
    pub goals_achieved: u32,
    pub courses_completed: u32,
    pub last_updated: i64,
}

#[contracterror]
#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    SavingsGoalsNotConfigured = 1,
    CourseCompletionNotConfigured = 2,
    NotAuthorized = 3,
    InvalidLevel = 4,
}

#[contract]
pub struct UserLevels;

#[contractimpl]
impl UserLevels {
    /// Configura las direcciones de los contratos relacionados
    pub fn set_contracts(
        env: Env,
        savings_goals: Address,
        course_completion: Address,
    ) {
        Self::assert_admin(&env);
        env.storage()
            .instance()
            .set(&Self::savings_goals_key(), &savings_goals);
        env.storage()
            .instance()
            .set(&Self::course_completion_key(), &course_completion);
    }

    /// Calcula y actualiza el nivel de un usuario basado en metas y cursos
    pub fn update_user_level(env: Env, user: Address) -> Result<u8, Error> {
        let savings_goals: Address = env
            .storage()
            .instance()
            .get(&Self::savings_goals_key())
            .ok_or(Error::SavingsGoalsNotConfigured)?;

        let course_completion: Address = env
            .storage()
            .instance()
            .get(&Self::course_completion_key())
            .ok_or(Error::CourseCompletionNotConfigured)?;

        // Contar metas alcanzadas (simplificado - en producción se iteraría)
        let goals_achieved = Self::count_achieved_goals(&env, &savings_goals, &user)?;
        
        // Contar cursos completados (simplificado - en producción se iteraría)
        let courses_completed = Self::count_completed_courses(&env, &course_completion, &user)?;

        // Calcular nivel
        let level = Self::calculate_level(goals_achieved, courses_completed);

        let level_data = UserLevelData {
            level: level as u8,
            goals_achieved,
            courses_completed,
            last_updated: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&Self::user_level_key(&user), &level_data);

        Ok(level as u8)
    }

    /// Obtiene el nivel actual de un usuario
    pub fn get_user_level(env: Env, user: Address) -> Option<UserLevelData> {
        env.storage().persistent().get(&Self::user_level_key(&user))
    }

    /// Obtiene el nivel como u8 (1=Bronze, 2=Silver, 3=Gold, 4=Platinum)
    pub fn get_user_level_value(env: Env, user: Address) -> u8 {
        Self::get_user_level(env, user)
            .map(|data| data.level)
            .unwrap_or(1) // Bronze por defecto
    }

    fn calculate_level(goals_achieved: u32, courses_completed: u32) -> UserLevel {
        // Platinum: 10+ metas Y 10+ cursos
        if goals_achieved >= 10 && courses_completed >= 10 {
            return UserLevel::Platinum;
        }
        
        // Gold: 6+ metas O 6+ cursos
        if goals_achieved >= 6 || courses_completed >= 6 {
            return UserLevel::Gold;
        }
        
        // Silver: 3-5 metas O 3-5 cursos
        if goals_achieved >= 3 || courses_completed >= 3 {
            return UserLevel::Silver;
        }
        
        // Bronze: 1-2 metas O 1-2 cursos
        UserLevel::Bronze
    }

    fn count_achieved_goals(
        env: &Env,
        savings_goals: &Address,
        user: &Address,
    ) -> Result<u32, Error> {
        // En producción, esto llamaría al contrato savings-goals
        // Por ahora, retornamos un valor simulado
        // TODO: Implementar llamada real al contrato
        use soroban_sdk::Vec;
        let mut args = Vec::new(env);
        args.push_back(user.clone().into_val(env));
        
        // Llamar a get_savings_goal y contar cuántas están achieved
        // Por simplicidad, retornamos 0
        Ok(0)
    }

    fn count_completed_courses(
        env: &Env,
        course_completion: &Address,
        user: &Address,
    ) -> Result<u32, Error> {
        // En producción, esto llamaría al contrato course-completion
        // Por ahora, retornamos un valor simulado
        // TODO: Implementar llamada real al contrato
        Ok(0)
    }

    fn savings_goals_key() -> Symbol {
        symbol_short!("sv_goals")
    }

    fn course_completion_key() -> Symbol {
        symbol_short!("crs_comp")
    }

    fn user_level_key(user: &Address) -> (Symbol, Address) {
        (symbol_short!("level"), user.clone())
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

