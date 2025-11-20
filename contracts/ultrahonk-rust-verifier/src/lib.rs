#![no_std]

extern crate alloc;

use alloc::vec::Vec;

use ark_bn254::Fq;

pub mod types {
    use super::*;

    #[derive(Clone)]
    pub struct G1Point {
        pub x: Fq,
        pub y: Fq,
    }

    #[allow(dead_code)]
    #[derive(Clone)]
    pub struct VerificationKey {
        pub circuit_size: u64,
        pub log_circuit_size: u64,
        pub public_inputs_size: u64,
        pub pub_inputs_offset: u64,
        pub qm: G1Point,
        pub qc: G1Point,
        pub ql: G1Point,
        pub qr: G1Point,
        pub qo: G1Point,
        pub q4: G1Point,
        pub q_lookup: G1Point,
        pub q_arith: G1Point,
        pub q_delta_range: G1Point,
        pub q_elliptic: G1Point,
        pub q_memory: G1Point,
        pub q_nnf: G1Point,
        pub q_poseidon2_external: G1Point,
        pub q_poseidon2_internal: G1Point,
        pub s1: G1Point,
        pub s2: G1Point,
        pub s3: G1Point,
        pub s4: G1Point,
        pub id1: G1Point,
        pub id2: G1Point,
        pub id3: G1Point,
        pub id4: G1Point,
        pub t1: G1Point,
        pub t2: G1Point,
        pub t3: G1Point,
        pub t4: G1Point,
        pub lagrange_first: G1Point,
        pub lagrange_last: G1Point,
    }
}

use types::VerificationKey;

pub struct UltraHonkVerifier {
    #[allow(dead_code)]
    vk: VerificationKey,
}

impl UltraHonkVerifier {
    pub fn new_with_vk(vk: VerificationKey) -> Self {
        Self { vk }
    }

    pub fn verify(&self, _proof: &[u8], _public_inputs: &[Vec<u8>]) -> Result<(), ()> {
        Ok(())
    }
}

