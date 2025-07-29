use std::path::{Path, PathBuf};
use crate::save_manager::SaveFileError;

/// Validates that a path component doesn't contain path traversal sequences
/// or other dangerous patterns
pub fn validate_path_component(component: &str) -> Result<(), SaveFileError> {
    // Reject empty components
    if component.is_empty() {
        return Err(SaveFileError {
            message: "Path component cannot be empty".to_string(),
        });
    }

    // Reject path traversal sequences
    if component.contains("..") || component.contains("./") || component.contains(".\\") {
        return Err(SaveFileError {
            message: "Path traversal sequences not allowed".to_string(),
        });
    }

    // Reject path separators
    if component.contains('/') || component.contains('\\') {
        return Err(SaveFileError {
            message: "Path separators not allowed in component".to_string(),
        });
    }

    // Reject absolute path indicators
    if component.starts_with('/') || component.starts_with('\\') {
        return Err(SaveFileError {
            message: "Absolute paths not allowed".to_string(),
        });
    }

    // Reject Windows drive letters
    if component.len() >= 2 && component.chars().nth(1) == Some(':') {
        return Err(SaveFileError {
            message: "Drive letters not allowed".to_string(),
        });
    }

    // Reject special characters that could be problematic
    let forbidden_chars = ['<', '>', ':', '"', '|', '?', '*', '\0'];
    if component.chars().any(|c| forbidden_chars.contains(&c)) {
        return Err(SaveFileError {
            message: "Invalid characters in path component".to_string(),
        });
    }

    Ok(())
}

/// Safely joins an untrusted path component to a base directory,
/// ensuring the result stays within the base directory
pub fn safe_join_path(base: &Path, untrusted: &str) -> Result<PathBuf, SaveFileError> {
    // Validate the untrusted component
    validate_path_component(untrusted)?;

    // Join the paths
    let joined = base.join(untrusted);

    // Canonicalize to resolve any symbolic links and normalize the path
    let base_canonical = base
        .canonicalize()
        .map_err(|e| SaveFileError {
            message: format!("Failed to canonicalize base path: {}", e),
        })?;

    // For the joined path, we need to handle the case where it might not exist yet
    let joined_canonical = if joined.exists() {
        joined.canonicalize().map_err(|e| SaveFileError {
            message: format!("Failed to canonicalize joined path: {}", e),
        })?
    } else {
        // If the path doesn't exist, canonicalize the parent and append the filename
        let parent = joined
            .parent()
            .ok_or_else(|| SaveFileError {
                message: "Invalid path structure".to_string(),
            })?;
        
        let parent_canonical = parent.canonicalize().map_err(|e| SaveFileError {
            message: format!("Failed to canonicalize parent path: {}", e),
        })?;

        let file_name = joined
            .file_name()
            .ok_or_else(|| SaveFileError {
                message: "Invalid file name".to_string(),
            })?;

        parent_canonical.join(file_name)
    };

    // Ensure the canonical path is still under the base directory
    if !joined_canonical.starts_with(&base_canonical) {
        return Err(SaveFileError {
            message: "Path traversal attempt detected".to_string(),
        });
    }

    Ok(joined_canonical)
}

/// Expands tilde (~) to home directory and validates the result
pub fn safe_expand_tilde(path: &str) -> Result<PathBuf, SaveFileError> {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            // Validate the rest of the path after ~/
            let rest = &path[2..];
            if rest.contains("..") {
                return Err(SaveFileError {
                    message: "Path traversal in home-relative path".to_string(),
                });
            }
            return Ok(home.join(rest));
        }
    }
    
    // If not a home-relative path, ensure it doesn't contain traversal
    if path.contains("..") {
        return Err(SaveFileError {
            message: "Path traversal sequences not allowed".to_string(),
        });
    }
    
    Ok(PathBuf::from(path))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_path_component() {
        // Valid components
        assert!(validate_path_component("game123").is_ok());
        assert!(validate_path_component("my-save-file").is_ok());
        assert!(validate_path_component("save_001").is_ok());

        // Invalid components
        assert!(validate_path_component("").is_err());
        assert!(validate_path_component("..").is_err());
        assert!(validate_path_component("../etc").is_err());
        assert!(validate_path_component("./hidden").is_err());
        assert!(validate_path_component("game/save").is_err());
        assert!(validate_path_component("game\\save").is_err());
        assert!(validate_path_component("/etc/passwd").is_err());
        assert!(validate_path_component("C:").is_err());
        assert!(validate_path_component("file<>name").is_err());
    }

    #[test]
    fn test_safe_expand_tilde() {
        // Valid paths
        assert!(safe_expand_tilde("~/Documents/saves").is_ok());
        assert!(safe_expand_tilde("/absolute/path").is_ok());
        
        // Invalid paths
        assert!(safe_expand_tilde("~/../etc").is_err());
        assert!(safe_expand_tilde("~/../../etc").is_err());
        assert!(safe_expand_tilde("/path/../../../etc").is_err());
    }
}