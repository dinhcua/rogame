use crate::db::execute_blocking;
use chrono::Utc;
use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudToken {
    pub provider: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<i64>,
    pub token_type: Option<String>,
}

#[tauri::command]
pub async fn save_cloud_token(token: CloudToken) -> Result<(), String> {
    execute_blocking(move |conn| {
        let now = Utc::now().timestamp();

        println!("Saving cloud token: {:?}", token);
        
        conn.execute(
            "INSERT OR REPLACE INTO cloud_tokens (provider, access_token, refresh_token, expires_at, token_type, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            (
                &token.provider,
                &token.access_token,
                &token.refresh_token.as_deref().unwrap_or(""),
                &token.expires_at.map(|e| e.to_string()).as_deref().unwrap_or(""),
                &token.token_type.as_deref().unwrap_or(""),
                &now.to_string(),
                &now.to_string(),
            ),
        )
        .map_err(|e| format!("Failed to save cloud token: {}", e))?;
        
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn get_cloud_token(provider: String) -> Result<Option<CloudToken>, String> {
    execute_blocking(move |conn| {
        println!("Getting cloud token for provider: {}", provider);

        let mut stmt = conn
            .prepare(
                "SELECT provider, access_token, refresh_token, expires_at, token_type 
                 FROM cloud_tokens 
                 WHERE provider = ?1",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let token = stmt
            .query_row([&provider], |row| {
                Ok(CloudToken {
                    provider: row.get(0)?,
                    access_token: row.get(1)?,
                    refresh_token: row.get::<_, String>(2).ok().filter(|s| !s.is_empty()),
                    expires_at: row.get::<_, String>(3).ok()
                        .and_then(|s| s.parse::<i64>().ok())
                        .filter(|&e| e > 0),
                    token_type: row.get::<_, String>(4).ok().filter(|s| !s.is_empty()),
                })
            })
            .optional()
            .map_err(|e| format!("Failed to get cloud token: {}", e))?;

        println!("Token: {:?}", token);
        
        Ok(token)
    })
    .await
}

#[tauri::command]
pub async fn delete_cloud_token(provider: String) -> Result<(), String> {
    execute_blocking(move |conn| {
        println!("Deleting cloud token for provider: {}", provider);
        
        conn.execute(
            "DELETE FROM cloud_tokens WHERE provider = ?1",
            [&provider],
        )
        .map_err(|e| format!("Failed to delete cloud token: {}", e))?;
        
        Ok(())
    })
    .await
}

// Removed unused function: get_all_cloud_tokens
// This function was not being called from the frontend
#[allow(dead_code)]
async fn _get_all_cloud_tokens() -> Result<Vec<CloudToken>, String> {
    execute_blocking(move |conn| {
        let mut stmt = conn
            .prepare(
                "SELECT provider, access_token, refresh_token, expires_at, token_type 
                 FROM cloud_tokens",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let tokens = stmt
            .query_map([], |row| {
                Ok(CloudToken {
                    provider: row.get(0)?,
                    access_token: row.get(1)?,
                    refresh_token: row.get::<_, String>(2).ok().filter(|s| !s.is_empty()),
                    expires_at: row.get::<_, String>(3).ok()
                        .and_then(|s| s.parse::<i64>().ok())
                        .filter(|&e| e > 0),
                    token_type: row.get::<_, String>(4).ok().filter(|s| !s.is_empty()),
                })
            })
            .map_err(|e| format!("Failed to query tokens: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect tokens: {}", e))?;

        println!("All cloud tokens: {:?}", tokens);
        
        Ok(tokens)
    })
    .await
}