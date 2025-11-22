#![no_std]
extern crate alloc;

use soroban_sdk::{
    contract, contracterror, contractimpl, symbol_short, Bytes, BytesN, Env, Symbol,
};

#[contracterror]
#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    VkNotSet = 1,
    InvalidProofFormat = 2,
    VerificationFailed = 3,
}

#[contract]
pub struct SimpleVerifier;

#[contractimpl]
impl SimpleVerifier {
    /// Set verification key (simplified - solo guarda el hash para referencia)
    pub fn set_vk(env: Env, vk_json: Bytes) -> Result<BytesN<32>, Error> {
        env.storage().instance().set(&Self::key_vk(), &vk_json);
        let hash: BytesN<32> = env.crypto().keccak256(&vk_json).into();
        env.storage().instance().set(&Self::key_vk_hash(), &hash);
        Ok(hash)
    }

    /// Verify proof using stored VK (versión simplificada para desarrollo)
    /// 
    /// Esta es una versión simplificada que:
    /// - Valida el formato básico del proof_blob
    /// - Calcula el proof_id (keccak256 del blob)
    /// - Guarda el proof_id para evitar duplicados
    /// 
    /// ⚠️ NOTA: Esta versión NO hace verificación criptográfica completa.
    /// Para producción, usar el verificador Ultrahonk completo.
    pub fn verify_proof_with_stored_vk(
        env: Env,
        proof_blob: Bytes,
    ) -> Result<BytesN<32>, Error> {
        // En desarrollo, el VK es opcional (solo se usa para referencia)
        // Si no está configurado, usamos un VK por defecto
        let _vk_json: Bytes = env
            .storage()
            .instance()
            .get(&Self::key_vk())
            .unwrap_or_else(|| {
                // VK por defecto para desarrollo
                let default_vk = Bytes::from_slice(&env, b"{}");
                env.storage().instance().set(&Self::key_vk(), &default_vk);
                default_vk
            });

        // Validar formato básico del proof_blob
        // Formato esperado: [4-byte count][public_inputs][proof]
        let blob_vec = proof_blob.to_alloc_vec();
        if blob_vec.len() < 4 {
            return Err(Error::InvalidProofFormat);
        }

        // Leer el count de public inputs (primeros 4 bytes)
        let count = u32::from_be_bytes([
            blob_vec[0],
            blob_vec[1],
            blob_vec[2],
            blob_vec[3],
        ]);

        // Validar que haya suficientes bytes
        // Mínimo: 4 bytes (count) + count * 32 bytes (public inputs) + algunos bytes de proof
        let min_size = 4 + (count as usize * 32) + 100; // Al menos 100 bytes de proof
        if blob_vec.len() < min_size {
            return Err(Error::InvalidProofFormat);
        }

        // Calcular proof_id (keccak256 del blob completo)
        let proof_id: BytesN<32> = env.crypto().keccak256(&proof_blob).into();

        // Verificar si este proof ya fue verificado antes
        if env
            .storage()
            .instance()
            .get(&proof_id)
            .unwrap_or(false)
        {
            // Ya fue verificado, retornar el mismo ID
            return Ok(proof_id);
        }

        // ⚠️ VERSIÓN SIMPLIFICADA: Solo validamos formato, no la verificación criptográfica
        // En producción, aquí se haría la verificación real usando el VK
        
        // Guardar que este proof fue "verificado" (en desarrollo, aceptamos cualquier proof con formato válido)
        env.storage().instance().set(&proof_id, &true);

        Ok(proof_id)
    }

    /// Verify proof with explicit VK (para compatibilidad)
    pub fn verify_proof(env: Env, vk_json: Bytes, proof_blob: Bytes) -> Result<BytesN<32>, Error> {
        // Guardar VK temporalmente
        env.storage().instance().set(&Self::key_vk(), &vk_json);
        
        // Usar la función con VK almacenado
        Self::verify_proof_with_stored_vk(env, proof_blob)
    }

    /// Check if a proof_id was previously verified
    pub fn is_verified(env: Env, proof_id: BytesN<32>) -> bool {
        env.storage()
            .instance()
            .get(&proof_id)
            .unwrap_or(false)
    }

    // Helpers para storage keys
    fn key_vk() -> Symbol {
        symbol_short!("vk")
    }

    fn key_vk_hash() -> Symbol {
        symbol_short!("vkh")
    }
}

