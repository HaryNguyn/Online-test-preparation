# ExamPrep Mobile App - Flutter

Ứng dụng mobile cho hệ thống luyện thi trực tuyến, được xây dựng bằng Flutter.

## 📋 Yêu cầu

- Flutter SDK >= 3.0.0
- Dart SDK >= 3.0.0
- Android Studio / VS Code với Flutter extension
- iOS: Xcode (cho Mac)
- Android: Android SDK

## 🚀 Cài đặt

### 1. Cài đặt Flutter

Tải và cài đặt Flutter từ: https://flutter.dev/docs/get-started/install

Kiểm tra cài đặt:
```bash
flutter doctor
```

### 2. Clone và Setup Project

```bash
cd frontend-flutter
flutter pub get
```

### 3. Cấu hình Backend URL

Mở file `lib/core/constants/api_constants.dart` và thay đổi `baseUrl`:

```dart
static const String baseUrl = 'http://YOUR_IP:8080/api';
```

**Lưu ý**: 
- Không dùng `localhost` hoặc `127.0.0.1` khi chạy trên thiết bị thật
- Dùng IP máy tính trong mạng LAN (ví dụ: `192.168.1.100`)
- Đảm bảo backend đang chạy trên port 8080

### 4. Chạy ứng dụng

#### Android:
```bash
flutter run
```

#### iOS (chỉ trên Mac):
```bash
cd ios
pod install
cd ..
flutter run
```

## 📁 Cấu trúc Project

```
lib/
├── core/                   # Core utilities
│   ├── constants/         # API endpoints, app constants
│   ├── theme/            # App themes
│   └── utils/            # Helper functions, validators
├── data/                  # Data layer
│   ├── models/           # Data models
│   ├── providers/        # API client (Dio)
│   └── repositories/     # Data repositories
├── presentation/          # UI layer
│   ├── screens/          # App screens
│   │   ├── auth/        # Login, Register
│   │   ├── student/     # Student screens
│   │   └── teacher/     # Teacher screens
│   └── widgets/          # Reusable widgets
├── state/                 # State management (BLoC)
│   └── auth/             # Authentication BLoC
└── main.dart             # App entry point
```

## 🏗️ Kiến trúc

- **State Management**: Flutter BLoC
- **Network**: Dio
- **Storage**: SharedPreferences + flutter_secure_storage
- **Architecture**: Clean Architecture (3 layers)
  - Presentation Layer (UI)
  - Domain Layer (Business Logic)
  - Data Layer (API, Storage)

## 📱 Tính năng

### Học sinh:
- ✅ Đăng nhập / Đăng ký
- ✅ Dashboard
- 🚧 Xem danh sách bài thi
- 🚧 Làm bài thi (multiple choice, essay, true/false)
- 🚧 Xem kết quả
- 🚧 Xem video học tập
- 🚧 Bảng xếp hạng

### Giáo viên:
- ✅ Đăng nhập / Đăng ký
- ✅ Dashboard
- 🚧 Tạo / Sửa / Xóa bài thi
- 🚧 Chấm bài essay
- 🚧 Quản lý video học tập
- 🚧 Thống kê kết quả học sinh

## 🔧 Build Production

### Android APK:
```bash
flutter build apk --release
```

File APK: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (cho Google Play):
```bash
flutter build appbundle --release
```

### iOS:
```bash
flutter build ios --release
```

## 🐛 Debug

### Xem logs:
```bash
flutter logs
```

### Hot reload (khi đang chạy):
Press `r` trong terminal

### Hot restart:
Press `R` trong terminal

## 📦 Dependencies chính

- `flutter_bloc`: State management
- `dio`: HTTP client
- `shared_preferences`: Local storage
- `flutter_secure_storage`: Secure token storage
- `youtube_player_flutter`: YouTube video player
- `go_router`: Navigation
- `intl`: Internationalization
- `flutter_countdown_timer`: Countdown for exams

## 🔐 Authentication Flow

1. User login → API trả về token
2. Token được lưu trong secure storage
3. Mọi request đều attach token vào header
4. Token expired → Auto logout

## 📝 TODO

- [ ] Implement exam taking screen với timer
- [ ] Implement result detail screen
- [ ] Implement video player screen
- [ ] Implement teacher exam creation
- [ ] Implement teacher grading screen
- [ ] Add push notifications
- [ ] Add offline mode (cache exams)
- [ ] Add dark mode toggle
- [ ] Add biometric authentication

## 👥 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License
