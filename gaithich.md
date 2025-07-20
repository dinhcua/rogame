# Phân tích chi tiết các hàm Rust và logic backup trong Rogame

## Tổng quan kiến trúc

Rogame là một ứng dụng quản lý file save game được xây dựng với Tauri v2, sử dụng Rust cho backend và React cho frontend. Backend được tổ chức thành các module chính:

- **save_manager.rs**: Quản lý backup/restore file save
- **game_scanner.rs**: Quét và phát hiện game đã cài đặt
- **db.rs**: Xử lý database SQLite
- **lib.rs**: Export các command cho Tauri

## 1. Module Database (db.rs)

### Cấu trúc database

```rust
pub static DB_CONNECTION: Lazy<Mutex<Connection>>
```

- Sử dụng SQLite với connection singleton toàn cục
- Database được lưu tại: `~/Library/Application Support/rogame/rogame.db` (macOS)
- 3 bảng chính:
  - **games**: Lưu thông tin game (id, title, platform, save_location...)
  - **save_files**: Lưu thông tin các file backup
  - **settings**: Lưu cài đặt ứng dụng

### Hàm quan trọng

**execute_blocking()**
- Thực thi query database trong async context
- Tránh block main thread khi truy vấn database
- Pattern này giúp Tauri xử lý nhiều request đồng thời

## 2. Module Game Scanner (game_scanner.rs)

### Chức năng chính

Module này quét và phát hiện game từ nhiều platform:
- Steam
- Epic Games
- GOG (sẽ thêm sau)
- Origin (sẽ thêm sau)

### Quy trình quét game

#### 2.1. Quét Steam Games

```rust
fn get_steam_libraries_with_games() -> Vec<SteamLibrary>
```

**Bước 1**: Đọc file `libraryfolders.vdf` để tìm tất cả thư viện Steam
- macOS: `~/Library/Application Support/Steam/steamapps/libraryfolders.vdf`
- Windows: `C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf`
- Linux: `~/.steam/steam/steamapps/libraryfolders.vdf`

**Bước 2**: Parse VDF file để lấy:
- Đường dẫn các thư viện Steam
- Danh sách App ID của game đã cài

**Bước 3**: Với mỗi App ID, đọc file manifest (`appmanifest_[ID].acf`) để lấy tên game

**Bước 4**: Quét save location theo cấu hình trong `save_game_location.json`

#### 2.2. Quét Epic Games

```rust
// Quét thư mục manifest của Epic
const EPIC_PATHS: &[&str] = &[
    "~/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests", // macOS
    "C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests",           // Windows
];
```

- Đọc các file `.item` trong thư mục manifest
- Parse JSON để lấy thông tin: DisplayName, InstallLocation
- Map với cấu hình save location

### Xử lý save location với wildcard

```rust
fn scan_save_locations(steam_id: &str, game_config: &HashMap<String, GameEntry>) -> Vec<SaveLocation>
```

Hỗ trợ wildcard `*` trong đường dẫn:
- `~/Library/Application Support/Steam/userdata/*/3489700/remote`
- Sử dụng `glob` crate để tìm tất cả thư mục matching

### Các hàm nguy hiểm cần cải thiện

**delete_game_saves()** và **delete_save_file()**
- Thiếu validation đường dẫn → có thể path traversal
- Cần thêm kiểm tra đường dẫn hợp lệ trước khi xóa

## 3. Module Save Manager (save_manager.rs)

### Cấu trúc dữ liệu chính

```rust
struct SaveFile {
    id: String,           // ID của file backup
    game_id: String,      // ID của game
    file_name: String,    // Tên file
    created_at: String,   // Thời gian tạo
    size_bytes: u64,      // Kích thước
    file_path: String,    // Đường dẫn backup
    origin_path: String,  // Đường dẫn gốc
}

struct BackupSettings {
    auto_backup: bool,         // Tự động backup
    backup_interval: String,   // Khoảng thời gian (30min)
    max_backups: i32,          // Số backup tối đa (5)
    compression_enabled: bool, // Nén file (chưa implement)
}
```

### Logic Backup (backup_save)

```rust
#[tauri::command]
pub async fn backup_save(game_id: String) -> Result<BackupResponse, SaveFileError>
```

**Quy trình backup:**

1. **Lấy thông tin game từ database**
   - Nếu không có save_location → đọc từ `save_game_location.json`

2. **Xử lý đường dẫn save**
   - Expand tilde (`~`) thành home directory
   - Xử lý wildcard nếu có

3. **Tạo backup với timestamp**
   ```
   backup_20250120_143022
   ```

4. **Copy file/thư mục**
   - Nếu pattern là `*` → backup cả thư mục
   - Nếu có pattern cụ thể → chỉ backup file matching

5. **Quản lý số lượng backup**
   - Giữ tối đa `max_backups` bản backup
   - Xóa backup cũ nhất nếu vượt giới hạn

6. **Cập nhật database**
   - save_count: số lượng backup hiện tại
   - last_backup_time: thời gian backup cuối

### Logic Restore (restore_save)

```rust
#[tauri::command]
pub async fn restore_save(game_id: String, save_id: String) -> Result<SaveFile, SaveFileError>
```

**Quy trình restore:**

1. **Kiểm tra file backup tồn tại**
   ```
   ~/Library/Application Support/rogame/saves/[game_id]/[save_id]
   ```

2. **Lấy đường dẫn gốc từ database hoặc config**

3. **Restore file/thư mục**
   - Nếu backup là thư mục → copy toàn bộ nội dung
   - Nếu backup là file → copy file đơn lẻ

4. **Cập nhật last_played trong database**

### Các command Tauri được export

```rust
// Quản lý game
get_all_games()        // Lấy danh sách game
get_game_by_id()       // Lấy thông tin 1 game
add_game()             // Thêm game mới
update_game()          // Cập nhật thông tin game
delete_game()          // Xóa game
toggle_favorite()      // Đánh dấu yêu thích

// Backup/Restore
backup_save()          // Backup save game
restore_save()         // Khôi phục save
list_saves()           // Liệt kê các backup
delete_save_file()     // Xóa 1 file backup
delete_game_saves()    // Xóa tất cả backup của game

// Cài đặt
save_backup_settings() // Lưu cài đặt backup
load_backup_settings() // Đọc cài đặt backup

// Đồng bộ
add_game_to_library()  // Thêm game từ scanner vào DB
```

## 4. Cấu hình Save Location (save_game_location.json)

```json
{
  "3489700": {
    "steam_id": "3489700",
    "name": "Stellar Blade",
    "save_locations": {
      "macos": "~/Library/Application Support/Steam/userdata/*/3489700/remote",
      "windows": "~/AppData/Local/SB/Saved/SaveGames",
      "linux": "~/.local/share/Steam/userdata/*/3489700/remote"
    },
    "save_pattern": ["*"]  // Backup toàn bộ thư mục
  }
}
```

- **steam_id**: ID của game trên Steam
- **save_locations**: Đường dẫn save cho từng OS
- **save_pattern**: Pattern file cần backup (`*` = tất cả)

## 5. Luồng xử lý chính

### Scan game mới
1. Frontend gọi `scan_games()`
2. Backend quét Steam/Epic folders
3. Match với config để tìm save location
4. Trả về danh sách game với thông tin save
5. Frontend gọi `add_game_to_library()` để lưu vào DB

### Backup save
1. User click backup
2. Frontend gọi `backup_save(game_id)`
3. Backend tìm save location
4. Copy file/folder vào thư mục backup
5. Giới hạn số backup theo setting
6. Cập nhật DB và trả về kết quả

### Restore save
1. User chọn backup muốn restore
2. Frontend gọi `restore_save(game_id, save_id)`
3. Backend copy từ backup về vị trí gốc
4. Cập nhật last_played time

## 6. Vấn đề cần cải thiện

### Bảo mật
- **Path traversal**: Cần validate đường dẫn input
- **SQL injection**: Một số query dùng string concatenation
- **CSP**: Cần enable Content Security Policy

### Hiệu năng
- **get_directory_size()**: O(n²) khi scan nhiều game
- **N+1 query**: Frontend fetch backup count riêng cho mỗi game
- **No caching**: Metadata game được fetch lại mỗi lần scan

### Code quality
- Nhiều hàm quá dài (>100 lines)
- Duplicate logic giữa Steam và Epic scanner
- Thiếu unit tests và integration tests

## 7. Đề xuất cải tiến

### Ngắn hạn
1. Thêm path validation để ngăn path traversal
2. Implement React.memo cho GameCard component
3. Thêm loading state cho async operations
4. Setup test framework (Vitest + cargo test)

### Dài hạn
1. Refactor scanner thành plugin system
2. Thêm connection pooling cho SQLite
3. Implement file watcher cho realtime monitoring
4. Thêm compression cho backup files