import 'package:equatable/equatable.dart';

class SubmissionModel extends Equatable {
  final String id;
  final String examId;
  final String userId;
  final Map<String, dynamic> answers;
  final int score;
  final int totalMarks;
  final double percentage;
  final String gradingStatus;
  final DateTime submittedAt;
  final String? examTitle;
  final String? userName;

  const SubmissionModel({
    required this.id,
    required this.examId,
    required this.userId,
    required this.answers,
    required this.score,
    required this.totalMarks,
    required this.percentage,
    required this.gradingStatus,
    required this.submittedAt,
    this.examTitle,
    this.userName,
  });

  factory SubmissionModel.fromJson(Map<String, dynamic> json) {
    final answersData = json['answers'];
    Map<String, dynamic> answersMap = {};
    
    if (answersData is Map) {
      answersMap = Map<String, dynamic>.from(answersData);
    } else if (answersData is List) {
      // Convert old list format to map format
      for (var i = 0; i < answersData.length; i++) {
        answersMap[i.toString()] = answersData[i];
      }
    }

    return SubmissionModel(
      id: json['id'] as String,
      examId: json['exam_id'] as String,
      userId: json['user_id'] as String,
      answers: answersMap,
      score: json['score'] as int,
      totalMarks: json['total_marks'] as int,
      percentage: (json['percentage'] as num).toDouble(),
      gradingStatus: json['grading_status'] as String,
      submittedAt: DateTime.parse(json['submitted_at'] as String),
      examTitle: json['exam_title'] as String?,
      userName: json['user_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_id': examId,
      'user_id': userId,
      'answers': answers,
      'score': score,
      'total_marks': totalMarks,
      'percentage': percentage,
      'grading_status': gradingStatus,
      'submitted_at': submittedAt.toIso8601String(),
      'exam_title': examTitle,
      'user_name': userName,
    };
  }

  bool get isPassed => percentage >= 60;
  bool get isPendingManualGrading => gradingStatus == 'pending_manual';
  bool get isGraded => gradingStatus == 'manually_graded' || gradingStatus == 'auto_graded';

  @override
  List<Object?> get props => [
        id,
        examId,
        userId,
        answers,
        score,
        totalMarks,
        percentage,
        gradingStatus,
        submittedAt,
        examTitle,
        userName,
      ];
}
