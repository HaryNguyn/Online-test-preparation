import 'package:equatable/equatable.dart';
import 'question_model.dart';

class ExamWithQuestionsModel extends Equatable {
  final String id;
  final String title;
  final String? description;
  final String? subject;
  final String? gradeLevel;
  final int duration;
  final int totalMarks;
  final int passingMarks;
  final String status;
  final String createdBy;
  final DateTime createdAt;
  final String? creatorName;
  final List<QuestionModel> questions;

  const ExamWithQuestionsModel({
    required this.id,
    required this.title,
    this.description,
    this.subject,
    this.gradeLevel,
    required this.duration,
    required this.totalMarks,
    required this.passingMarks,
    required this.status,
    required this.createdBy,
    required this.createdAt,
    this.creatorName,
    required this.questions,
  });

  factory ExamWithQuestionsModel.fromJson(Map<String, dynamic> json) {
    final questionsJson = json['questions'] as List?;
    final questions = questionsJson != null
        ? questionsJson.map((q) => QuestionModel.fromJson(q as Map<String, dynamic>)).toList()
        : <QuestionModel>[];

    return ExamWithQuestionsModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      subject: json['subject'] as String?,
      gradeLevel: json['grade_level'] as String?,
      duration: json['duration'] as int,
      totalMarks: json['total_marks'] as int,
      passingMarks: json['passing_marks'] as int,
      status: json['status'] as String,
      createdBy: json['created_by'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      creatorName: json['creator_name'] as String?,
      questions: questions,
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        subject,
        gradeLevel,
        duration,
        totalMarks,
        passingMarks,
        status,
        createdBy,
        createdAt,
        creatorName,
        questions,
      ];
}
