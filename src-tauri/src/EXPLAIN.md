# EXPLAIN.md

## Cấu trúc file libraryfolders.vdf

File `libraryfolders.vdf` là file cấu hình của Steam chứa thông tin về các thư viện game.

### Cấu trúc chính:
- Mỗi thư viện được đánh số (0, 1, 2, 3, 4...)
- Mỗi thư viện chứa:
  - `path`: Đường dẫn đến thư viện
  - `label`: Nhãn (thường để trống)
  - `contentid`: ID nội dung
  - `totalsize`: Tổng dung lượng của ổ đĩa
  - `apps`: Danh sách các game trong thư viện

### Phần "apps":
Trong phần `apps`, mỗi dòng có dạng:
```
"steam_id"    "unknown_value"
```

Ví dụ:
```
"1184140"    "21357340552"
```

- `1184140`: Là Steam ID của game (App ID)
- `21357340552`: **Giá trị không quan trọng** - có thể là dung lượng đã tải, timestamp cài đặt, hoặc metadata khác của Steam

## Cách sử dụng trong game_scanner.rs

### 1. Parse libraryfolders.vdf
Hàm `get_steam_libraries_with_games()` đọc file VDF và:
- Trích xuất đường dẫn của từng thư viện Steam
- Lấy danh sách App ID của các game đã cài đặt trong mỗi thư viện

### 2. Lấy thông tin game từ App ID
Với mỗi App ID, hàm `get_steam_game_name()`:
- Đọc file `appmanifest_<app_id>.acf` trong thư mục steamapps
- Trích xuất tên game từ trường "name" trong file ACF

### 3. Quét game hiệu quả hơn
Thay vì quét tất cả thư mục trong `steamapps/common`, giờ chỉ quét:
- Các game có App ID trong libraryfolders.vdf (đã cài đặt thực sự)
- Fallback sang quét tất cả nếu không tìm thấy App ID

### Lợi ích:
- **Chính xác hơn**: Chỉ hiển thị game thực sự đã cài đặt
- **Nhanh hơn**: Không phải quét các thư mục không phải game
- **Thông tin đầy đủ**: Có thể lấy Steam App ID để tải cover image từ Steam CDN

## Script giả lập Steam cho testing

### setup_fake_steam_macos.sh
Script này tạo môi trường Steam giả trên macOS để test chức năng scan game mà không cần cài đặt Steam thật.

### Cấu trúc tạo ra:
1. **Thư mục Steam chính**: `~/Library/Application Support/Steam/`
   - File `steamapps/libraryfolders.vdf` với 2 library
   - Các file `appmanifest_<app_id>.acf` cho mỗi game
   - Thư mục game trong `steamapps/common/`
   - Save files giả trong `userdata/123456789/`

2. **Library 0** (6 games từ steam_game_location.json):
   - Stellar Blade, Black Myth: Wukong, Doom: The Dark Ages
   - The Witcher 3, Cyberpunk 2077, Red Dead Redemption 2

3. **Library 1** (7 games - giả lập ổ ngoài):
   - God of War Ragnarök, Monster Hunter: World, Resident Evil 4
   - Baldur's Gate 3, Nioh 2, Sekiro, Lies of P

### Cách sử dụng:
```bash
# Chạy script để tạo môi trường giả
./scripts/setup_fake_steam_macos.sh

# Sau đó có thể test game scanner
npm run dev
```

### Lưu ý:
- Script tự động lấy Steam ID từ `steam_game_location.json`
- Tạo cả save files giả theo đúng đường dẫn trong config
- Library 1 chỉ tạo nếu có thư mục `/Volumes/External`
- Hỗ trợ nhiều Steam user ID: 123456789, 987654321, 555666777, 111222333

## Hỗ trợ nhiều Steam User (Multi-Account)

### Vấn đề với {{uid}}
Trong file `steam_game_location.json`, nhiều game sử dụng pattern `{{uid}}` trong đường dẫn save:
```json
"save_locations": {
  "macos": "~/Library/Application Support/Steam/userdata/{{uid}}/3489700/remote"
}
```

### Giải pháp trong game_scanner.rs
Hàm `get_steam_user_ids()` tự động:
1. Quét thư mục `Steam/userdata/` để tìm tất cả user ID
2. Thay thế `{{uid}}` bằng từng user ID thực tế
3. Kiểm tra save files cho tất cả users đã đăng nhập

### Script giả lập multi-user
Script `setup_fake_steam_macos.sh` tạo:
- 4 user ID giả: 123456789, 987654321, 555666777, 111222333
- Save files cho mỗi user trong `userdata/<uid>/`
- Phân biệt 2 loại save:
  - **Steam Cloud saves**: Lưu trong `userdata/<uid>/<app_id>/remote/`
  - **Local saves**: Lưu trong Documents hoặc Application Support

### Lợi ích:
- Quản lý save cho nhiều tài khoản Steam trên cùng máy
- Tự động phát hiện tất cả user đã đăng nhập
- Backup/restore save cho từng user riêng biệt

## Backup toàn bộ thư mục với pattern "*"

### Thay đổi quan trọng
1. **save_pattern: ["*"]** - Khi pattern là "*", hệ thống sẽ backup toàn bộ thư mục thay vì từng file
2. **Wildcard trong path** - Hỗ trợ `userdata/*/app_id/remote` để quét tất cả user

### Cách hoạt động mới

#### Trong game_scanner.rs:
- `scan_location_with_patterns()` kiểm tra nếu pattern là ["*"]:
  - Quét tất cả file trong thư mục (không dùng glob)
  - Tính tổng dung lượng của cả thư mục
  - Luôn thêm vào save_locations ngay cả khi thư mục rỗng

#### Trong save_manager.rs:
- `backup_save()` xử lý backup khác biệt:
  - Tạo thư mục backup với format: `backup_YYYYMMDD_HHMMSS`
  - Sử dụng `copy_dir_recursive()` để copy toàn bộ cấu trúc thư mục
  - Giữ nguyên cấu trúc thư mục và tên file gốc
  - Đếm và xóa backup cũ dựa trên thư mục (không phải file)

### Cấu trúc backup mới:
```
rogame/saves/
├── game1/
│   ├── backup_20250120_143022/
│   │   ├── save1.dat
│   │   ├── save2.dat
│   │   └── config/
│   │       └── settings.ini
│   └── backup_20250120_150512/
│       └── ... (full directory copy)
```

### Lợi ích:
- **Backup toàn diện**: Không bỏ sót file config, settings hay save phụ
- **Giữ cấu trúc**: Dễ dàng restore về đúng vị trí
- **Tiết kiệm cấu hình**: Không cần liệt kê từng loại file
- **Linh hoạt**: Phù hợp với game có cấu trúc save phức tạp

## Sửa lỗi "Failed to backup save file"

### Nguyên nhân lỗi
Lỗi xảy ra do không đồng bộ dữ liệu giữa game scanner và database:
- `GameInfo` từ scanner có `save_locations: Vec<SaveLocation>` (nhiều vị trí)
- `Game` trong database cần `save_location: String` (một vị trí)
- Khi backup, hàm `get_game_by_id()` trả về game với `save_location` rỗng

### Giải pháp
Thêm hàm `sync_game_to_db()` để đồng bộ game từ scanner vào database:

1. **Lấy save location đầu tiên**: Từ mảng `save_locations`, lấy `path` của vị trí đầu tiên
2. **Kiểm tra game tồn tại**: Query database xem game đã có chưa
3. **Update hoặc Insert**: 
   - Nếu có: UPDATE với save_location mới
   - Nếu chưa: INSERT game mới với save_location

### Cách sử dụng trong frontend
```javascript
// Sau khi scan games
const games = await invoke('scan_games');

// Sync từng game vào database
for (const [gameId, gameInfo] of Object.entries(games)) {
  await invoke('sync_game_to_db', { gameInfo });
}

// Giờ có thể backup
await invoke('backup_save', { gameId: 'game1' });
```

### Lưu ý
- Frontend cần gọi `sync_game_to_db` sau mỗi lần scan
- Hoặc tự động sync trong `scan_games` (cần refactor thêm)
- Save location trong DB luôn là path của thư mục đầu tiên tìm thấy

## Cập nhật Game ID

### Thay đổi từ game1, game2 sang Steam ID thực
Trước đây game được gán ID tự động (game1, game2...), giờ sử dụng:
- **Steam games**: Steam App ID (vd: "3489700" cho Stellar Blade)
- **Epic games**: "epic_" + AppName (vd: "epic_FortniteGame")
- **Fallback**: Tên game đã sanitize (vd: "the_witcher_3")

### Frontend Integration
Đã cập nhật `GameUI.tsx` để:
1. Sau khi `scan_games`, tự động gọi `sync_game_to_db` cho từng game
2. Sau khi sync xong, gọi `loadGames()` để refresh UI từ database
3. Game hiển thị trong UI với đầy đủ thông tin và save_location

### Lợi ích:
- ID ổn định, không thay đổi giữa các lần scan
- Dễ dàng tích hợp với Steam Web API
- Backup được lưu theo game ID thực (vd: `/saves/3489700/`)