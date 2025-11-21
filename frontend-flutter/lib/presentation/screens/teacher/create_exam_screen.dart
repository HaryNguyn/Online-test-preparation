import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/repositories/exam_repository.dart';
import '../../../data/models/question_model.dart';

class CreateExamScreen extends StatefulWidget {
  const CreateExamScreen({super.key});

  @override
  State<CreateExamScreen> createState() => _CreateExamScreenState();
}

class _CreateExamScreenState extends State<CreateExamScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _durationController = TextEditingController();
  final _totalMarksController = TextEditingController();
  final _passingMarksController = TextEditingController();

  String _selectedGrade = 'Lớp 10';
  String _selectedSubject = 'Toán';
  String _selectedStatus = 'draft';

  final List<QuestionModel> _questions = [];
  bool _isSubmitting = false;

  final List<String> _grades = ['Lớp 10', 'Lớp 11', 'Lớp 12'];
  final List<String> _subjects = ['Toán', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Anh', 'Sử', 'Địa'];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _durationController.dispose();
    _totalMarksController.dispose();
    _passingMarksController.dispose();
    super.dispose();
  }

  Future<void> _submitExam() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_questions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng thêm ít nhất 1 câu hỏi')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final examRepository = context.read<ExamRepository>();
      
      await examRepository.createExam({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'subject': _selectedSubject,
        'grade_level': _selectedGrade,
        'duration': int.parse(_durationController.text),
        'total_marks': int.parse(_totalMarksController.text),
        'passing_marks': int.parse(_passingMarksController.text),
        'status': _selectedStatus,
        'questions': _questions.map((q) => q.toJson()).toList(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tạo bài thi thành công!')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _addQuestion() {
    showDialog(
      context: context,
      builder: (context) => _QuestionDialog(
        onSave: (question) {
          setState(() => _questions.add(question));
        },
      ),
    );
  }

  void _editQuestion(int index) {
    showDialog(
      context: context,
      builder: (context) => _QuestionDialog(
        question: _questions[index],
        onSave: (question) {
          setState(() => _questions[index] = question);
        },
      ),
    );
  }

  void _deleteQuestion(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: const Text('Bạn có chắc muốn xóa câu hỏi này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              setState(() => _questions.removeAt(index));
              Navigator.pop(context);
            },
            child: const Text('Xóa', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tạo bài thi mới'),
        actions: [
          if (_isSubmitting)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.check),
              onPressed: _submitExam,
              tooltip: 'Lưu bài thi',
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Exam Info Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Thông tin bài thi',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Tên bài thi *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.title),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Vui lòng nhập tên bài thi';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descriptionController,
                      decoration: const InputDecoration(
                        labelText: 'Mô tả',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.description),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedGrade,
                            decoration: const InputDecoration(
                              labelText: 'Lớp *',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.school),
                            ),
                            items: _grades.map((grade) {
                              return DropdownMenuItem(
                                value: grade,
                                child: Text(grade),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() => _selectedGrade = value!);
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedSubject,
                            decoration: const InputDecoration(
                              labelText: 'Môn học *',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.book),
                            ),
                            items: _subjects.map((subject) {
                              return DropdownMenuItem(
                                value: subject,
                                child: Text(subject),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() => _selectedSubject = value!);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _durationController,
                            decoration: const InputDecoration(
                              labelText: 'Thời gian (phút) *',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.timer),
                            ),
                            keyboardType: TextInputType.number,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Vui lòng nhập thời gian';
                              }
                              final duration = int.tryParse(value);
                              if (duration == null || duration <= 0) {
                                return 'Thời gian phải > 0';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _totalMarksController,
                            decoration: const InputDecoration(
                              labelText: 'Tổng điểm *',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.star),
                            ),
                            keyboardType: TextInputType.number,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Vui lòng nhập tổng điểm';
                              }
                              final marks = int.tryParse(value);
                              if (marks == null || marks <= 0) {
                                return 'Điểm phải > 0';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _passingMarksController,
                            decoration: const InputDecoration(
                              labelText: 'Điểm đạt *',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.check_circle),
                            ),
                            keyboardType: TextInputType.number,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Vui lòng nhập điểm đạt';
                              }
                              final passing = int.tryParse(value);
                              final total = int.tryParse(_totalMarksController.text);
                              if (passing == null || passing <= 0) {
                                return 'Điểm đạt phải > 0';
                              }
                              if (total != null && passing > total) {
                                return 'Điểm đạt không được > tổng điểm';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedStatus,
                            decoration: const InputDecoration(
                              labelText: 'Trạng thái *',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.publish),
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: 'draft',
                                child: Text('Nháp'),
                              ),
                              DropdownMenuItem(
                                value: 'published',
                                child: Text('Xuất bản'),
                              ),
                            ],
                            onChanged: (value) {
                              setState(() => _selectedStatus = value!);
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Questions Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Câu hỏi (${_questions.length})',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: _addQuestion,
                          icon: const Icon(Icons.add),
                          label: const Text('Thêm câu hỏi'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (_questions.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            children: [
                              Icon(
                                Icons.quiz_outlined,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Chưa có câu hỏi nào',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _questions.length,
                        itemBuilder: (context, index) {
                          final question = _questions[index];
                          return _QuestionCard(
                            question: question,
                            index: index,
                            onEdit: () => _editQuestion(index),
                            onDelete: () => _deleteQuestion(index),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuestionCard extends StatelessWidget {
  final QuestionModel question;
  final int index;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _QuestionCard({
    required this.question,
    required this.index,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          child: Text('${index + 1}'),
        ),
        title: Text(
          question.questionText,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          '${_getTypeLabel(question.type)} • ${question.marks} điểm',
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              onPressed: onEdit,
              tooltip: 'Sửa',
            ),
            IconButton(
              icon: const Icon(Icons.delete, size: 20, color: Colors.red),
              onPressed: onDelete,
              tooltip: 'Xóa',
            ),
          ],
        ),
      ),
    );
  }

  String _getTypeLabel(String type) {
    switch (type) {
      case 'multiple_choice':
        return 'Trắc nghiệm';
      case 'true_false':
        return 'Đúng/Sai';
      case 'essay':
        return 'Tự luận';
      default:
        return type;
    }
  }
}

class _QuestionDialog extends StatefulWidget {
  final QuestionModel? question;
  final Function(QuestionModel) onSave;

  const _QuestionDialog({
    this.question,
    required this.onSave,
  });

  @override
  State<_QuestionDialog> createState() => _QuestionDialogState();
}

class _QuestionDialogState extends State<_QuestionDialog> {
  final _formKey = GlobalKey<FormState>();
  final _questionController = TextEditingController();
  final _marksController = TextEditingController();
  
  String _selectedType = 'multiple_choice';
  final List<TextEditingController> _optionControllers = [];
  String? _correctAnswer;

  @override
  void initState() {
    super.initState();
    
    if (widget.question != null) {
      _questionController.text = widget.question!.questionText;
      _marksController.text = widget.question!.marks.toString();
      _selectedType = widget.question!.type;
      _correctAnswer = widget.question!.correctAnswer;
      
      if (widget.question!.options != null) {
        for (var option in widget.question!.options!) {
          final controller = TextEditingController(text: option);
          _optionControllers.add(controller);
        }
      }
    } else {
      // Default 4 options for new question
      for (int i = 0; i < 4; i++) {
        _optionControllers.add(TextEditingController());
      }
    }
  }

  @override
  void dispose() {
    _questionController.dispose();
    _marksController.dispose();
    for (var controller in _optionControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    List<String>? options;
    if (_selectedType == 'multiple_choice') {
      options = _optionControllers
          .map((c) => c.text.trim())
          .where((t) => t.isNotEmpty)
          .toList();
      
      if (options.length < 2) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng nhập ít nhất 2 đáp án')),
        );
        return;
      }
      
      if (_correctAnswer == null || _correctAnswer!.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng chọn đáp án đúng')),
        );
        return;
      }
    } else if (_selectedType == 'true_false') {
      options = ['Đúng', 'Sai'];
      if (_correctAnswer == null || _correctAnswer!.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng chọn đáp án đúng')),
        );
        return;
      }
    }

    final question = QuestionModel(
      id: widget.question?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
      examId: widget.question?.examId ?? '',
      questionText: _questionController.text.trim(),
      type: _selectedType,
      marks: int.parse(_marksController.text),
      options: options,
      correctAnswer: _correctAnswer,
      orderIndex: widget.question?.orderIndex ?? 0,
    );

    widget.onSave(question);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600),
        child: Form(
          key: _formKey,
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.all(24),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.question == null ? 'Thêm câu hỏi' : 'Sửa câu hỏi',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _questionController,
                decoration: const InputDecoration(
                  labelText: 'Câu hỏi *',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Vui lòng nhập câu hỏi';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedType,
                      decoration: const InputDecoration(
                        labelText: 'Loại câu hỏi *',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'multiple_choice',
                          child: Text('Trắc nghiệm'),
                        ),
                        DropdownMenuItem(
                          value: 'true_false',
                          child: Text('Đúng/Sai'),
                        ),
                        DropdownMenuItem(
                          value: 'essay',
                          child: Text('Tự luận'),
                        ),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedType = value!;
                          _correctAnswer = null;
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _marksController,
                      decoration: const InputDecoration(
                        labelText: 'Điểm *',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Vui lòng nhập điểm';
                        }
                        final marks = int.tryParse(value);
                        if (marks == null || marks <= 0) {
                          return 'Điểm phải > 0';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              if (_selectedType == 'multiple_choice') ...[
                const Text(
                  'Đáp án',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                ...List.generate(_optionControllers.length, (index) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Radio<String>(
                          value: _optionControllers[index].text,
                          groupValue: _correctAnswer,
                          onChanged: (value) {
                            setState(() {
                              _correctAnswer = _optionControllers[index].text;
                            });
                          },
                        ),
                        Expanded(
                          child: TextFormField(
                            controller: _optionControllers[index],
                            decoration: InputDecoration(
                              labelText: 'Đáp án ${String.fromCharCode(65 + index)}',
                              border: const OutlineInputBorder(),
                            ),
                            onChanged: (value) {
                              if (_correctAnswer == _optionControllers[index].text) {
                                setState(() {
                                  _correctAnswer = value;
                                });
                              }
                            },
                          ),
                        ),
                        if (_optionControllers.length > 2)
                          IconButton(
                            icon: const Icon(Icons.delete, size: 20),
                            onPressed: () {
                              setState(() {
                                _optionControllers[index].dispose();
                                _optionControllers.removeAt(index);
                              });
                            },
                          ),
                      ],
                    ),
                  );
                }),
                TextButton.icon(
                  onPressed: () {
                    setState(() {
                      _optionControllers.add(TextEditingController());
                    });
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('Thêm đáp án'),
                ),
              ] else if (_selectedType == 'true_false') ...[
                const Text(
                  'Đáp án đúng',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                RadioListTile<String>(
                  title: const Text('Đúng'),
                  value: 'Đúng',
                  groupValue: _correctAnswer,
                  onChanged: (value) {
                    setState(() => _correctAnswer = value);
                  },
                ),
                RadioListTile<String>(
                  title: const Text('Sai'),
                  value: 'Sai',
                  groupValue: _correctAnswer,
                  onChanged: (value) {
                    setState(() => _correctAnswer = value);
                  },
                ),
              ] else if (_selectedType == 'essay') ...[
                Card(
                  color: Colors.blue.shade50,
                  child: const Padding(
                    padding: EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Câu tự luận sẽ được chấm thủ công bởi giáo viên',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Hủy'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _save,
                    child: const Text('Lưu'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
