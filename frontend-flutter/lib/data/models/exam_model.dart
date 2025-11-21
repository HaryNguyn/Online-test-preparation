import 'package:equatable/equatable.dart';

class ExamModel extends Equatable {
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

  const ExamModel({
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
  });

  factory ExamModel.fromJson(Map<String, dynamic> json) {
    return ExamModel(
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
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'subject': subject,
      'grade_level': gradeLevel,
      'duration': duration,
      'total_marks': totalMarks,
      'passing_marks': passingMarks,
      'status': status,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
      'creator_name': creatorName,
    };
  }

  bool get isPublished => status == 'published';
  bool get isDraft => status == 'draft';

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
      ];
}
