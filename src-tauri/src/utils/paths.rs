use std::path::PathBuf;

pub fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(&path[2..]);
        }
    }
    PathBuf::from(path)
}

pub struct PlatformPaths;

impl PlatformPaths {
    pub fn steam_paths() -> &'static [&'static str] {
        &[
            "~/Library/Application Support/Steam/steamapps/common", // macOS
            "~/.steam/steam/steamapps/common",                      // Linux
            "C:\\Program Files (x86)\\Steam\\steamapps\\common",    // Windows
        ]
    }

    pub fn epic_paths() -> &'static [&'static str] {
        &[
            "~/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests", // macOS
            "~/.config/Epic/EpicGamesLauncher/Data/Manifests",                     // Linux
            "C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests",           // Windows
        ]
    }

    pub fn gog_paths() -> &'static [&'static str] {
        &[
            "~/Library/Application Support/GOG.com/Galaxy/Games", // macOS
            "~/.local/share/GOG Galaxy/Games",                    // Linux
            "C:\\Program Files (x86)\\GOG Galaxy\\Games",        // Windows
        ]
    }

    pub fn get_platform_path<'a>(paths: &'a [&'a str]) -> &'a str {
        if cfg!(target_os = "macos") {
            paths[0]
        } else if cfg!(target_os = "linux") {
            paths[1]
        } else if cfg!(target_os = "windows") {
            paths[2]
        } else {
            paths[0]
        }
    }

    pub fn app_data_dir() -> PathBuf {
        dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("./"))
            .join("rogame")
    }

    pub fn backup_dir() -> PathBuf {
        Self::app_data_dir().join("saves")
    }

    pub fn config_dir() -> PathBuf {
        dirs::config_local_dir()
            .unwrap_or_else(|| PathBuf::from("./"))
            .join("rogame")
    }
}