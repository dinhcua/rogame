# Google Drive OAuth 2.0 trong Ứng Dụng Rogame (Tauri)

## Tổng quan

Rogame là ứng dụng quản lý save game được xây dựng với Tauri v2, cho phép người dùng sao lưu và đồng bộ file save game lên Google Drive cá nhân. Tài liệu này mô tả chi tiết cách hoạt động của luồng OAuth 2.0 trong ứng dụng.

## Kiến trúc hệ thống

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Tauri App     │     │ Express      │     │  Google OAuth   │
│  (Frontend)     │────>│ Server:3001  │────>│    Service      │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │                                              │
        │         Deep Link: rogame://oauth-callback   │
        └──────────────────────────────────────────────┘
```

## Luồng xác thực OAuth 2.0

### 1. Khởi tạo xác thực

Khi người dùng nhấn "Kết Nối" Google Drive trong ứng dụng:

```typescript
// Frontend: src/hooks/useCloudStorage.ts
const authenticate = async (provider: CloudProvider) => {
  // Lấy OAuth URL từ server
  const authUrl = await getAuthUrl(provider);
  
  // Mở trình duyệt mặc định bằng Tauri
  await openUrl(authUrl);
};
```

### 2. Tạo URL OAuth

Server tạo URL xác thực Google với các tham số cần thiết:

```typescript
// Server: src/routes/auth.ts
router.get('/:provider/url', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/drive.file'];
  const googleState = encodeURIComponent(JSON.stringify({ provider: 'google' }));
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=${scopes.join(' ')}` +
    `&access_type=offline` +  // Để nhận refresh_token
    `&prompt=consent` +        // Luôn hiện màn hình consent
    `&state=${googleState}`;   // Chống CSRF attack
    
  res.json({ authUrl });
});
```

### 3. Người dùng cấp quyền

1. Trình duyệt mở trang đăng nhập Google
2. Người dùng đăng nhập và cấp quyền cho ứng dụng
3. Google chuyển hướng về: `http://localhost:3001/rest/oauth2-credential/callback?code=...&state=...`

### 4. Xử lý callback

Server nhận authorization code và chuyển hướng về ứng dụng thông qua deep link:

```typescript
// Server: src/routes/auth.ts
router.get('/callback', (req, res) => {
  const { code, state } = req.query;
  
  // Tạo deep link URL cho Tauri app
  const deepLinkUrl = `rogame://oauth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  
  // Trả về HTML tự động chuyển hướng
  res.send(`
    <html>
      <body>
        <h2>Xác thực thành công!</h2>
        <p>Đang quay lại ứng dụng...</p>
        <script>
          window.location.href = '${deepLinkUrl}';
          // Nút bấm thủ công nếu tự động không hoạt động
          setTimeout(() => {
            document.getElementById('openAppBtn').style.display = 'block';
          }, 2000);
        </script>
        <a id="openAppBtn" href="${deepLinkUrl}" style="display:none">
          Mở Rogame
        </a>
      </body>
    </html>
  `);
});
```

### 5. Xử lý Deep Link trong Tauri

Ứng dụng lắng nghe deep link bằng plugin deep-link của Tauri:

```typescript
// Frontend: src/hooks/useCloudStorage.ts
useEffect(() => {
  const setupDeepLinkListener = async () => {
    const unsubscribe = await onOpenUrl((urls) => {
      urls.forEach(url => {
        const urlObj = new URL(url);
        
        // Kiểm tra đây có phải OAuth callback không
        if (urlObj.protocol === 'rogame:' && urlObj.host === 'oauth-callback') {
          const code = urlObj.searchParams.get('code');
          const state = urlObj.searchParams.get('state');
          
          // Parse state để lấy provider
          const stateData = JSON.parse(decodeURIComponent(state));
          processAuthCode(stateData.provider, code);
        }
      });
    });
  };
}, []);
```

### 6. Đổi code lấy token

Frontend gửi authorization code cho server để đổi lấy access token:

```typescript
// Frontend: processAuthCode
const response = await fetch(
  `${CLOUD_SERVER_URL}/auth/${provider}/callback`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  }
);

const { tokens } = await response.json();
```

Server sử dụng Google OAuth2 client để đổi code:

```typescript
// Server: src/services/googleDrive.ts
async authenticate(code: string) {
  const { tokens } = await this.oauth2Client.getToken(code);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expiry_date,
    tokenType: tokens.token_type,
  };
}
```

### 7. Lưu token vào SQLite

Token được lưu vào database SQLite của Tauri để duy trì đăng nhập:

```rust
// Tauri Backend: src/cloud_tokens.rs
#[tauri::command]
pub async fn save_cloud_token(token: CloudToken) -> Result<(), String> {
    execute_blocking(move |conn| {
        conn.execute(
            "INSERT OR REPLACE INTO cloud_tokens 
             (provider, access_token, refresh_token, expires_at, token_type, created_at, updated_at)
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
    }).await
}
```

## Cấu hình

### Biến môi trường (.env)

```env
# Google OAuth2
GOOGLE_CLIENT_ID=1008778809949-pddqifrcko0kptu7gtlcj9gp3k70evm4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3001/rest/oauth2-credential/callback

# CORS
ALLOWED_ORIGINS=http://localhost:1420,http://localhost:5173,tauri://localhost
```

### Cấu hình Tauri (tauri.conf.json)

```json
{
  "identifier": "com.rogame.app",
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["rogame"]
      }
    }
  }
}
```

### Cấu hình Google Cloud Console

1. Tạo project mới trên Google Cloud Console
2. Enable Google Drive API
3. Tạo OAuth 2.0 Client ID (Application type: Web application)
4. Thêm Authorized redirect URIs:
   - `http://localhost:3001/rest/oauth2-credential/callback`
   - `http://localhost:3001/auth/google/callback`

## Bảo mật

### 1. CORS Configuration
Server được cấu hình để chấp nhận requests từ Tauri app:

```typescript
app.use(cors({
  origin: function(origin, callback) {
    // Cho phép tauri:// protocol
    if (origin?.startsWith('tauri://')) {
      callback(null, true);
    }
  }
}));
```

### 2. Token Storage
- Token được lưu trong SQLite database cục bộ
- Database nằm trong thư mục app data của hệ điều hành
- Chỉ ứng dụng mới có quyền truy cập

### 3. State Parameter
- Ngăn chặn CSRF attacks
- Xác định provider trong callback

### 4. Refresh Token
- Được lưu để tự động gia hạn access token
- Access token hết hạn sau 1 giờ
- Refresh token có thể dùng vô thời hạn (trừ khi bị thu hồi)

## Quyền truy cập (Scopes)

Ứng dụng yêu cầu scope:
- `https://www.googleapis.com/auth/drive.file` - Truy cập file do ứng dụng tạo

Scope này cho phép:
- ✅ Tạo file/folder mới trong Google Drive
- ✅ Đọc/ghi file do ứng dụng tạo
- ❌ KHÔNG thể truy cập file khác trong Drive của người dùng

## Vòng đời Token

1. **Xác thực lần đầu**: Người dùng cấp quyền, nhận tokens
2. **Lưu trữ**: Token lưu trong SQLite với thời gian hết hạn
3. **Tự động load**: Token được load khi khởi động app
4. **Làm mới token**: Tự động refresh khi access token hết hạn
5. **Ngắt kết nối**: Xóa token khỏi database

## Xử lý lỗi

### Lỗi thường gặp và cách khắc phục:

1. **500 Internal Server Error**
   - Nguyên nhân: Thiếu biến môi trường
   - Giải pháp: Kiểm tra file .env có đầy đủ thông tin OAuth

2. **CORS Error**
   - Nguyên nhân: Server không cho phép origin từ Tauri
   - Giải pháp: Đã cấu hình cho phép `tauri://` protocol

3. **Deep Link không hoạt động**
   - Nguyên nhân: Scheme chưa đăng ký với OS
   - Giải pháp: Build và cài đặt app để đăng ký scheme

4. **Token không lưu được**
   - Nguyên nhân: Database chưa tạo table
   - Giải pháp: App tự động tạo table khi khởi động

## Tips phát triển

1. **Test OAuth flow**: 
   ```bash
   cd server && npm run dev  # Chạy server
   npm run tauri dev        # Chạy Tauri app
   ```

2. **Debug deep links**:
   - macOS: `open rogame://oauth-callback?code=test`
   - Windows: Start → Run → `rogame://oauth-callback?code=test`

3. **Xem token đã lưu**:
   - Database path: `~/Library/Application Support/rogame/rogame.db`
   - Dùng SQLite browser để xem table `cloud_tokens`

4. **Force refresh token**:
   - Xóa token trong database
   - Hoặc disconnect và connect lại

## Tích hợp với Google Drive API

Sau khi có access token, có thể sử dụng để:

```typescript
// Upload file
const drive = google.drive({ version: 'v3', auth: oauth2Client });
await drive.files.create({
  requestBody: {
    name: 'game-save-backup.zip',
    parents: ['appDataFolder'] // Folder riêng cho app
  },
  media: {
    body: fileStream
  }
});

// List files
const response = await drive.files.list({
  spaces: 'appDataFolder',
  fields: 'files(id, name, size, modifiedTime)'
});
```

## Tóm tắt

Rogame sử dụng OAuth 2.0 flow chuẩn với một số điểm đặc biệt cho Tauri:
- Deep linking để nhận callback từ browser
- SQLite để lưu trữ token persistent
- CORS được cấu hình cho tauri:// protocol
- Lazy initialization để đảm bảo env vars được load

Luồng này đảm bảo an toàn, tuân thủ best practices của Google và cho phép người dùng dễ dàng kết nối Google Drive để backup save game.
