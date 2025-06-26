use crate::error::{AppError, Result};
use super::{Game, SaveLocation, with_connection};
use rusqlite::params;

pub trait GameRepository {
    fn add_game(&self, game: &Game, save_locations: &[SaveLocation]) -> Result<()>;
    fn get_game(&self, id: &str) -> Result<(Game, Vec<SaveLocation>)>;
    fn get_all_games(&self) -> Result<Vec<(Game, Vec<SaveLocation>)>>;
    fn update_game(&self, game: &Game) -> Result<()>;
    fn delete_game(&self, game_id: &str) -> Result<()>;
    fn toggle_favorite(&self, game_id: &str) -> Result<()>;
    fn update_backup_time(&self, game_id: &str, backup_time: i64) -> Result<()>;
    fn update_backup_location(&self, game_id: &str, backup_location: &str) -> Result<()>;
}

pub struct SqliteGameRepository;

impl SqliteGameRepository {
    pub fn new() -> Self {
        Self
    }
}

impl GameRepository for SqliteGameRepository {
    fn add_game(&self, game: &Game, save_locations: &[SaveLocation]) -> Result<()> {
        with_connection(|conn| {
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
                params![
                    &game.id,
                    &game.title,
                    &game.cover_image,
                    &game.platform,
                    &game.last_played,
                    &game.save_count,
                    &game.size,
                    &game.status,
                    &game.category,
                    &game.is_favorite,
                    &game.save_location,
                    &game.backup_location,
                    &game.last_backup_time,
                ],
            )?;

            for location in save_locations {
                tx.execute(
                    "INSERT INTO save_locations (game_id, path, pattern) VALUES (?1, ?2, ?3)",
                    params![&location.game_id, &location.path, &location.pattern],
                )?;
            }

            tx.commit()?;
            Ok(())
        })
    }

    fn get_game(&self, id: &str) -> Result<(Game, Vec<SaveLocation>)> {
        with_connection(|conn| {
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
            ).map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Game with id {} not found", id)),
                _ => AppError::from(e),
            })?;

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
            .collect::<std::result::Result<Vec<_>, _>>()?;

            Ok((game, locations))
        })
    }

    fn get_all_games(&self) -> Result<Vec<(Game, Vec<SaveLocation>)>> {
        with_connection(|conn| {
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
                .collect::<std::result::Result<Vec<_>, _>>()?;

                games.push((game, locations));
            }

            Ok(games)
        })
    }

    fn update_game(&self, game: &Game) -> Result<()> {
        with_connection(|conn| {
            let rows_affected = conn.execute(
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
                params![
                    &game.id,
                    &game.title,
                    &game.cover_image,
                    &game.platform,
                    &game.last_played,
                    &game.save_count,
                    &game.size,
                    &game.status,
                    &game.category,
                    &game.is_favorite,
                    &game.save_location,
                    &game.backup_location,
                    &game.last_backup_time,
                ],
            )?;

            if rows_affected == 0 {
                return Err(AppError::NotFound(format!("Game with id {} not found", game.id)));
            }

            Ok(())
        })
    }

    fn delete_game(&self, game_id: &str) -> Result<()> {
        with_connection(|conn| {
            let tx = conn.transaction()?;

            tx.execute(
                "DELETE FROM save_locations WHERE game_id = ?1",
                [game_id],
            )?;

            let rows_affected = tx.execute("DELETE FROM games WHERE id = ?1", [game_id])?;

            if rows_affected == 0 {
                return Err(AppError::NotFound(format!("Game with id {} not found", game_id)));
            }

            tx.commit()?;
            Ok(())
        })
    }

    fn toggle_favorite(&self, game_id: &str) -> Result<()> {
        with_connection(|conn| {
            let rows_affected = conn.execute(
                "UPDATE games SET is_favorite = NOT is_favorite WHERE id = ?1",
                [game_id],
            )?;

            if rows_affected == 0 {
                return Err(AppError::NotFound(format!("Game with id {} not found", game_id)));
            }

            Ok(())
        })
    }

    fn update_backup_time(&self, game_id: &str, backup_time: i64) -> Result<()> {
        with_connection(|conn| {
            let rows_affected = conn.execute(
                "UPDATE games SET last_backup_time = ?1 WHERE id = ?2",
                params![backup_time, game_id],
            )?;

            if rows_affected == 0 {
                return Err(AppError::NotFound(format!("Game with id {} not found", game_id)));
            }

            Ok(())
        })
    }

    fn update_backup_location(&self, game_id: &str, backup_location: &str) -> Result<()> {
        with_connection(|conn| {
            let rows_affected = conn.execute(
                "UPDATE games SET backup_location = ?2 WHERE id = ?1",
                params![game_id, backup_location],
            )?;

            if rows_affected == 0 {
                return Err(AppError::NotFound(format!("Game with id {} not found", game_id)));
            }

            Ok(())
        })
    }
}