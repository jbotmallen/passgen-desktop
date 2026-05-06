use crate::crypto::{self, CryptoResult, VaultState};
use serde::{Deserialize, Serialize};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    FromRow, SqlitePool,
};
use std::{fs, str::FromStr};
use tauri::{AppHandle, Manager, State};

pub struct DbState {
    pool: SqlitePool,
}

pub async fn connect(app: &AppHandle) -> Result<DbState, Box<dyn std::error::Error>> {
    let dir = app.path().app_config_dir()?;
    fs::create_dir_all(&dir)?;
    let url = format!("sqlite:{}", dir.join("privaulta.db").to_string_lossy());
    let options = SqliteConnectOptions::from_str(&url)?
        .create_if_missing(true)
        .foreign_keys(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;
    Ok(DbState { pool })
}

#[derive(Serialize, FromRow)]
pub struct VaultRow {
    id: String,
    name: String,
    icon: String,
    #[serde(rename = "itemCount")]
    item_count: i64,
}

#[derive(Serialize, FromRow)]
pub struct EntryRow {
    id: String,
    title: String,
    username: Option<String>,
    website_url: Option<String>,
    strength: Option<String>,
    category: Option<String>,
    is_favorite: Option<i64>,
    tags: Option<String>,
    encrypted_password: Option<String>,
    encrypted_totp_seed: Option<String>,
    encrypted_notes: Option<String>,
    encrypted_fields: Option<String>,
    updated_at: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct EntryEditRow {
    id: String,
    title: String,
    username: Option<String>,
    website_url: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct VaultSettings {
    vault_id: String,
    auto_lock_duration: i64,
    clipboard_clear_delay: i64,
    theme: String,
    default_generator_mode: String,
}

#[derive(Serialize, FromRow)]
struct AttemptRow {
    fail_count: i64,
    locked_until: i64,
}

#[derive(Serialize)]
pub struct LockoutStatus {
    allowed: bool,
    wait_ms: Option<i64>,
    permanent: Option<bool>,
}

#[derive(Serialize)]
pub struct FailureResult {
    wait_ms: i64,
    fails: i64,
    locked: bool,
}

#[derive(Deserialize)]
pub struct ImportEntryInput {
    vault_id: String,
    title: String,
    username: Option<String>,
    url: Option<String>,
    password: String,
    notes: Option<String>,
    category: String,
    created_at: Option<String>,
    updated_at: Option<String>,
}

const SOFT_FAILS: i64 = 3;
const HARD_LOCK_FAILS: i64 = 10;
const HARD_LOCK_MS: i64 = 60 * 60 * 1000;

fn db_pool(state: &State<'_, DbState>) -> SqlitePool {
    state.pool.clone()
}

fn uuid_like() -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 16];
    rand::rng().fill_bytes(&mut bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    format!(
        "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7],
        bytes[8], bytes[9], bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15]
    )
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn strength(password: &str) -> &'static str {
    let mut score = 0;
    if password.len() >= 12 {
        score += 1;
    }
    if password.len() >= 16 {
        score += 1;
    }
    if password.chars().any(|c| c.is_ascii_lowercase())
        && password.chars().any(|c| c.is_ascii_uppercase())
    {
        score += 1;
    }
    if password.chars().any(|c| c.is_ascii_digit()) {
        score += 1;
    }
    if password.chars().any(|c| !c.is_ascii_alphanumeric()) {
        score += 1;
    }
    match score {
        0..=2 => "Weak",
        3 => "Medium",
        _ => "Strong",
    }
}

fn entry_aad(vault_id: &str, entry_id: &str, field: &str) -> Vec<u8> {
    format!("privaulta:v1:vault:{vault_id}:entry:{entry_id}:field:{field}").into_bytes()
}

async fn ensure_settings_schema(pool: &SqlitePool) -> Result<(), String> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS vault_settings (
          vault_id TEXT PRIMARY KEY,
          auto_lock_duration INTEGER NOT NULL DEFAULT 300000,
          clipboard_clear_delay INTEGER NOT NULL DEFAULT 30000,
          theme TEXT NOT NULL DEFAULT 'dark',
          default_generator_mode TEXT NOT NULL DEFAULT 'standard',
          FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    for migration in [
        "ALTER TABLE vault_settings ADD COLUMN clipboard_clear_delay INTEGER NOT NULL DEFAULT 30000",
        "ALTER TABLE vault_settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark'",
        "ALTER TABLE vault_settings ADD COLUMN default_generator_mode TEXT NOT NULL DEFAULT 'standard'",
    ] {
        let _ = sqlx::query(migration).execute(pool).await;
    }
    Ok(())
}

async fn ensure_settings_for(pool: &SqlitePool, vault_id: &str) -> Result<(), String> {
    ensure_settings_schema(pool).await?;
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO vault_settings (
          vault_id, auto_lock_duration, clipboard_clear_delay, theme, default_generator_mode
        ) VALUES (?1, 300000, 30000, 'dark', 'standard')
        "#,
    )
    .bind(vault_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn crypto_data<T>(res: CryptoResult<T>, fallback: &str) -> Result<T, String> {
    if res.success {
        res.data.ok_or_else(|| fallback.to_string())
    } else {
        Err(res.error.unwrap_or_else(|| fallback.to_string()))
    }
}

#[tauri::command]
pub async fn init_db(db: State<'_, DbState>) -> Result<(), String> {
    let pool = db_pool(&db);
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS vaults (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          verifier TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let _ = sqlx::query("ALTER TABLE vaults RENAME COLUMN password_hash TO verifier")
        .execute(&pool)
        .await;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY,
          vault_id TEXT NOT NULL,
          title TEXT NOT NULL,
          username TEXT,
          website_url TEXT,
          encrypted_password TEXT,
          encrypted_totp_seed TEXT,
          encrypted_notes TEXT,
          strength TEXT,
          category TEXT DEFAULT 'Login',
          is_favorite INTEGER DEFAULT 0,
          tags TEXT,
          encrypted_fields TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS unlock_attempts (
          vault_id TEXT PRIMARY KEY,
          fail_count INTEGER NOT NULL DEFAULT 0,
          last_fail_at INTEGER NOT NULL DEFAULT 0,
          locked_until INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    ensure_settings_schema(&pool).await
}

#[tauri::command]
pub async fn has_vaults(db: State<'_, DbState>) -> Result<bool, String> {
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM vaults")
        .fetch_one(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())?;
    Ok(row.0 > 0)
}

#[tauri::command]
pub async fn list_vaults(db: State<'_, DbState>) -> Result<Vec<VaultRow>, String> {
    sqlx::query_as(
        "SELECT v.id, v.name, v.icon, (SELECT COUNT(*) FROM entries e WHERE e.vault_id = v.id) as item_count FROM vaults v",
    )
    .fetch_all(&db_pool(&db))
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_vault(
    db: State<'_, DbState>,
    name: String,
    icon: String,
    password: String,
) -> Result<String, String> {
    let salt = crypto_data(crypto::generate_salt_value(), "Failed to generate salt")?;
    let verifier = crypto_data(
        crypto::create_verifier_value(&password, &salt),
        "Failed to create verifier",
    )?;
    let id = uuid_like();
    let pool = db_pool(&db);
    sqlx::query("INSERT INTO vaults (id, name, icon, verifier, salt) VALUES (?1, ?2, ?3, ?4, ?5)")
        .bind(&id)
        .bind(name)
        .bind(icon)
        .bind(verifier)
        .bind(salt)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;
    ensure_settings_for(&pool, &id).await?;
    Ok(id)
}

#[tauri::command]
pub async fn unlock_vault_by_id(
    db: State<'_, DbState>,
    crypto_state: State<'_, VaultState>,
    vault_id: String,
    password: String,
) -> Result<CryptoResult<bool>, String> {
    let row: Option<(String, String)> =
        match sqlx::query_as("SELECT verifier, salt FROM vaults WHERE id = ?1")
            .bind(vault_id)
            .fetch_optional(&db_pool(&db))
            .await
        {
            Ok(row) => row,
            Err(e) => return Ok(crypto::err(e.to_string())),
        };
    let Some((verifier, salt)) = row else {
        return Ok(crypto::err("Vault not found"));
    };
    Ok(crypto::unlock_vault_with_verifier(&password, &salt, &verifier, crypto_state))
}

#[tauri::command]
pub async fn list_entries(db: State<'_, DbState>, vault_id: String) -> Result<Vec<EntryRow>, String> {
    sqlx::query_as("SELECT id, title, username, website_url, strength, category, is_favorite, tags, encrypted_password, encrypted_totp_seed, encrypted_notes, encrypted_fields, updated_at FROM entries WHERE vault_id = ?1")
        .bind(vault_id)
        .fetch_all(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_entry_for_edit(
    db: State<'_, DbState>,
    vault_id: String,
    entry_id: String,
) -> Result<Option<EntryEditRow>, String> {
    sqlx::query_as("SELECT id, title, username, website_url FROM entries WHERE id = ?1 AND vault_id = ?2")
        .bind(entry_id)
        .bind(vault_id)
        .fetch_optional(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn decrypt_entry_field(
    db: State<'_, DbState>,
    crypto_state: State<'_, VaultState>,
    vault_id: String,
    entry_id: String,
    field: String,
) -> Result<CryptoResult<String>, String> {
    let column = match field.as_str() {
        "password" => "encrypted_password",
        "notes" => "encrypted_notes",
        "totp_seed" => "encrypted_totp_seed",
        "fields" => "encrypted_fields",
        _ => return Ok(crypto::err("Invalid entry field")),
    };
    let sql = format!("SELECT {column} FROM entries WHERE id = ?1 AND vault_id = ?2");
    let row: Option<(Option<String>,)> = match sqlx::query_as(&sql)
        .bind(&entry_id)
        .bind(&vault_id)
        .fetch_optional(&db_pool(&db))
        .await
    {
        Ok(row) => row,
        Err(e) => return Ok(crypto::err(e.to_string())),
    };
    let Some((Some(ciphertext),)) = row else {
        return Ok(crypto::err("Entry field not found"));
    };
    Ok(crypto::decrypt_active_with_aad(
        &ciphertext,
        &entry_aad(&vault_id, &entry_id, &field),
        crypto_state,
    ))
}

#[tauri::command]
pub async fn save_entry(
    db: State<'_, DbState>,
    crypto_state: State<'_, VaultState>,
    vault_id: String,
    entry_id: Option<String>,
    title: String,
    username: Option<String>,
    url: Option<String>,
    password: String,
    notes: Option<String>,
) -> Result<String, String> {
    let score = strength(&password);
    let pool = db_pool(&db);

    if let Some(id) = entry_id {
        let encrypted_password = crypto_data(
            crypto::encrypt_active_with_aad(
                &password,
                &entry_aad(&vault_id, &id, "password"),
                crypto_state.clone(),
            ),
            "Encryption failed",
        )?;
        let encrypted_notes = match notes.filter(|s| !s.is_empty()) {
            Some(value) => Some(crypto_data(
                crypto::encrypt_active_with_aad(
                    &value,
                    &entry_aad(&vault_id, &id, "notes"),
                    crypto_state,
                ),
                "Encryption failed",
            )?),
            None => None,
        };
        sqlx::query("UPDATE entries SET title = ?1, username = ?2, website_url = ?3, encrypted_password = ?4, encrypted_notes = ?5, strength = ?6, updated_at = CURRENT_TIMESTAMP WHERE id = ?7 AND vault_id = ?8")
            .bind(title)
            .bind(username)
            .bind(url)
            .bind(encrypted_password)
            .bind(encrypted_notes)
            .bind(score)
            .bind(&id)
            .bind(vault_id)
            .execute(&pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(id)
    } else {
        let id = uuid_like();
        let encrypted_password = crypto_data(
            crypto::encrypt_active_with_aad(
                &password,
                &entry_aad(&vault_id, &id, "password"),
                crypto_state.clone(),
            ),
            "Encryption failed",
        )?;
        let encrypted_notes = match notes.filter(|s| !s.is_empty()) {
            Some(value) => Some(crypto_data(
                crypto::encrypt_active_with_aad(
                    &value,
                    &entry_aad(&vault_id, &id, "notes"),
                    crypto_state,
                ),
                "Encryption failed",
            )?),
            None => None,
        };
        sqlx::query("INSERT INTO entries (id, vault_id, title, username, website_url, encrypted_password, encrypted_notes, strength) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
            .bind(&id)
            .bind(vault_id)
            .bind(title)
            .bind(username)
            .bind(url)
            .bind(encrypted_password)
            .bind(encrypted_notes)
            .bind(score)
            .execute(&pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(id)
    }
}

#[tauri::command]
pub async fn import_entry(
    db: State<'_, DbState>,
    crypto_state: State<'_, VaultState>,
    input: ImportEntryInput,
) -> Result<String, String> {
    let id = uuid_like();
    let encrypted_password = crypto_data(
        crypto::encrypt_active_with_aad(
            &input.password,
            &entry_aad(&input.vault_id, &id, "password"),
            crypto_state.clone(),
        ),
        "Encryption failed",
    )?;
    let encrypted_notes = match input.notes.filter(|s| !s.is_empty()) {
        Some(value) => Some(crypto_data(
            crypto::encrypt_active_with_aad(
                &value,
                &entry_aad(&input.vault_id, &id, "notes"),
                crypto_state,
            ),
            "Encryption failed",
        )?),
        None => None,
    };
    let updated = input.updated_at.or_else(|| input.created_at.clone());
    sqlx::query("INSERT INTO entries (id, vault_id, title, username, website_url, encrypted_password, encrypted_notes, strength, category, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, COALESCE(?10, CURRENT_TIMESTAMP), COALESCE(?11, CURRENT_TIMESTAMP))")
        .bind(&id)
        .bind(input.vault_id)
        .bind(input.title)
        .bind(input.username)
        .bind(input.url)
        .bind(encrypted_password)
        .bind(encrypted_notes)
        .bind(strength(&input.password))
        .bind(input.category)
        .bind(input.created_at)
        .bind(updated)
        .execute(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub async fn toggle_entry_favorite(
    db: State<'_, DbState>,
    vault_id: String,
    entry_id: String,
    is_favorite: bool,
) -> Result<(), String> {
    sqlx::query("UPDATE entries SET is_favorite = ?1 WHERE id = ?2 AND vault_id = ?3")
        .bind(if is_favorite { 1 } else { 0 })
        .bind(entry_id)
        .bind(vault_id)
        .execute(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_entry(
    db: State<'_, DbState>,
    vault_id: String,
    entry_id: String,
) -> Result<(), String> {
    sqlx::query("DELETE FROM entries WHERE id = ?1 AND vault_id = ?2")
        .bind(entry_id)
        .bind(vault_id)
        .execute(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn update_entry_tags(
    db: State<'_, DbState>,
    vault_id: String,
    entry_id: String,
    tags: String,
) -> Result<(), String> {
    sqlx::query("UPDATE entries SET tags = ?1 WHERE id = ?2 AND vault_id = ?3")
        .bind(tags)
        .bind(entry_id)
        .bind(vault_id)
        .execute(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn ensure_vault_settings(db: State<'_, DbState>, vault_id: String) -> Result<(), String> {
    ensure_settings_for(&db_pool(&db), &vault_id).await
}

#[tauri::command]
pub async fn get_vault_settings(
    db: State<'_, DbState>,
    vault_id: String,
) -> Result<VaultSettings, String> {
    ensure_settings_for(&db_pool(&db), &vault_id).await?;
    sqlx::query_as("SELECT vault_id, auto_lock_duration, clipboard_clear_delay, theme, default_generator_mode FROM vault_settings WHERE vault_id = ?1")
        .bind(vault_id)
        .fetch_one(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_vault_setting(
    db: State<'_, DbState>,
    vault_id: String,
    key: String,
    value: serde_json::Value,
) -> Result<VaultSettings, String> {
    ensure_settings_for(&db_pool(&db), &vault_id).await?;
    let pool = db_pool(&db);
    match key.as_str() {
        "auto_lock_duration" | "clipboard_clear_delay" => {
            let n = value.as_i64().ok_or_else(|| "Invalid setting value".to_string())?;
            let sql = format!("UPDATE vault_settings SET {key} = ?1 WHERE vault_id = ?2");
            sqlx::query(&sql)
                .bind(n)
                .bind(&vault_id)
                .execute(&pool)
                .await
                .map_err(|e| e.to_string())?;
        }
        "theme" | "default_generator_mode" => {
            let s = value.as_str().ok_or_else(|| "Invalid setting value".to_string())?;
            let sql = format!("UPDATE vault_settings SET {key} = ?1 WHERE vault_id = ?2");
            sqlx::query(&sql)
                .bind(s)
                .bind(&vault_id)
                .execute(&pool)
                .await
                .map_err(|e| e.to_string())?;
        }
        _ => return Err("Invalid setting key".to_string()),
    }
    get_vault_settings(db, vault_id).await
}

#[tauri::command]
pub async fn check_lockout(db: State<'_, DbState>, vault_id: String) -> Result<LockoutStatus, String> {
    let row: Option<AttemptRow> =
        sqlx::query_as("SELECT fail_count, locked_until FROM unlock_attempts WHERE vault_id = ?1")
            .bind(vault_id)
            .fetch_optional(&db_pool(&db))
            .await
            .map_err(|e| e.to_string())?;
    let Some(row) = row else {
        return Ok(LockoutStatus { allowed: true, wait_ms: None, permanent: None });
    };
    if row.fail_count >= HARD_LOCK_FAILS {
        let remaining = row.locked_until - now_ms();
        return Ok(LockoutStatus {
            allowed: false,
            wait_ms: Some(remaining.max(0)),
            permanent: Some(remaining <= 0),
        });
    }
    let remaining = row.locked_until - now_ms();
    if remaining > 0 {
        return Ok(LockoutStatus { allowed: false, wait_ms: Some(remaining), permanent: None });
    }
    Ok(LockoutStatus { allowed: true, wait_ms: None, permanent: None })
}

#[tauri::command]
pub async fn register_failure(db: State<'_, DbState>, vault_id: String) -> Result<FailureResult, String> {
    let prev: Option<(i64,)> = sqlx::query_as("SELECT fail_count FROM unlock_attempts WHERE vault_id = ?1")
        .bind(&vault_id)
        .fetch_optional(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())?;
    let fails = prev.map(|r| r.0).unwrap_or(0) + 1;
    let now = now_ms();
    let locked_until = if fails >= HARD_LOCK_FAILS {
        now + HARD_LOCK_MS
    } else if fails > SOFT_FAILS {
        now + (2_i64.pow((fails - SOFT_FAILS) as u32).min(60) * 1000)
    } else {
        0
    };
    sqlx::query("INSERT INTO unlock_attempts (vault_id, fail_count, last_fail_at, locked_until) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(vault_id) DO UPDATE SET fail_count = excluded.fail_count, last_fail_at = excluded.last_fail_at, locked_until = excluded.locked_until")
        .bind(vault_id)
        .bind(fails)
        .bind(now)
        .bind(locked_until)
        .execute(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())?;
    Ok(FailureResult { wait_ms: (locked_until - now).max(0), fails, locked: fails >= HARD_LOCK_FAILS })
}

#[tauri::command]
pub async fn clear_attempts(db: State<'_, DbState>, vault_id: String) -> Result<(), String> {
    sqlx::query("DELETE FROM unlock_attempts WHERE vault_id = ?1")
        .bind(vault_id)
        .execute(&db_pool(&db))
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

