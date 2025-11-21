import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/storage_helper.dart';

class ApiProvider {
  late Dio _dio;
  final StorageHelper _storage = StorageHelper();

  ApiProvider() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    // Add interceptor for token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired, clear and redirect to login
            await _storage.clearAll();
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException error) {
    String errorMessage = 'Đã xảy ra lỗi';

    print('🚨 API Error Type: ${error.type}');
    print('🚨 API Error Message: ${error.message}');
    
    if (error.response != null) {
      print('🚨 Response Status: ${error.response!.statusCode}');
      print('🚨 Response Data: ${error.response!.data}');
      
      final data = error.response!.data;
      if (data is Map) {
        // Backend returns 'error' key, not 'message'
        if (data.containsKey('error')) {
          errorMessage = data['error'];
        } else if (data.containsKey('message')) {
          errorMessage = data['message'];
        } else {
          errorMessage = 'Lỗi: ${error.response!.statusCode}';
        }
      } else {
        errorMessage = 'Lỗi: ${error.response!.statusCode}';
      }
    } else if (error.type == DioExceptionType.connectionTimeout) {
      errorMessage = 'Timeout kết nối';
    } else if (error.type == DioExceptionType.receiveTimeout) {
      errorMessage = 'Timeout nhận dữ liệu';
    } else if (error.type == DioExceptionType.unknown) {
      errorMessage = 'Không thể kết nối đến server. Kiểm tra backend đang chạy.';
    }

    return errorMessage;
  }
}
