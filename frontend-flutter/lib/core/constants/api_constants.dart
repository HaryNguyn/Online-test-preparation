class ApiConstants {
  // Base URL - Dùng localhost khi chạy trên web, dùng IP khi chạy trên mobile device
  static const String baseUrl = 'http://localhost:8080/api';
  
  // Auth Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String getCurrentUser = '/auth/me';
  static const String changePassword = '/auth/change-password';
  
  // Exam Endpoints
  static const String exams = '/exams';
  static String examById(String id) => '/exams/$id';
  static String examQuestions(String id) => '/exams/$id/questions';
  static String examSubmissions(String id) => '/exams/$id/submissions';
  
  // Submission Endpoints
  static const String submissions = '/submissions';
  static String submissionById(String id) => '/submissions/$id';
  static const String pendingSubmissions = '/submissions/pending';
  static const String gradeSubmission = '/submissions/grade';
  
  // Video Endpoints
  static const String videos = '/videos';
  static String videoById(String id) => '/videos/$id';
  
  // Leaderboard Endpoints
  static const String leaderboard = '/leaderboard';
  static String leaderboardByExam(String examId) => '/leaderboard/exam/$examId';
  
  // User Endpoints
  static const String users = '/users';
  static String userById(String id) => '/users/$id';
}
