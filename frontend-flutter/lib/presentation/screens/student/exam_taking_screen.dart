import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/models/exam_model.dart';
import '../../../data/models/question_model.dart';
import '../../../data/repositories/exam_repository.dart';
import '../../../data/repositories/submission_repository.dart';
import '../../../core/utils/storage_helper.dart';

class ExamTakingScreen extends StatefulWidget {
  final String examId;

  const ExamTakingScreen({
    super.key,
    required this.examId,
  });

  @override
  State<ExamTakingScreen> createState() => _ExamTakingScreenState();
}

class _ExamTakingScreenState extends State<ExamTakingScreen> {
  late final ExamRepository _examRepository;
  late final SubmissionRepository _submissionRepository;

  ExamModel? _exam;
  List<QuestionModel> _questions = [];
  Map<String, dynamic> _answers = {}; // questionId: answer
  bool _isLoading = true;
  int _currentQuestionIndex = 0;
  
  Timer? _timer;
  int _remainingSeconds = 0;

  @override
  void initState() {
    super.initState();
    _examRepository = context.read<ExamRepository>();
    _submissionRepository = context.read<SubmissionRepository>();
    _loadExamData();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadExamData() async {
    setState(() => _isLoading = true);
    try {
      final exam = await _examRepository.getExamById(widget.examId);
      final questions = await _examRepository.getExamQuestions(widget.examId);

      setState(() {
        _exam = exam;
        _questions = questions;
        _remainingSeconds = exam.duration * 60; // Convert minutes to seconds
        _isLoading = false;
      });

      _startTimer();
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải bài thi: $e')),
        );
        Navigator.pop(context);
      }
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_remainingSeconds > 0) {
          _remainingSeconds--;
        } else {
          _timer?.cancel();
          _autoSubmit();
        }
      });
    });
  }

  String _formatTime(int seconds) {
    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;
    final secs = seconds % 60;
    
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  Color _getTimerColor() {
    final percentage = _remainingSeconds / (_exam!.duration * 60);
    if (percentage > 0.5) return Colors.green;
    if (percentage > 0.25) return Colors.orange;
    return Colors.red;
  }

  void _previousQuestion() {
    if (_currentQuestionIndex > 0) {
      setState(() => _currentQuestionIndex--);
    }
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() => _currentQuestionIndex++);
    }
  }

  void _saveAnswer(String questionId, dynamic answer) {
    setState(() {
      _answers[questionId] = answer;
    });
  }

  int _getAnsweredCount() {
    return _answers.length;
  }

  Future<void> _autoSubmit() async {
    await _submitExam(autoSubmit: true);
  }

  Future<void> _submitExam({bool autoSubmit = false}) async {
    // Confirm submission
    if (!autoSubmit) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Xác nhận nộp bài'),
          content: Text(
            'Bạn đã trả lời ${_getAnsweredCount()}/${_questions.length} câu.\n'
            'Bạn có chắc muốn nộp bài không?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Nộp bài'),
            ),
          ],
        ),
      );

      if (confirm != true) return;
    }

    // Show loading
    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    try {
      final storage = StorageHelper();
      final user = storage.getUser();
      
      // Submit to backend
      final answersList = _questions.map((q) {
        return {
          'question_id': q.id,
          'answer': _answers[q.id],
        };
      }).toList();
      
      await _submissionRepository.submitExam(
        examId: widget.examId,
        userId: user?['id'] ?? '',
        answers: answersList,
      );

      if (mounted) {
        Navigator.pop(context); // Close loading
        
        // Show success dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Text('Nộp bài thành công!'),
            content: const Text(
              'Bài thi của bạn đã được nộp.\n'
              'Kết quả sẽ được công bố sau khi giáo viên chấm bài.',
            ),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  Navigator.pop(context); // Go back to list
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi nộp bài: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading || _exam == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final question = _questions[_currentQuestionIndex];

    return WillPopScope(
      onWillPop: () async {
        final confirm = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Thoát bài thi?'),
            content: const Text(
              'Nếu thoát, bài làm của bạn sẽ không được lưu.\n'
              'Bạn có chắc muốn thoát không?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Ở lại'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                ),
                child: const Text('Thoát'),
              ),
            ],
          ),
        );
        return confirm ?? false;
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(_exam!.title),
          actions: [
            // Timer
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: _getTimerColor().withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _getTimerColor(), width: 2),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.timer,
                    color: _getTimerColor(),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _formatTime(_remainingSeconds),
                    style: TextStyle(
                      color: _getTimerColor(),
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            // Progress bar
            LinearProgressIndicator(
              value: (_currentQuestionIndex + 1) / _questions.length,
              backgroundColor: Colors.grey[200],
              minHeight: 4,
            ),

            // Question counter
            Container(
              padding: const EdgeInsets.all(16),
              color: Theme.of(context).colorScheme.surface,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Câu ${_currentQuestionIndex + 1}/${_questions.length}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Đã trả lời: ${_getAnsweredCount()}/${_questions.length}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),

            // Question content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: _buildQuestionWidget(question),
              ),
            ),

            // Navigation buttons
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Previous button
                  OutlinedButton.icon(
                    onPressed: _currentQuestionIndex > 0 ? _previousQuestion : null,
                    icon: const Icon(Icons.arrow_back),
                    label: const Text('Trước'),
                  ),
                  const SizedBox(width: 16),

                  // Question grid button
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _showQuestionGrid(),
                      icon: const Icon(Icons.grid_view),
                      label: const Text('Tất cả câu hỏi'),
                    ),
                  ),
                  const SizedBox(width: 16),

                  // Next or Submit button
                  if (_currentQuestionIndex < _questions.length - 1)
                    ElevatedButton.icon(
                      onPressed: _nextQuestion,
                      icon: const Icon(Icons.arrow_forward),
                      label: const Text('Sau'),
                    )
                  else
                    ElevatedButton.icon(
                      onPressed: () => _submitExam(),
                      icon: const Icon(Icons.check),
                      label: const Text('Nộp bài'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionWidget(QuestionModel question) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Question text
        Text(
          question.questionText,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),

        // Marks
        Text(
          '${question.marks} điểm',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 24),

        // Answer options based on type
        if (question.type == 'multiple_choice')
          _buildMultipleChoiceOptions(question)
        else if (question.type == 'true_false')
          _buildTrueFalseOptions(question)
        else if (question.type == 'essay')
          _buildEssayInput(question),
      ],
    );
  }

  Widget _buildMultipleChoiceOptions(QuestionModel question) {
    final currentAnswer = _answers[question.id];
    final options = question.options ?? [];

    return Column(
      children: options.asMap().entries.map((entry) {
        final index = entry.key;
        final option = entry.value;
        final optionLetter = String.fromCharCode(65 + index); // A, B, C, D

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: RadioListTile<String>(
            title: Text('$optionLetter. $option'),
            value: option,
            groupValue: currentAnswer,
            onChanged: (value) {
              _saveAnswer(question.id, value);
            },
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTrueFalseOptions(QuestionModel question) {
    final currentAnswer = _answers[question.id];

    return Column(
      children: [
        Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: RadioListTile<bool>(
            title: const Text('Đúng'),
            value: true,
            groupValue: currentAnswer,
            onChanged: (value) {
              _saveAnswer(question.id, value);
            },
          ),
        ),
        Card(
          child: RadioListTile<bool>(
            title: const Text('Sai'),
            value: false,
            groupValue: currentAnswer,
            onChanged: (value) {
              _saveAnswer(question.id, value);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildEssayInput(QuestionModel question) {
    final controller = TextEditingController(
      text: _answers[question.id]?.toString() ?? '',
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: controller,
          maxLines: 10,
          decoration: const InputDecoration(
            hintText: 'Nhập câu trả lời của bạn...',
            border: OutlineInputBorder(),
          ),
          onChanged: (value) {
            _saveAnswer(question.id, value);
          },
        ),
        const SizedBox(height: 8),
        Text(
          'Tối thiểu 50 ký tự',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  void _showQuestionGrid() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Tất cả câu hỏi',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(_questions.length, (index) {
                final isAnswered = _answers.containsKey(_questions[index].id);
                final isCurrent = index == _currentQuestionIndex;

                return InkWell(
                  onTap: () {
                    setState(() => _currentQuestionIndex = index);
                    Navigator.pop(context);
                  },
                  child: Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? Theme.of(context).primaryColor
                          : isAnswered
                              ? Colors.green
                              : Colors.grey[300],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${index + 1}',
                      style: TextStyle(
                        color: (isCurrent || isAnswered)
                            ? Colors.white
                            : Colors.black,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _buildLegendItem(Colors.grey[300]!, 'Chưa trả lời'),
                const SizedBox(width: 16),
                _buildLegendItem(Colors.green, 'Đã trả lời'),
                const SizedBox(width: 16),
                _buildLegendItem(
                  Theme.of(context).primaryColor,
                  'Đang làm',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }
}
