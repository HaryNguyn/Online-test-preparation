import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

class StorageHelper {
  static final StorageHelper _instance = StorageHelper._internal();
  factory StorageHelper() => _instance;
  StorageHelper._internal();
  
  final _secureStorage = const FlutterSecureStorage();
  SharedPreferences? _prefs;
  
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }
  
  // Token Management (Secure)
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
  }
  
  Future<String?> getToken() async {
    return await _secureStorage.read(key: 'auth_token');
  }
  
  Future<void> deleteToken() async {
    await _secureStorage.delete(key: 'auth_token');
  }
  
  // User Data (Regular)
  Future<void> saveUser(Map<String, dynamic> user) async {
    await _prefs?.setString('user_data', json.encode(user));
  }
  
  Map<String, dynamic>? getUser() {
    final userStr = _prefs?.getString('user_data');
    if (userStr == null) return null;
    return json.decode(userStr) as Map<String, dynamic>;
  }
  
  Future<String?> getUserId() async {
    final user = getUser();
    return user?['id']?.toString();
  }
  
  Future<void> deleteUser() async {
    await _prefs?.remove('user_data');
  }
  
  // Theme
  Future<void> saveThemeMode(bool isDark) async {
    await _prefs?.setBool('is_dark_mode', isDark);
  }
  
  bool getThemeMode() {
    return _prefs?.getBool('is_dark_mode') ?? false;
  }
  
  // Clear All
  Future<void> clearAll() async {
    await deleteToken();
    await deleteUser();
    await _prefs?.clear();
  }
}
