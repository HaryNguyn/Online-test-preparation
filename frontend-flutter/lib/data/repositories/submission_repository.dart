import '../providers/api_provider.dart';
import '../models/submission_model.dart';
import '../../core/constants/api_constants.dart';

class SubmissionRepository {
  final ApiProvider _apiProvider;

  SubmissionRepository({required ApiProvider apiProvider})
      : _apiProvider = apiProvider;

  Future<SubmissionModel> submitExam({
    required String examId,
    required String userId,
    required List<dynamic> answers,
  }) async {
    final response = await _apiProvider.post(
      ApiConstants.submissions,
      data: {
        'exam_id': examId,
        'user_id': userId,
        'answers': answers,
      },
    );

    return SubmissionModel.fromJson(response.data['submission']);
  }

  Future<List<SubmissionModel>> getMySubmissions(String userId) async {
    final response = await _apiProvider.get(
      ApiConstants.submissions,
      queryParameters: {'user_id': userId},
    );

    final submissionsJson = response.data['submissions'] as List;
    return submissionsJson
        .map((json) => SubmissionModel.fromJson(json))
        .toList();
  }

  Future<SubmissionModel> getSubmissionById(String id) async {
    final response = await _apiProvider.get(ApiConstants.submissionById(id));
    return SubmissionModel.fromJson(response.data['submission']);
  }

  Future<List<SubmissionModel>> getPendingSubmissions() async {
    final response = await _apiProvider.get(ApiConstants.pendingSubmissions);

    final submissionsJson = response.data['submissions'] as List;
    return submissionsJson
        .map((json) => SubmissionModel.fromJson(json))
        .toList();
  }

  Future<SubmissionModel> gradeSubmission({
    required String submissionId,
    required int score,
    String? feedback,
  }) async {
    final response = await _apiProvider.post(
      ApiConstants.gradeSubmission,
      data: {
        'submission_id': submissionId,
        'score': score,
        if (feedback != null) 'feedback': feedback,
      },
    );

    return SubmissionModel.fromJson(response.data['submission']);
  }

  Future<void> deleteSubmission(String id) async {
    await _apiProvider.delete(ApiConstants.submissionById(id));
  }
}
