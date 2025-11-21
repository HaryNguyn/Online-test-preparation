import '../providers/api_provider.dart';
import '../models/user_model.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/storage_helper.dart';

class AuthRepository {
  final ApiProvider _apiProvider;
  final StorageHelper _storage;

  AuthRepository({
    required ApiProvider apiProvider,
    required StorageHelper storage,
  })  : _apiProvider = apiProvider,
        _storage = storage;

  Future<UserModel> login(String email, String password) async {
    final response = await _apiProvider.post(
      ApiConstants.login,
      data: {
        'email': email,
        'password': password,
      },
    );

    final data = response.data;
    // Backend doesn't return token yet, use user ID as token temporarily
    final userJson = data['user'] as Map<String, dynamic>;
    final fakeToken = 'user_${userJson['id']}';

    // Save token and user
    await _storage.saveToken(fakeToken);
    await _storage.saveUser(userJson);

    return UserModel.fromJson(userJson);
  }

  Future<UserModel> register({
    required String email,
    required String password,
    required String name,
    required String role,
    String? grade,
  }) async {
    final response = await _apiProvider.post(
      ApiConstants.register,
      data: {
        'email': email,
        'password': password,
        'name': name,
        'role': role,
        if (grade != null) 'grade': grade,
      },
    );

    final data = response.data;
    // Backend doesn't return token yet, use user ID as token temporarily
    final userJson = data['user'] as Map<String, dynamic>;
    final fakeToken = 'user_${userJson['id']}';

    // Save token and user
    await _storage.saveToken(fakeToken);
    await _storage.saveUser(userJson);

    return UserModel.fromJson(userJson);
  }

  Future<UserModel> getCurrentUser() async {
    final response = await _apiProvider.get(ApiConstants.getCurrentUser);
    final userJson = response.data['user'] as Map<String, dynamic>;
    await _storage.saveUser(userJson);
    return UserModel.fromJson(userJson);
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    await _apiProvider.post(
      ApiConstants.changePassword,
      data: {
        'old_password': oldPassword,
        'new_password': newPassword,
      },
    );
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  UserModel? getCachedUser() {
    final userJson = _storage.getUser();
    if (userJson == null) return null;
    return UserModel.fromJson(userJson);
  }

  Future<String?> getToken() async {
    return await _storage.getToken();
  }
}
