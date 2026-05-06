use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, Params,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use subtle::ConstantTimeEq;
use tauri::State;
use zeroize::Zeroize;

const VAULT_SENTINEL: &[u8] = b"PRIVAULTA_VAULT_V1";
const ARGON2_MEM_KIB: u32 = 65536; // 64 MiB
const ARGON2_ITERS: u32 = 3;
const ARGON2_PARALLELISM: u32 = 1;
const MAX_PASSWORD_CHARS: usize = 128;

pub struct VaultState {
    pub key: Mutex<Option<[u8; 32]>>,
}

#[derive(Serialize, Deserialize)]
pub struct CryptoResult<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

fn normalize(password: &str) -> String {
    use unicode_normalization::UnicodeNormalization;
    password.nfc().collect()
}

fn derive_key(password: &str, salt: &str) -> Result<[u8; 32], String> {
    if password.chars().count() > MAX_PASSWORD_CHARS {
        return Err("Password too long".to_string());
    }

    let argon2 = Argon2::new(
        argon2::Algorithm::Argon2id,
        argon2::Version::V0x13,
        Params::new(ARGON2_MEM_KIB, ARGON2_ITERS, ARGON2_PARALLELISM, Some(32))
            .map_err(|e| e.to_string())?,
    );

    let normalized = normalize(password);
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(normalized.as_bytes(), salt.as_bytes(), &mut key)
        .map_err(|e| e.to_string())?;

    Ok(key)
}

pub(crate) fn encrypt_with_key(key: &[u8; 32], plaintext: &[u8]) -> Result<String, String> {
    encrypt_with_key_aad(key, plaintext, &[])
}

pub(crate) fn encrypt_with_key_aad(
    key: &[u8; 32],
    plaintext: &[u8],
    aad: &[u8],
) -> Result<String, String> {
    let cipher = Aes256Gcm::new(key.into());
    let mut nonce_bytes = [0u8; 12];
    rand::rng().fill(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, Payload { msg: plaintext, aad })
        .map_err(|e| e.to_string())?;
    let mut out = nonce_bytes.to_vec();
    out.extend_from_slice(&ciphertext);
    Ok(BASE64.encode(out))
}

pub(crate) fn decrypt_with_key(key: &[u8; 32], encrypted_base64: &str) -> Result<Vec<u8>, String> {
    decrypt_with_key_aad(key, encrypted_base64, &[])
}

pub(crate) fn decrypt_with_key_aad(
    key: &[u8; 32],
    encrypted_base64: &str,
    aad: &[u8],
) -> Result<Vec<u8>, String> {
    let data = BASE64.decode(encrypted_base64).map_err(|e| e.to_string())?;
    if data.len() < 12 {
        return Err("Invalid ciphertext length".to_string());
    }
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Nonce::from_slice(&data[0..12]);
    cipher
        .decrypt(nonce, Payload { msg: &data[12..], aad })
        .map_err(|_| "Decryption failed".to_string())
}

pub(crate) fn ok<T>(data: T) -> CryptoResult<T> {
    CryptoResult { success: true, data: Some(data), error: None }
}

pub(crate) fn err<T>(msg: impl Into<String>) -> CryptoResult<T> {
    CryptoResult { success: false, data: None, error: Some(msg.into()) }
}

pub(crate) fn lock_state<'a>(
    state: &'a State<'_, VaultState>,
) -> Result<std::sync::MutexGuard<'a, Option<[u8; 32]>>, String> {
    state.key.lock().map_err(|_| "Vault state poisoned".to_string())
}

pub(crate) fn create_verifier_value(password: &str, salt: &str) -> CryptoResult<String> {
    let mut key = match derive_key(password, salt) {
        Ok(k) => k,
        Err(e) => return err(e),
    };
    let result = encrypt_with_key(&key, VAULT_SENTINEL);
    key.zeroize();
    match result {
        Ok(b64) => ok(b64),
        Err(e) => err(e),
    }
}

pub(crate) fn unlock_vault_with_verifier(
    password: &str,
    salt: &str,
    verifier: &str,
    state: State<'_, VaultState>,
) -> CryptoResult<bool> {
    let mut key = match derive_key(password, salt) {
        Ok(k) => k,
        Err(e) => return err(e),
    };

    let plaintext = match decrypt_with_key(&key, verifier) {
        Ok(p) => p,
        Err(_) => {
            key.zeroize();
            return err("Incorrect master password");
        }
    };

    if plaintext.ct_eq(VAULT_SENTINEL).unwrap_u8() != 1 {
        key.zeroize();
        return err("Incorrect master password");
    }

    let mut active_key = match lock_state(&state) {
        Ok(g) => g,
        Err(e) => {
            key.zeroize();
            return err(e);
        }
    };
    if let Some(mut prev) = active_key.take() {
        prev.zeroize();
    }
    *active_key = Some(key);
    ok(true)
}

#[tauri::command]
pub fn lock_vault(state: State<'_, VaultState>) -> CryptoResult<bool> {
    let mut active_key = match lock_state(&state) {
        Ok(g) => g,
        Err(e) => return err(e),
    };
    if let Some(mut key) = active_key.take() {
        key.zeroize();
    }
    ok(true)
}

pub(crate) fn encrypt_active_with_aad(
    plaintext: &str,
    aad: &[u8],
    state: State<'_, VaultState>,
) -> CryptoResult<String> {
    let active_key = match lock_state(&state) {
        Ok(g) => g,
        Err(e) => return err(e),
    };
    let key = match active_key.as_ref() {
        Some(k) => k,
        None => return err("Vault is locked"),
    };
    match encrypt_with_key_aad(key, plaintext.as_bytes(), aad) {
        Ok(b64) => ok(b64),
        Err(e) => err(e),
    }
}

pub(crate) fn decrypt_active_with_aad(
    encrypted_base64: &str,
    aad: &[u8],
    state: State<'_, VaultState>,
) -> CryptoResult<String> {
    let active_key = match lock_state(&state) {
        Ok(g) => g,
        Err(e) => return err(e),
    };
    let key = match active_key.as_ref() {
        Some(k) => k,
        None => return err("Vault is locked"),
    };

    let bytes = match decrypt_with_key_aad(key, encrypted_base64, aad) {
        Ok(b) => b,
        Err(aad_error) => match decrypt_with_key(key, encrypted_base64) {
            Ok(b) => b,
            Err(_) => return err(aad_error),
        },
    };

    match String::from_utf8(bytes) {
        Ok(s) => ok(s),
        Err(_) => err("Decrypted data is not valid UTF-8"),
    }
}

pub(crate) fn generate_salt_value() -> CryptoResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    ok(salt.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aad_must_match_for_entry_ciphertext() {
        let key = [7u8; 32];
        let encrypted = encrypt_with_key_aad(&key, b"secret", b"vault:entry:password").unwrap();

        let plaintext = decrypt_with_key_aad(&key, &encrypted, b"vault:entry:password").unwrap();
        assert_eq!(plaintext, b"secret");

        let wrong = decrypt_with_key_aad(&key, &encrypted, b"vault:other:password");
        assert!(wrong.is_err());
    }
}

