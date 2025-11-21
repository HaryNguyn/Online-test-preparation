import '../providers/api_provider.dart';
import '../models/exam_model.dart';
import '../models/exam_with_questions_model.dart';
import '../models/question_model.dart';
import '../../core/constants/api_constants.dart';

class ExamRepository {
  final ApiProvider _apiProvider;

  ExamRepository({required ApiProvider apiProvider})
      : _apiProvider = apiProvider;

  Future<List<ExamModel>> getPublishedExams({
    String? subject,
    String? gradeLevel,
  }) async {
    final response = await _apiProvider.get(
      ApiConstants.exams,
      queryParameters: {
        'status': 'published',
        if (subject != null) 'subject': subject,
        if (gradeLevel != null) 'grade_level': gradeLevel,
      },
    );

    final examsJson = response.data['exams'] as List;
    return examsJson.map((json) => ExamModel.fromJson(json)).toList();
  }

  Future<List<ExamModel>> getMyExams(String teacherId) async {
    final response = await _apiProvider.get(
      ApiConstants.exams,
      queryParameters: {'created_by': teacherId},
    );

    final examsJson = response.data['exams'] as List;
    return examsJson.map((json) => ExamModel.fromJson(json)).toList();
  }

  Future<ExamModel> getExamById(String id) async {
    final response = await _apiProvider.get(ApiConstants.examById(id));
    return ExamModel.fromJson(response.data['exam']);
  }

  Future<ExamWithQuestionsModel> getExamWithQuestions(String id) async {
    final response = await _apiProvider.get(ApiConstants.examById(id));
    return ExamWithQuestionsModel.fromJson(response.data['exam']);
  }

  Future<List<QuestionModel>> getExamQuestions(String examId) async {
    final response = await _apiProvider.get(
      ApiConstants.examQuestions(examId),
    );

    final questionsJson = response.data['questions'] as List;
    return questionsJson.map((json) => QuestionModel.fromJson(json)).toList();
  }

  Future<ExamModel> createExam(Map<String, dynamic> examData) async {
    final response = await _apiProvider.post(
      ApiConstants.exams,
      data: examData,
    );

    return ExamModel.fromJson(response.data['exam']);
  }

  Future<ExamModel> updateExam(String id, Map<String, dynamic> examData) async {
    final response = await _apiProvider.put(
      ApiConstants.examById(id),
      data: examData,
    );

    return ExamModel.fromJson(response.data['exam']);
  }

  Future<void> deleteExam(String id) async {
    await _apiProvider.delete(ApiConstants.examById(id));
  }
}
