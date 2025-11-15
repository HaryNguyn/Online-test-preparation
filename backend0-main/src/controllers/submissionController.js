const connection = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const submissionController = {
    createSubmission: async (req, res) => {
        try {
            const { exam_id, student_id, answers, score, total_marks, percentage, time_taken } = req.body;

            if (!exam_id || !student_id || !answers) {
                return res.status(400).json({ error: 'Required fields are missing' });
            }

            // Check if exam exists and get questions
            const [exams] = await connection.query('SELECT * FROM Exams WHERE id = ?', [exam_id]);
            if (exams.length === 0) {
                return res.status(404).json({ error: 'Exam not found' });
            }

            const [questions] = await connection.query('SELECT * FROM Questions WHERE exam_id = ? ORDER BY order_number', [exam_id]);

            // Check if student exists
            const [students] = await connection.query('SELECT * FROM Users WHERE id = ?', [student_id]);
            if (students.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }

            // Auto-grade objective questions and determine grading status
            let calculatedScore = 0;
            let gradingStatus = 'auto_graded';
            let hasEssayQuestions = false;

            questions.forEach((question, index) => {
                const studentAnswer = answers[index];
                
                // Skip if no answer provided (null or undefined)
                if (studentAnswer === null || studentAnswer === undefined) {
                    return;
                }

                let correctAnswer;
                try {
                    correctAnswer = typeof question.correct_answer === 'string' 
                        ? JSON.parse(question.correct_answer) 
                        : question.correct_answer;
                } catch (e) {
                    correctAnswer = question.correct_answer;
                }

                const questionMarks = question.marks || 10; // Default to 10 if marks is null

                if (question.question_type === 'essay') {
                    hasEssayQuestions = true;
                    gradingStatus = 'pending_manual';
                } else if (question.question_type === 'multiple_choice_single') {
                    if (typeof studentAnswer === 'number' && studentAnswer === correctAnswer) {
                        calculatedScore += questionMarks;
                    }
                } else if (question.question_type === 'multiple_choice_multiple') {
                    // For multiple choice, check if arrays match exactly
                    if (Array.isArray(studentAnswer) && Array.isArray(correctAnswer)) {
                        const sortedStudent = [...studentAnswer].map(Number).sort();
                        const sortedCorrect = [...correctAnswer].map(Number).sort();
                        if (JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)) {
                            calculatedScore += questionMarks;
                        }
                    }
                }
            });

            // If there are essay questions, grading status is pending, else auto-graded
            if (hasEssayQuestions) {
                gradingStatus = 'pending_manual';
            }

            // Use score from frontend if provided, otherwise use calculated score
            // Frontend already calculates score correctly based on marks
            const finalScore = score !== undefined && score !== null ? score : calculatedScore;
            const finalPercentage = percentage !== undefined && percentage !== null ? percentage : (total_marks > 0 ? (finalScore / total_marks) * 100 : 0);

            const submissionId = uuidv4();

            // Insert submission
            await connection.query(
                'INSERT INTO Submissions (id, exam_id, student_id, answers, score, total_marks, percentage, time_taken, grading_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [submissionId, exam_id, student_id, JSON.stringify(answers), finalScore, total_marks, finalPercentage, time_taken, gradingStatus]
            );

            // Insert into leaderboard only if fully graded
            if (gradingStatus === 'auto_graded') {
                const student = students[0];
                await connection.query(
                    'INSERT INTO Leaderboard (exam_id, student_id, student_name, score, total_marks, percentage, time_taken) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [exam_id, student_id, student.name, finalScore, total_marks, finalPercentage, time_taken]
                );
            }

            const [submission] = await connection.query('SELECT * FROM Submissions WHERE id = ?', [submissionId]);

            res.status(201).json({
                message: 'Submission created successfully',
                submission: submission[0]
            });
        } catch (error) {
            console.error('Create submission error:', error);
            res.status(500).json({ error: 'Failed to create submission' });
        }
    },
    
    getStudentSubmissions: async (req, res) => {
        try {
            const { studentId } = req.params;
            
            const [submissions] = await connection.query(
                `SELECT s.*, e.title as exam_title, e.subject, e.grade_level 
                FROM Submissions s 
                LEFT JOIN Exams e ON s.exam_id = e.id 
                WHERE s.student_id = ? 
                ORDER BY s.submitted_at DESC`,
                [studentId]
            );
            
            // Parse JSON fields
            submissions.forEach(s => {
                if (s.answers) {
                    try {
                        s.answers = JSON.parse(s.answers);
                    } catch (e) {
                        s.answers = {};
                    }
                }
            });
            
            res.json({ submissions });
        } catch (error) {
            console.error('Get student submissions error:', error);
            res.status(500).json({ error: 'Failed to fetch submissions' });
        }
    },
    
    getExamSubmissions: async (req, res) => {
        try {
            const { examId } = req.params;
            
            const [submissions] = await connection.query(
                `SELECT s.*, u.name as student_name, u.email as student_email 
                FROM Submissions s 
                LEFT JOIN Users u ON s.student_id = u.id 
                WHERE s.exam_id = ? 
                ORDER BY s.submitted_at DESC`,
                [examId]
            );
            
            // Parse JSON fields
            submissions.forEach(s => {
                if (s.answers) {
                    try {
                        s.answers = JSON.parse(s.answers);
                    } catch (e) {
                        s.answers = {};
                    }
                }
            });
            
            res.json({ submissions });
        } catch (error) {
            console.error('Get exam submissions error:', error);
            res.status(500).json({ error: 'Failed to fetch submissions' });
        }
    },
    
    getSubmissionById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [submissions] = await connection.query(
                `SELECT s.*, e.title as exam_title, u.name as student_name 
                FROM Submissions s 
                LEFT JOIN Exams e ON s.exam_id = e.id 
                LEFT JOIN Users u ON s.student_id = u.id 
                WHERE s.id = ?`,
                [id]
            );
            
            if (submissions.length === 0) {
                return res.status(404).json({ error: 'Submission not found' });
            }
            
            const submission = submissions[0];
            if (submission.answers) {
                try {
                    submission.answers = JSON.parse(submission.answers);
                } catch (e) {
                    submission.answers = {};
                }
            }
            
            res.json({ submission });
        } catch (error) {
            console.error('Get submission error:', error);
            res.status(500).json({ error: 'Failed to fetch submission' });
        }
    },

    // Get pending submissions (for teacher manual grading)
    getPendingSubmissions: async (req, res) => {
        try {
            const { examId } = req.query;
            
            let query = `SELECT s.*, e.title as exam_title, e.subject, u.name as student_name, u.email as student_email 
                FROM Submissions s 
                LEFT JOIN Exams e ON s.exam_id = e.id 
                LEFT JOIN Users u ON s.student_id = u.id 
                WHERE s.grading_status = 'pending_manual'`;
            
            const params = [];
            if (examId) {
                query += ' AND s.exam_id = ?';
                params.push(examId);
            }
            
            query += ' ORDER BY s.submitted_at DESC';
            
            const [submissions] = await connection.query(query, params);
            
            // Parse JSON fields
            submissions.forEach(s => {
                if (s.answers) {
                    try {
                        s.answers = JSON.parse(s.answers);
                    } catch (e) {
                        s.answers = {};
                    }
                }
            });
            
            res.json({ submissions });
        } catch (error) {
            console.error('Get pending submissions error:', error);
            res.status(500).json({ error: 'Failed to fetch pending submissions' });
        }
    },

    // Manual grading by teacher
    gradeSubmission: async (req, res) => {
        try {
            const { id } = req.params;
            const { essay_scores, graded_by } = req.body;

            if (!essay_scores || !graded_by) {
                return res.status(400).json({ error: 'Essay scores and grader ID are required' });
            }

            // Get submission and exam questions
            const [submissions] = await connection.query('SELECT * FROM Submissions WHERE id = ?', [id]);
            if (submissions.length === 0) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            const submission = submissions[0];
            const [questions] = await connection.query(
                'SELECT * FROM Questions WHERE exam_id = ? ORDER BY order_number',
                [submission.exam_id]
            );

            // Parse existing answers
            let answers;
            try {
                answers = typeof submission.answers === 'string' 
                    ? JSON.parse(submission.answers) 
                    : submission.answers;
            } catch (e) {
                answers = submission.answers;
            }

            // Recalculate total score: auto-graded + essay scores
            let totalScore = 0;

            questions.forEach((question, index) => {
                const questionMarks = question.marks || 10;
                const studentAnswer = answers[index];

                if (question.question_type === 'essay') {
                    // Add essay score from teacher grading
                    const essayScore = essay_scores[index] || 0;
                    totalScore += essayScore;
                } else {
                    // Re-calculate auto-graded questions
                    if (studentAnswer === null || studentAnswer === undefined) {
                        return;
                    }

                    let correctAnswer;
                    try {
                        correctAnswer = typeof question.correct_answer === 'string' 
                            ? JSON.parse(question.correct_answer) 
                            : question.correct_answer;
                    } catch (e) {
                        correctAnswer = question.correct_answer;
                    }

                    if (question.question_type === 'multiple_choice_single') {
                        if (typeof studentAnswer === 'number' && studentAnswer === correctAnswer) {
                            totalScore += questionMarks;
                        }
                    } else if (question.question_type === 'multiple_choice_multiple') {
                        if (Array.isArray(studentAnswer) && Array.isArray(correctAnswer)) {
                            const sortedStudent = [...studentAnswer].map(Number).sort();
                            const sortedCorrect = [...correctAnswer].map(Number).sort();
                            if (JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)) {
                                totalScore += questionMarks;
                            }
                        }
                    }
                }
            });

            const finalPercentage = submission.total_marks > 0 
                ? (totalScore / submission.total_marks) * 100 
                : 0;

            // Update submission with final score and grading status
            await connection.query(
                `UPDATE Submissions 
                SET score = ?, percentage = ?, grading_status = 'graded', 
                    graded_by = ?, graded_at = NOW(), partial_scores = ? 
                WHERE id = ?`,
                [totalScore, finalPercentage, graded_by, JSON.stringify(essay_scores), id]
            );

            // Update or insert into leaderboard
            const [student] = await connection.query('SELECT name FROM Users WHERE id = ?', [submission.student_id]);
            const studentName = student.length > 0 ? student[0].name : 'Unknown';

            const [existing] = await connection.query(
                'SELECT * FROM Leaderboard WHERE exam_id = ? AND student_id = ?',
                [submission.exam_id, submission.student_id]
            );

            if (existing.length > 0) {
                await connection.query(
                    `UPDATE Leaderboard 
                    SET score = ?, percentage = ?, total_marks = ?, time_taken = ? 
                    WHERE exam_id = ? AND student_id = ?`,
                    [totalScore, finalPercentage, submission.total_marks, submission.time_taken, 
                     submission.exam_id, submission.student_id]
                );
            } else {
                await connection.query(
                    `INSERT INTO Leaderboard (exam_id, student_id, student_name, score, total_marks, percentage, time_taken) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [submission.exam_id, submission.student_id, studentName, totalScore, 
                     submission.total_marks, finalPercentage, submission.time_taken]
                );
            }

            res.json({ 
                message: 'Submission graded successfully',
                score: totalScore,
                percentage: finalPercentage
            });
        } catch (error) {
            console.error('Grade submission error:', error);
            res.status(500).json({ error: 'Failed to grade submission' });
        }
    }
};

module.exports = submissionController;
