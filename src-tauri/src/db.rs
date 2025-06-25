use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub cover_image: String,
    pub platform: String,
    pub last_played: String,
    pub save_count: i32,
    pub size: String,
    pub status: String,
    pub category: String,
    pub is_favorite: bool,
    pub save_location: String,
    pub backup_location: Option<String>,
    pub last_backup_time: Option<i64>,
}

#[derive(Debug)]
pub struct SaveLocation {
    pub game_id: String,
    pub path: String,
    pub pattern: String,
}

fn init_db() -> Result<Connection> {
    let app_dir = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("./"))
        .join("rogame");
    
    fs::create_dir_all(&app_dir).expect("Failed to create app directory");
    
    let db_path = app_dir.join("rogame.db");
    let conn = Connection::open(&db_path)?;
    
    // Initialize database schema
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

    Ok(conn)
}

fn get_db() -> Result<Connection> {
    init_db()
}

pub fn add_game(game: &Game, save_locations: &[SaveLocation]) -> Result<()> {
    let mut conn = get_db()?;
    let tx = conn.transaction()?;

    tx.execute(
        "INSERT INTO games (
            id, title, cover_image, platform, last_played, 
            save_count, size, status, category, is_favorite,
            save_location, backup_location, last_backup_time
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, 
            ?6, ?7, ?8, ?9, ?10,
            ?11, ?12, ?13
        )",
        [
            &game.id,
            &game.title,
            &game.cover_image,
            &game.platform,
            &game.last_played,
            &game.save_count.to_string(),
            &game.size,
            &game.status,
            &game.category,
            &(if game.is_favorite { 1 } else { 0 }).to_string(),
            &game.save_location,
            &game.backup_location.as_ref().unwrap_or(&String::new()),
            &game.last_backup_time.unwrap_or(0).to_string(),
        ],
    )?;

    for location in save_locations {
        tx.execute(
            "INSERT INTO save_locations (game_id, path, pattern) VALUES (?1, ?2, ?3)",
            [&location.game_id, &location.path, &location.pattern],
        )?;
    }

    tx.commit()?;
    Ok(())
}

pub fn get_game(id: &str) -> Result<(Game, Vec<SaveLocation>)> {
    let mut conn = get_db()?;
    
    // Get game
    let game = conn.query_row(
        "SELECT 
            id, title, cover_image, platform, last_played,
            save_count, size, status, category, is_favorite,
            save_location, backup_location, last_backup_time
         FROM games WHERE id = ?1",
        [id],
        |row| {
            Ok(Game {
                id: row.get(0)?,
                title: row.get(1)?,
                cover_image: row.get(2)?,
                platform: row.get(3)?,
                last_played: row.get(4)?,
                save_count: row.get(5)?,
                size: row.get(6)?,
                status: row.get(7)?,
                category: row.get(8)?,
                is_favorite: row.get(9)?,
                save_location: row.get(10)?,
                backup_location: row.get(11)?,
                last_backup_time: row.get(12)?,
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

pub fn get_all_games() -> Result<Vec<(Game, Vec<SaveLocation>)>> {
    let mut conn = get_db()?;
    let mut games = Vec::new();

    let mut stmt = conn.prepare(
        "SELECT 
            id, title, cover_image, platform, last_played,
            save_count, size, status, category, is_favorite,
            save_location, backup_location, last_backup_time
        FROM games"
    )?;

    let game_iter = stmt.query_map([], |row| {
        Ok(Game {
            id: row.get(0)?,
            title: row.get(1)?,
            cover_image: row.get(2)?,
            platform: row.get(3)?,
            last_played: row.get(4)?,
            save_count: row.get(5)?,
            size: row.get(6)?,
            status: row.get(7)?,
            category: row.get(8)?,
            is_favorite: row.get(9)?,
            save_location: row.get(10)?,
            backup_location: row.get(11)?,
            last_backup_time: row.get(12)?,
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

pub fn update_game(game: &Game) -> Result<()> {
    let mut conn = get_db()?;
    conn.execute(
        "UPDATE games SET 
            title = ?2,
            cover_image = ?3,
            platform = ?4,
            last_played = ?5,
            save_count = ?6,
            size = ?7,
            status = ?8,
            category = ?9,
            is_favorite = ?10,
            save_location = ?11,
            backup_location = ?12,
            last_backup_time = ?13
        WHERE id = ?1",
        [
            &game.id,
            &game.title,
            &game.cover_image,
            &game.platform,
            &game.last_played,
            &game.save_count.to_string(),
            &game.size,
            &game.status,
            &game.category,
            &(if game.is_favorite { 1 } else { 0 }).to_string(),
            &game.save_location,
            &game.backup_location.as_ref().unwrap_or(&String::new()),
            &game.last_backup_time.unwrap_or(0).to_string(),
        ],
    )?;
    Ok(())
}

pub fn delete_game(game_id: &str) -> Result<()> {
    let mut conn = get_db()?;
    let tx = conn.transaction()?;

    // Delete save locations first due to foreign key constraint
    tx.execute(
        "DELETE FROM save_locations WHERE game_id = ?1",
        [game_id],
    )?;

    // Then delete the game
    tx.execute("DELETE FROM games WHERE id = ?1", [game_id])?;

    tx.commit()?;
    Ok(())
}

pub fn toggle_favorite(game_id: &str) -> Result<()> {
    let mut conn = get_db()?;
    conn.execute(
        "UPDATE games SET is_favorite = NOT is_favorite WHERE id = ?1",
        [game_id],
    )?;
    Ok(())
}

pub fn update_backup_time(game_id: &str, backup_time: i64) -> Result<()> {
    let mut conn = get_db()?;
    conn.execute(
        "UPDATE games SET last_backup_time = ?2 WHERE id = ?1",
        [game_id, &backup_time.to_string()],
    )?;
    Ok(())
}

pub fn update_backup_location(game_id: &str, backup_location: &str) -> Result<()> {
    let mut conn = get_db()?;
    conn.execute(
        "UPDATE games SET backup_location = ?2 WHERE id = ?1",
        [game_id, backup_location],
    )?;
    Ok(())
} 