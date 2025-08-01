use once_cell::sync::Lazy;
use rusqlite::{Connection, Result as SqlResult};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

// Global database connection
pub static DB_CONNECTION: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let db_path = get_database_path().expect("Failed to get database path");
    let conn = Connection::open(db_path).expect("Failed to open database");
    initialize_database(&conn).expect("Failed to initialize database");
    Mutex::new(conn)
});

// Get the path to the database file
pub fn get_database_path() -> Result<PathBuf, String> {
    let app_data_dir =
        dirs::data_local_dir().ok_or_else(|| "Failed to get app data directory".to_string())?;

    // Use the same directory and database for both dev and prod
    let db_dir = app_data_dir.join("rogame");
    
    fs::create_dir_all(&db_dir)
        .map_err(|e| format!("Failed to create database directory: {}", e))?;

    // Always use rogame.db for both development and production
    Ok(db_dir.join("rogame.db"))
}

// Initialize the database schema
pub fn initialize_database(conn: &Connection) -> SqlResult<()> {
    // Create games table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            cover_image TEXT NOT NULL,
            platform TEXT NOT NULL,
            last_played TEXT NOT NULL,
            save_count INTEGER NOT NULL,
            size TEXT NOT NULL,
            status TEXT NOT NULL,
            category TEXT NOT NULL,
            is_favorite BOOLEAN NOT NULL,
            save_location TEXT NOT NULL,
            backup_location TEXT,
            last_backup_time INTEGER
        )",
        [],
    )?;

    // Create save_files table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS save_files (
            id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            modified_at TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            cloud TEXT,
            FOREIGN KEY (game_id) REFERENCES games(id)
        )",
        [],
    )?;
    
    // Add cloud column to existing save_files table if it doesn't exist
    let _ = conn.execute(
        "ALTER TABLE save_files ADD COLUMN cloud TEXT",
        [],
    ); // Ignore error if column already exists

    // Create settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    // Create cloud_tokens table for OAuth tokens
    conn.execute(
        "CREATE TABLE IF NOT EXISTS cloud_tokens (
            provider TEXT PRIMARY KEY,
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            expires_at INTEGER,
            token_type TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // Create community_saves table for downloaded community saves
    conn.execute(
        "CREATE TABLE IF NOT EXISTS community_saves (
            id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL,
            save_name TEXT NOT NULL,
            description TEXT,
            uploaded_by TEXT NOT NULL,
            uploaded_at TEXT NOT NULL,
            download_date TEXT NOT NULL,
            local_path TEXT NOT NULL,
            zip_path TEXT,
            save_file_id TEXT,
            FOREIGN KEY (game_id) REFERENCES games(id)
        )",
        [],
    )?;
    
    // Add save_file_id column to existing community_saves table if it doesn't exist
    let _ = conn.execute(
        "ALTER TABLE community_saves ADD COLUMN save_file_id TEXT",
        [],
    ); // Ignore error if column already exists

    Ok(())
}

// Helper function to execute a query in a blocking task
pub async fn execute_blocking<F, T>(operation: F) -> Result<T, String>
where
    F: FnOnce(&Connection) -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    tokio::task::spawn_blocking(move || {
        let conn = DB_CONNECTION
            .lock()
            .map_err(|_| "Failed to acquire database lock".to_string())?;

        operation(&conn)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}
