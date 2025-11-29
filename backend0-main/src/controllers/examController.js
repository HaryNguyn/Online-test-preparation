const connection = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const examController = {
    getAllExams: async (req, res) => {
        try {
            const { status, subject, grade_level, created_by } = req.query;
            
            let query = 'SELECT e.*, u.name as creator_name FROM Exams e LEFT JOIN Users u ON e.created_by = u.id WHERE 1=1';
            const params = [];
            
            if (status) {
                query += ' AND e.status = ?';
                params.push(status);
            }
            if (subject) {
                query += ' AND e.subject = ?';
                params.push(subject);
            }
            if (grade_level) {
                query += ' AND e.grade_level = ?';
                params.push(grade_level);
            }
            if (created_by) {
                query += ' AND e.created_by = ?';
                params.push(created_by);
            }
            
            query += ' ORDER BY e.created_at DESC';
            
            const [exams] = await connection.query(query, params);
            res.json({ exams });
        } catch (error) {
            console.error('Get exams error:', error);
            res.status(500).json({ error: 'Failed to fetch exams' });
        }
    },
    
    getExamById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [exams] = await connection.query(
                "SELECT e.*, COALESCE(u.name, 'Unknown User') as creator_name FROM Exams e LEFT JOIN Users u ON e.created_by = u.id WHERE e.id = ?",
                [id]
            );
            
            if (exams.length === 0) {
                return res.status(404).json({ error: 'Exam not found' });
            }
            
            const [questions] = await connection.query(
                'SELECT * FROM Questions WHERE exam_id = ? ORDER BY order_number',
                [id]
            );
            
            // Parse JSON fields
            questions.forEach(q => {
                    if (q.options !== null && q.options !== undefined) {
                        let parsedOptions = [];
                        // MySQL / driver may return JSON columns as strings or as already-parsed objects.
                        if (typeof q.options === 'string') {
                            try {
                                parsedOptions = JSON.parse(q.options);
                            } catch (e) {
                                parsedOptions = [];
                            }
                        } else if (Array.isArray(q.options)) {
                            parsedOptions = q.options;
                        } else if (q.options && typeof q.options === 'object') {
                            // JSON object (e.g., returned as object) -> take values
                            parsedOptions = Object.values(q.options);
                        }
                        // Ensure options are always an array of strings for consistency on the frontend.
                        q.options = Array.isArray(parsedOptions) ? parsedOptions.map(String) : [];
                    }
                    if (q.correct_answer !== null && q.correct_answer !== undefined) {
                        // correct_answer may be stored as JSON (string) or as native object/array depending on driver.
                        if (typeof q.correct_answer === 'string') {
                            try {
                                q.correct_answer = JSON.parse(q.correct_answer);
                            } catch (e) {
                                // Keep as-is
                            }
                        }
                        // otherwise keep the value returned (number/array/null)
                    }
            });
            
            const exam = { ...exams[0], questions };
            res.json({ exam });
        } catch (error) {
            console.error('Get exam error:', error);
            res.status(500).json({ error: 'Failed to fetch exam' });
        }
    },
    
    createExam: async (req, res) => {
        try {
            console.log('Received req.body:', JSON.stringify(req.body, null, 2));
            const { title, description, subject, grade_level, duration, total_marks, passing_marks, questions, created_by, status, shuffle_questions, shuffle_options } = req.body;

            console.log('Extracted fields:', { title, duration, created_by });

            if (!title || !duration || !created_by) {
                console.log('Validation failed: missing required fields');
                return res.status(400).json({ error: 'Required fields are missing' });
            }

            const examId = uuidv4();

            await connection.query(
                'INSERT INTO Exams (id, title, description, subject, grade_level, duration, total_marks, passing_marks, status, created_by, shuffle_questions, shuffle_options) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [examId, title, description, subject, grade_level, duration, total_marks || 0, passing_marks || 0, status || 'draft', created_by, shuffle_questions || false, shuffle_options || false]
            );

            // Insert questions
            if (questions && questions.length > 0) {
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    const questionId = uuidv4();
                    let correctAnswerJson;

                    // Handle different question types
                    if (q.question_type === 'multiple_choice_single') {
                        correctAnswerJson = JSON.stringify(q.correct_answer || 0);
                    } else if (q.question_type === 'multiple_choice_multiple') {
                        correctAnswerJson = JSON.stringify(q.correct_answer || []);
                    } else if (q.question_type === 'essay') {
                        correctAnswerJson = JSON.stringify(null); // Essays don't have predefined correct answers
                    } else {
                        // Default to single choice
                        correctAnswerJson = JSON.stringify(q.correct_answer || 0);
                    }

                    await connection.query(
                        'INSERT INTO Questions (id, exam_id, question_text, question_type, options, correct_answer, marks, order_number, image_url, audio_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [questionId, examId, q.question_text, q.question_type || 'multiple_choice_single', JSON.stringify(q.options || []), correctAnswerJson, q.marks || 10, i, q.image_url || null, q.audio_url || null]
                    );
                }
            }

            const [exam] = await connection.query('SELECT * FROM Exams WHERE id = ?', [examId]);
            res.status(201).json({
                message: 'Exam created successfully',
                exam: exam[0]
            });
        } catch (error) {
            console.error('Create exam error:', error);
            res.status(500).json({ error: 'Failed to create exam' });
        }
    },
    
    updateExam: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            // Check if exam exists
            const [existing] = await connection.query('SELECT * FROM Exams WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Exam not found' });
            }
            
            // Remove questions from updates if present (handle separately)
            const { questions, ...examUpdates } = updates;
            
            if (Object.keys(examUpdates).length > 0) {
                const setClause = Object.keys(examUpdates).map(key => `${key} = ?`).join(', ');
                const values = [...Object.values(examUpdates), id];
                
                await connection.query(
                    `UPDATE Exams SET ${setClause} WHERE id = ?`,
                    values
                );
            }
            
            // Handle questions update if provided
            if (questions) {
                // Delete old questions
                await connection.query('DELETE FROM Questions WHERE exam_id = ?', [id]);

                // Insert new questions
                if (questions.length > 0) {
                    for (let i = 0; i < questions.length; i++) {
                        const q = questions[i];
                        // If the ID is a temporary one from the frontend, generate a new UUID.
                        const isTempId = typeof q.id === 'string' && q.id.startsWith('temp-');
                        const questionId = !q.id || isTempId ? uuidv4() : q.id;
                        let correctAnswerJson;

                        // Handle different question types
                        if (q.question_type === 'multiple_choice_single') {
                            correctAnswerJson = JSON.stringify(q.correct_answer || 0);
                        } else if (q.question_type === 'multiple_choice_multiple') {
                            correctAnswerJson = JSON.stringify(q.correct_answer || []);
                        } else if (q.question_type === 'essay') {
                            correctAnswerJson = JSON.stringify(null); // Essays don't have predefined correct answers
                        } else {
                            // Default to single choice
                            correctAnswerJson = JSON.stringify(q.correct_answer || 0);
                        }

                        await connection.query(
                            'INSERT INTO Questions (id, exam_id, question_text, question_type, options, correct_answer, marks, order_number, image_url, audio_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [questionId, id, q.question_text, q.question_type || 'multiple_choice_single', JSON.stringify(q.options || []), correctAnswerJson, q.marks || 10, i, q.image_url || null, q.audio_url || null]
                        );
                    }
                }
            }
            
            res.json({ message: 'Exam updated successfully' });
        } catch (error) {
            console.error('Update exam error:', error);
            res.status(500).json({ error: 'Failed to update exam' });
        }
    },
    
    deleteExam: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [existing] = await connection.query('SELECT * FROM Exams WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Exam not found' });
            }
            
            await connection.query('DELETE FROM Exams WHERE id = ?', [id]);
            res.json({ message: 'Exam deleted successfully' });
        } catch (error) {
            console.error('Delete exam error:', error);
            res.status(500).json({ error: 'Failed to delete exam' });
        }
    }
};

module.exports = examController;
