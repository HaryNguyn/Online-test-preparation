import 'package:equatable/equatable.dart';

class QuestionModel extends Equatable {
  final String id;
  final String examId;
  final String questionText;
  final String type;
  final List<String>? options;
  final dynamic correctAnswer;
  final int marks;
  final int orderIndex;

  const QuestionModel({
    required this.id,
    required this.examId,
    required this.questionText,
    required this.type,
    this.options,
    required this.correctAnswer,
    required this.marks,
    required this.orderIndex,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    return QuestionModel(
      id: json['id'] as String,
      examId: json['exam_id'] as String,
      questionText: json['question_text'] as String,
      type: json['type'] as String,
      options: json['options'] != null
          ? List<String>.from(json['options'] as List)
          : null,
      correctAnswer: json['correct_answer'],
      marks: json['marks'] as int,
      orderIndex: json['order_index'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_id': examId,
      'question_text': questionText,
      'type': type,
      'options': options,
      'correct_answer': correctAnswer,
      'marks': marks,
      'order_index': orderIndex,
    };
  }

  bool get isMultipleChoice => type == 'multiple_choice';
  bool get isTrueFalse => type == 'true_false';
  bool get isEssay => type == 'essay';

  @override
  List<Object?> get props => [
        id,
        examId,
        questionText,
        type,
        options,
        correctAnswer,
        marks,
        orderIndex,
      ];
}
