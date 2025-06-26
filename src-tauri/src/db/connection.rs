use rusqlite::Connection;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use crate::error::Result;
use crate::utils::PlatformPaths;

static DB_CONNECTION: Lazy<Mutex<Option<Connection>>> = Lazy::new(|| Mutex::new(None));

pub fn init_database() -> Result<()> {
    let db_path = PlatformPaths::app_data_dir().join("rogame.db");
    
    std::fs::create_dir_all(db_path.parent().unwrap())?;
    
    let conn = Connection::open(&db_path)?;
    
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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS save_locations (
            game_id TEXT NOT NULL,
            path TEXT NOT NULL,
            pattern TEXT NOT NULL,
            FOREIGN KEY(game_id) REFERENCES games(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_save_locations_game_id ON save_locations(game_id)",
        [],
    )?;

    *DB_CONNECTION.lock().unwrap() = Some(conn);
    Ok(())
}

pub fn with_connection<T, F>(f: F) -> Result<T>
where
    F: FnOnce(&mut Connection) -> Result<T>,
{
    let mut lock = DB_CONNECTION.lock().unwrap();
    if lock.is_none() {
        drop(lock);
        init_database()?;
        lock = DB_CONNECTION.lock().unwrap();
    }
    
    let conn = lock.as_mut().unwrap();
    f(conn)
}