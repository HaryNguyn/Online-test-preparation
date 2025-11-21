class AppConstants {
  // App Info
  static const String appName = 'ExamPrep';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  
  // Exam
  static const int defaultExamDuration = 60; // minutes
  static const int passingPercentage = 60;
  
  // Grades
  static const List<String> gradeOptions = [
    'Lớp 6',
    'Lớp 7',
    'Lớp 8',
    'Lớp 9',
    'Lớp 10',
    'Lớp 11',
    'Lớp 12',
  ];
  
  // Subjects
  static const List<String> subjects = [
    'Toán',
    'Văn',
    'Tiếng Anh',
    'Vật lý',
    'Hóa học',
    'Sinh học',
    'Lịch sử',
    'Địa lý',
  ];
  
  // Question Types
  static const String multipleChoice = 'multiple_choice';
  static const String trueFalse = 'true_false';
  static const String essay = 'essay';
}
