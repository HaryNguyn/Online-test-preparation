import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/storage_helper.dart';
import 'data/providers/api_provider.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/exam_repository.dart';
import 'data/repositories/submission_repository.dart';
import 'data/repositories/video_repository.dart';
import 'state/auth/auth_bloc.dart';
import 'state/auth/auth_event.dart';
import 'state/auth/auth_state.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/auth/register_screen.dart';
import 'presentation/screens/student/dashboard_screen.dart';
import 'presentation/screens/student/exams_list_screen.dart';
import 'presentation/screens/student/exam_taking_screen.dart';
import 'presentation/screens/student/results_screen.dart';
import 'presentation/screens/student/videos_screen.dart';
import 'presentation/screens/student/video_player_screen.dart';
import 'presentation/screens/student/result_detail_screen.dart';
import 'presentation/screens/student/leaderboard_screen.dart';
import 'presentation/screens/teacher/teacher_dashboard_screen.dart';
import 'presentation/screens/teacher/create_exam_screen.dart';
import 'presentation/screens/teacher/upload_video_screen.dart';
import 'data/models/video_model.dart';
import 'data/models/submission_model.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize storage
  await StorageHelper().init();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Initialize dependencies
    final apiProvider = ApiProvider();
    final storage = StorageHelper();
    final authRepository = AuthRepository(
      apiProvider: apiProvider,
      storage: storage,
    );
    final examRepository = ExamRepository(apiProvider: apiProvider);
    final submissionRepository = SubmissionRepository(apiProvider: apiProvider);
    final videoRepository = VideoRepository(apiProvider: apiProvider);

    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: authRepository),
        RepositoryProvider.value(value: examRepository),
        RepositoryProvider.value(value: submissionRepository),
        RepositoryProvider.value(value: videoRepository),
      ],
      child: BlocProvider(
        create: (context) => AuthBloc(authRepository: authRepository)
          ..add(const AuthCheckRequested()),
        child: MaterialApp(
          title: 'ExamPrep',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeMode.system,
          home: const AuthWrapper(),
          routes: {
            '/login': (context) => const LoginScreen(),
            '/register': (context) => const RegisterScreen(),
            '/student-dashboard': (context) => const StudentDashboardScreen(),
            '/teacher-dashboard': (context) => const TeacherDashboardScreen(),
            '/exams-list': (context) => const ExamsListScreen(),
            '/results': (context) => const ResultsScreen(),
            '/videos': (context) => const VideosScreen(),
            '/create-exam': (context) => const CreateExamScreen(),
            '/upload-video': (context) => const UploadVideoScreen(),
            '/leaderboard': (context) => const LeaderboardScreen(),
          },
          onGenerateRoute: (settings) {
            if (settings.name == '/exam-taking') {
              final examId = settings.arguments as String;
              return MaterialPageRoute(
                builder: (context) => ExamTakingScreen(examId: examId),
              );
            } else if (settings.name == '/video-player') {
              final video = settings.arguments as VideoModel;
              return MaterialPageRoute(
                builder: (context) => VideoPlayerScreen(video: video),
              );
            } else if (settings.name == '/result-detail') {
              final submission = settings.arguments as SubmissionModel;
              return MaterialPageRoute(
                builder: (context) => ResultDetailScreen(submission: submission),
              );
            }
            return null;
          },
        ),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthLoading || state is AuthInitial) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (state is AuthAuthenticated) {
          // Navigate based on user role
          if (state.user.isStudent) {
            return const StudentDashboardScreen();
          } else if (state.user.isTeacher) {
            return const TeacherDashboardScreen();
          }
        }

        return const LoginScreen();
      },
    );
  }
}
