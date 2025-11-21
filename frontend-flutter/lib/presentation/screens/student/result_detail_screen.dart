import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/models/submission_model.dart';
import '../../../data/models/exam_with_questions_model.dart';
import '../../../data/models/question_model.dart';
import '../../../data/repositories/exam_repository.dart';

class ResultDetailScreen extends StatefulWidget {
  final SubmissionModel submission;

  const ResultDetailScreen({
    super.key,
    required this.submission,
  });

  @override
  State<ResultDetailScreen> createState() => _ResultDetailScreenState();
}

class _ResultDetailScreenState extends State<ResultDetailScreen> {
  ExamWithQuestionsModel? _exam;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadExamDetails();
  }

  Future<void> _loadExamDetails() async {
    try {
      final examRepository = context.read<ExamRepository>();
      final exam = await examRepository.getExamWithQuestions(widget.submission.examId);
      setState(() {
        _exam = exam;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải chi tiết: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết kết quả'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _exam == null
              ? const Center(child: Text('Không tìm thấy bài thi'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Score Summary Card
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _exam!.title,
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${_exam!.subject} - ${_exam!.gradeLevel}',
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: _getScoreColor(widget.submission.percentage)
                                        .withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: _getScoreColor(widget.submission.percentage),
                                      width: 2,
                                    ),
                                  ),
                                  child: Column(
                                    children: [
                                      Text(
                                        '${widget.submission.score}',
                                        style: TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.bold,
                                          color: _getScoreColor(widget.submission.percentage),
                                        ),
                                      ),
                                      Text(
                                        '/${widget.submission.totalMarks}',
                                        style: TextStyle(
                                          fontSize: 16,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Divider(),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _StatItem(
                                  icon: Icons.percent,
                                  label: 'Phần trăm',
                                  value: '${widget.submission.percentage.toStringAsFixed(1)}%',
                                  color: _getScoreColor(widget.submission.percentage),
                                ),
                                _StatItem(
                                  icon: Icons.check_circle,
                                  label: 'Đúng',
                                  value: _getCorrectAnswers().toString(),
                                  color: Colors.green,
                                ),
                                _StatItem(
                                  icon: Icons.cancel,
                                  label: 'Sai',
                                  value: _getWrongAnswers().toString(),
                                  color: Colors.red,
                                ),
                                _StatItem(
                                  icon: Icons.help_outline,
                                  label: 'Chưa làm',
                                  value: _getUnanswered().toString(),
                                  color: Colors.orange,
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (!widget.submission.isGraded)
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.orange.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.hourglass_empty, color: Colors.orange[700]),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'Bài thi có câu tự luận đang chờ giáo viên chấm',
                                        style: TextStyle(
                                          color: Colors.orange[900],
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Questions List
                    const Text(
                      'Chi tiết từng câu',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...List.generate(_exam!.questions.length, (index) {
                      final question = _exam!.questions[index];
                      final userAnswer = widget.submission.answers[question.id];
                      return _QuestionCard(
                        question: question,
                        questionNumber: index + 1,
                        userAnswer: userAnswer,
                        isGraded: widget.submission.isGraded,
                      );
                    }),
                  ],
                ),
    );
  }

  Color _getScoreColor(double percentage) {
    if (percentage >= 80) return Colors.green;
    if (percentage >= 50) return Colors.orange;
    return Colors.red;
  }

  int _getCorrectAnswers() {
    if (_exam == null) return 0;
    int correct = 0;
    for (var question in _exam!.questions) {
      if (question.type == 'essay') continue;
      final userAnswer = widget.submission.answers[question.id];
      if (userAnswer == question.correctAnswer) {
        correct++;
      }
    }
    return correct;
  }

  int _getWrongAnswers() {
    if (_exam == null) return 0;
    int wrong = 0;
    for (var question in _exam!.questions) {
      if (question.type == 'essay') continue;
      final userAnswer = widget.submission.answers[question.id];
      if (userAnswer != null && userAnswer != question.correctAnswer) {
        wrong++;
      }
    }
    return wrong;
  }

  int _getUnanswered() {
    if (_exam == null) return 0;
    int unanswered = 0;
    for (var question in _exam!.questions) {
      if (question.type == 'essay') continue;
      final userAnswer = widget.submission.answers[question.id];
      if (userAnswer == null || userAnswer.toString().isEmpty) {
        unanswered++;
      }
    }
    return unanswered;
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}

class _QuestionCard extends StatelessWidget {
  final QuestionModel question;
  final int questionNumber;
  final dynamic userAnswer;
  final bool isGraded;

  const _QuestionCard({
    required this.question,
    required this.questionNumber,
    required this.userAnswer,
    required this.isGraded,
  });

  @override
  Widget build(BuildContext context) {
    final isCorrect = userAnswer == question.correctAnswer;
    final isAnswered = userAnswer != null && userAnswer.toString().isNotEmpty;
    final isEssay = question.type == 'essay';

    Color borderColor = Colors.grey;
    Color backgroundColor = Colors.white;
    
    if (isEssay) {
      borderColor = Colors.blue;
      backgroundColor = Colors.blue.shade50;
    } else if (isAnswered) {
      if (isCorrect) {
        borderColor = Colors.green;
        backgroundColor = Colors.green.shade50;
      } else {
        borderColor = Colors.red;
        backgroundColor = Colors.red.shade50;
      }
    } else {
      borderColor = Colors.orange;
      backgroundColor = Colors.orange.shade50;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: backgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: borderColor, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: borderColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Câu $questionNumber',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Chip(
                  label: Text('${question.marks} điểm'),
                  backgroundColor: Colors.white,
                  side: BorderSide(color: borderColor),
                ),
                const Spacer(),
                if (!isEssay)
                  Icon(
                    isAnswered
                        ? (isCorrect ? Icons.check_circle : Icons.cancel)
                        : Icons.help_outline,
                    color: borderColor,
                    size: 28,
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Question Text
            Text(
              question.questionText,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),

            // Multiple Choice / True False
            if (question.isMultipleChoice || question.isTrueFalse) ...[
              ...question.options!.map((option) {
                final isUserAnswer = userAnswer == option;
                final isCorrectAnswer = question.correctAnswer == option;

                Color optionColor = Colors.grey.shade300;
                IconData? icon;

                if (isCorrectAnswer) {
                  optionColor = Colors.green.shade200;
                  icon = Icons.check_circle;
                } else if (isUserAnswer && !isCorrectAnswer) {
                  optionColor = Colors.red.shade200;
                  icon = Icons.cancel;
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: optionColor,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isCorrectAnswer
                          ? Colors.green
                          : (isUserAnswer ? Colors.red : Colors.grey.shade400),
                      width: isCorrectAnswer || isUserAnswer ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      if (icon != null) ...[
                        Icon(
                          icon,
                          color: isCorrectAnswer ? Colors.green : Colors.red,
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(child: Text(option)),
                      if (isUserAnswer && !isCorrectAnswer)
                        const Text(
                          'Bạn đã chọn',
                          style: TextStyle(
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                            color: Colors.red,
                          ),
                        ),
                      if (isCorrectAnswer)
                        const Text(
                          'Đáp án đúng',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                    ],
                  ),
                );
              }),
            ],

            // Essay Answer
            if (question.isEssay) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Câu trả lời của bạn:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      userAnswer?.toString() ?? 'Chưa trả lời',
                      style: TextStyle(
                        color: userAnswer != null ? Colors.black : Colors.grey,
                        fontStyle: userAnswer != null ? FontStyle.normal : FontStyle.italic,
                      ),
                    ),
                    if (!isGraded) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.access_time, size: 16, color: Colors.orange[700]),
                            const SizedBox(width: 8),
                            Text(
                              'Chờ giáo viên chấm điểm',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange[900],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],

            // Not Answered
            if (!isAnswered && !isEssay) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange),
                    SizedBox(width: 8),
                    Text(
                      'Bạn chưa trả lời câu này',
                      style: TextStyle(
                        fontStyle: FontStyle.italic,
                        color: Colors.orange,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
