use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use std::fs;
use once_cell::sync::Lazy;

#[derive(Debug, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub platform: String,
    pub category: String,
    pub cover_image: String,
    pub is_favorite: bool,
    pub last_played: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveLocation {
    pub game_id: String,
    pub path: String,
    pub pattern: String,
}

static DB_CONNECTION: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let app_dir = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("./"))
        .join("rogame");
    
    fs::create_dir_all(&app_dir).expect("Failed to create app directory");
    
    let db_path = app_dir.join("rogame.db");
    let conn = Connection::open(&db_path).expect("Failed to open database");
    
    // Initialize database schema
    conn.execute(
        "CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            platform TEXT NOT NULL,
            category TEXT,
            cover_image TEXT,
            is_favorite BOOLEAN DEFAULT 0,
            last_played TEXT
        )",
        [],
    ).expect("Failed to create games table");

    conn.execute(
        "CREATE TABLE IF NOT EXISTS save_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT NOT NULL,
            path TEXT NOT NULL,
            pattern TEXT NOT NULL,
            FOREIGN KEY(game_id) REFERENCES games(id)
        )",
        [],
    ).expect("Failed to create save_locations table");

    Mutex::new(conn)
});

pub fn add_game(game: &Game, locations: &[SaveLocation]) -> Result<(), rusqlite::Error> {
    let mut conn = DB_CONNECTION.lock().unwrap();
    let tx = conn.transaction()?;

    // Insert game
    tx.execute(
        "INSERT INTO games (id, title, platform, category, cover_image, is_favorite, last_played)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (
            &game.id,
            &game.title,
            &game.platform,
            &game.category,
            &game.cover_image,
            &game.is_favorite,
            &game.last_played,
        ),
    )?;

    // Insert save locations
    for location in locations {
        tx.execute(
            "INSERT INTO save_locations (game_id, path, pattern)
             VALUES (?1, ?2, ?3)",
            (&location.game_id, &location.path, &location.pattern),
        )?;
    }

    tx.commit()?;
    Ok(())
}

pub fn get_game(id: &str) -> Result<(Game, Vec<SaveLocation>), rusqlite::Error> {
    let mut conn = DB_CONNECTION.lock().unwrap();
    
    // Get game
    let game = conn.query_row(
        "SELECT id, title, platform, category, cover_image, is_favorite, last_played
         FROM games WHERE id = ?1",
        [id],
        |row| {
            Ok(Game {
                id: row.get(0)?,
                title: row.get(1)?,
                platform: row.get(2)?,
                category: row.get(3)?,
                cover_image: row.get(4)?,
                is_favorite: row.get(5)?,
                last_played: row.get(6)?,
            })
        },
    )?;

    // Get save locations
    let mut stmt = conn.prepare(
        "SELECT game_id, path, pattern
         FROM save_locations
         WHERE game_id = ?1"
    )?;

    let locations = stmt.query_map([id], |row| {
        Ok(SaveLocation {
            game_id: row.get(0)?,
            path: row.get(1)?,
            pattern: row.get(2)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;

    Ok((game, locations))
}

pub fn get_all_games() -> Result<Vec<(Game, Vec<SaveLocation>)>, rusqlite::Error> {
    let mut conn = DB_CONNECTION.lock().unwrap();
    let mut games = Vec::new();

    let mut stmt = conn.prepare(
        "SELECT id, title, platform, category, cover_image, is_favorite, last_played
         FROM games"
    )?;

    let game_iter = stmt.query_map([], |row| {
        Ok(Game {
            id: row.get(0)?,
            title: row.get(1)?,
            platform: row.get(2)?,
            category: row.get(3)?,
            cover_image: row.get(4)?,
            is_favorite: row.get(5)?,
            last_played: row.get(6)?,
        })
    })?;

    for game_result in game_iter {
        let game = game_result?;
        let mut stmt = conn.prepare(
            "SELECT game_id, path, pattern
             FROM save_locations
             WHERE game_id = ?1"
        )?;

        let locations = stmt.query_map([&game.id], |row| {
            Ok(SaveLocation {
                game_id: row.get(0)?,
                path: row.get(1)?,
                pattern: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        games.push((game, locations));
    }

    Ok(games)
}

pub fn update_game(game: &Game, locations: &[SaveLocation]) -> Result<(), rusqlite::Error> {
    let mut conn = DB_CONNECTION.lock().unwrap();
    let tx = conn.transaction()?;

    // Update game
    tx.execute(
        "UPDATE games 
         SET title = ?1, platform = ?2, category = ?3, cover_image = ?4, is_favorite = ?5, last_played = ?6
         WHERE id = ?7",
        (
            &game.title,
            &game.platform,
            &game.category,
            &game.cover_image,
            &game.is_favorite,
            &game.last_played,
            &game.id,
        ),
    )?;

    // Delete old save locations
    tx.execute(
        "DELETE FROM save_locations WHERE game_id = ?1",
        [&game.id],
    )?;

    // Insert new save locations
    for location in locations {
        tx.execute(
            "INSERT INTO save_locations (game_id, path, pattern)
             VALUES (?1, ?2, ?3)",
            (&location.game_id, &location.path, &location.pattern),
        )?;
    }

    tx.commit()?;
    Ok(())
}

pub fn delete_game(id: &str) -> Result<(), rusqlite::Error> {
    let mut conn = DB_CONNECTION.lock().unwrap();
    let tx = conn.transaction()?;

    // Delete save locations first (due to foreign key constraint)
    tx.execute(
        "DELETE FROM save_locations WHERE game_id = ?1",
        [id],
    )?;

    // Delete game
    tx.execute(
        "DELETE FROM games WHERE id = ?1",
        [id],
    )?;

    tx.commit()?;
    Ok(())
} 