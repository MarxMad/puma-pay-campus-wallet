#![no_std]
extern crate alloc;

use soroban_sdk::{
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Env, Symbol,
};

/// Tasas de rendimiento anual (APY) basadas en nivel de usuario
/// Bronze: 2% APY
/// Silver: 4% APY
/// Gold: 6% APY
/// Platinum: 8% APY
const BRONZE_APY: i64 = 200; // 2.00% (en basis points)
const SILVER_APY: i64 = 400; // 4.00%
const GOLD_APY: i64 = 600; // 6.00%
const PLATINUM_APY: i64 = 800; // 8.00%

#[derive(Clone, Debug)]
#[soroban_sdk::contracttype]
pub struct SavingsPosition {
    pub user: Address,
    pub principal: i128, // Monto principal ahorrado
    pub interest_earned: i128, // Interés acumulado
    pub level: u8, // Nivel del usuario (1-4)
    pub apy: i64, // APY en basis points
    pub last_updated: i64,
}

#[contracterror]
#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    UserLevelsNotConfigured = 1,
    InvalidAmount = 2,
    PositionNotFound = 3,
    NotAuthorized = 4,
    InsufficientBalance = 5,
}

#[contract]
pub struct DeFindex;

#[contractimpl]
impl DeFindex {
    /// Configura la dirección del contrato user-levels
    pub fn set_user_levels(env: Env, user_levels: Address) {
        Self::assert_admin(&env);
        env.storage()
            .instance()
            .set(&Self::user_levels_key(), &user_levels);
    }

    /// Deposita fondos en DeFindex para generar rendimientos
    pub fn deposit(env: Env, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let user = env.invoker();
        
        // Obtener nivel del usuario
        let level = Self::get_user_level(&env, &user)?;
        let apy = Self::get_apy_for_level(level);

        // Obtener o crear posición
        let mut position = Self::get_position(&env, &user)
            .unwrap_or_else(|| SavingsPosition {
                user: user.clone(),
                principal: 0,
                interest_earned: 0,
                level,
                apy,
                last_updated: env.ledger().timestamp(),
            });

        // Actualizar interés antes de agregar principal
        position = Self::update_interest(&env, &position)?;

        // Agregar al principal
        position.principal += amount;
        position.level = level;
        position.apy = apy;
        position.last_updated = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&Self::position_key(&user), &position);

        Ok(())
    }

    /// Retira fondos de DeFindex
    pub fn withdraw(env: Env, amount: i128) -> Result<i128, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let user = env.invoker();
        let mut position = Self::get_position(&env, &user)
            .ok_or(Error::PositionNotFound)?;

        // Actualizar interés antes de retirar
        position = Self::update_interest(&env, &position)?;

        let total_balance = position.principal + position.interest_earned;
        if amount > total_balance {
            return Err(Error::InsufficientBalance);
        }

        // Retirar del principal primero, luego del interés
        if amount <= position.principal {
            position.principal -= amount;
        } else {
            let remaining = amount - position.principal;
            position.interest_earned -= remaining;
            position.principal = 0;
        }

        position.last_updated = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&Self::position_key(&user), &position);

        Ok(amount)
    }

    /// Obtiene la posición de ahorros de un usuario
    pub fn get_position(env: Env, user: Address) -> Option<SavingsPosition> {
        env.storage().persistent().get(&Self::position_key(&user))
    }

    /// Obtiene el balance total (principal + interés) de un usuario
    pub fn get_balance(env: Env, user: Address) -> i128 {
        if let Some(mut position) = Self::get_position(env.clone(), user) {
            // Actualizar interés antes de retornar
            if let Ok(updated) = Self::update_interest(&env, &position) {
                position = updated;
            }
            position.principal + position.interest_earned
        } else {
            0
        }
    }

    /// Calcula y actualiza el interés acumulado
    fn update_interest(
        env: &Env,
        position: &SavingsPosition,
    ) -> Result<SavingsPosition, Error> {
        let current_time = env.ledger().timestamp();
        let time_elapsed = current_time - position.last_updated;

        if time_elapsed <= 0 || position.principal == 0 {
            return Ok(position.clone());
        }

        // Calcular interés: principal * APY * time_elapsed / (365 * 24 * 60 * 60)
        // APY está en basis points (100 = 1%)
        let seconds_per_year = 365 * 24 * 60 * 60;
        let interest = (position.principal as i64 * position.apy * time_elapsed)
            / (10000 * seconds_per_year);

        let mut updated = position.clone();
        updated.interest_earned += interest as i128;
        updated.last_updated = current_time;

        // Actualizar APY si el nivel cambió
        let current_level = Self::get_user_level(env, &position.user)?;
        if current_level != position.level {
            updated.level = current_level;
            updated.apy = Self::get_apy_for_level(current_level);
        }

        Ok(updated)
    }

    fn get_user_level(env: &Env, user: &Address) -> Result<u8, Error> {
        let user_levels: Address = env
            .storage()
            .instance()
            .get(&Self::user_levels_key())
            .ok_or(Error::UserLevelsNotConfigured)?;

        use soroban_sdk::Vec;
        let mut args = Vec::new(env);
        args.push_back(user.clone().into_val(env));

        let result = env.invoke_contract(
            &user_levels,
            &symbol_short!("get_lvl"), // get_user_level_value
            args,
        );

        Ok(result.try_into_val(env).unwrap_or(1)) // Bronze por defecto
    }

    fn get_apy_for_level(level: u8) -> i64 {
        match level {
            1 => BRONZE_APY,   // Bronze: 2%
            2 => SILVER_APY,   // Silver: 4%
            3 => GOLD_APY,     // Gold: 6%
            4 => PLATINUM_APY, // Platinum: 8%
            _ => BRONZE_APY,
        }
    }

    fn position_key(user: &Address) -> (Symbol, Address) {
        (symbol_short!("pos"), user.clone())
    }

    fn user_levels_key() -> Symbol {
        symbol_short!("usr_lvl")
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

