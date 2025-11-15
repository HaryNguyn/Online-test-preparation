const connection = require('../config/database');

const leaderboardController = {
    getExamLeaderboard: async (req, res) => {
        try {
            const { examId } = req.params;
            const { limit = 10 } = req.query;
            
            const [leaderboard] = await connection.query(
                `SELECT 
                    l.*, 
                    u.email as student_email,
                    e.title as exam_title
                FROM Leaderboard l 
                LEFT JOIN Users u ON l.student_id = u.id 
                LEFT JOIN Exams e ON l.exam_id = e.id 
                WHERE l.exam_id = ? 
                ORDER BY l.score DESC, l.time_taken ASC 
                LIMIT ?`,
                [examId, parseInt(limit)]
            );
            
            res.json({ leaderboard });
        } catch (error) {
            console.error('Get exam leaderboard error:', error);
            res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }
    },
    
    getGlobalLeaderboard: async (req, res) => {
        try {
            const { limit = 10, subject, grade_level } = req.query;
            
            let query = `
                SELECT 
                    u.id as student_id,
                    u.name as student_name,
                    u.email as student_email,
                    COUNT(DISTINCT l.exam_id) as exams_taken,
                    AVG(l.percentage) as average_percentage,
                    SUM(l.score) as total_score,
                    MAX(l.score) as highest_score
                FROM Users u
                INNER JOIN Leaderboard l ON u.id = l.student_id
                INNER JOIN Exams e ON l.exam_id = e.id
                WHERE u.role = 'student'
            `;
            
            const params = [];
            
            if (subject) {
                query += ' AND e.subject = ?';
                params.push(subject);
            }
            if (grade_level) {
                query += ' AND e.grade_level = ?';
                params.push(grade_level);
            }
            
            query += `
                GROUP BY u.id, u.name, u.email
                ORDER BY average_percentage DESC, total_score DESC
                LIMIT ?
            `;
            
            params.push(parseInt(limit));
            
            const [leaderboard] = await connection.query(query, params);
            
            res.json({ leaderboard });
        } catch (error) {
            console.error('Get global leaderboard error:', error);
            res.status(500).json({ error: 'Failed to fetch global leaderboard' });
        }
    },
    
    getStudentRank: async (req, res) => {
        try {
            const { studentId } = req.params;
            const { examId } = req.query;
            
            if (examId) {
                // Get rank for specific exam
                const [result] = await connection.query(
                    `SELECT 
                        (SELECT COUNT(*) + 1 
                         FROM Leaderboard 
                         WHERE exam_id = ? 
                         AND (score > l.score OR (score = l.score AND time_taken < l.time_taken))
                        ) as rank,
                        l.*
                    FROM Leaderboard l
                    WHERE l.exam_id = ? AND l.student_id = ?`,
                    [examId, examId, studentId]
                );
                
                if (result.length === 0) {
                    return res.status(404).json({ error: 'Rank not found' });
                }
                
                res.json({ rank: result[0] });
            } else {
                // Get overall rank
                const [result] = await connection.query(
                    `SELECT 
                        u.id as student_id,
                        u.name as student_name,
                        AVG(l.percentage) as average_percentage,
                        (SELECT COUNT(DISTINCT u2.id) + 1
                         FROM Users u2
                         INNER JOIN Leaderboard l2 ON u2.id = l2.student_id
                         WHERE u2.role = 'student'
                         GROUP BY u2.id
                         HAVING AVG(l2.percentage) > AVG(l.percentage)
                        ) as overall_rank
                    FROM Users u
                    INNER JOIN Leaderboard l ON u.id = l.student_id
                    WHERE u.id = ?
                    GROUP BY u.id, u.name`,
                    [studentId]
                );
                
                if (result.length === 0) {
                    return res.status(404).json({ error: 'Rank not found' });
                }
                
                res.json({ rank: result[0] });
            }
        } catch (error) {
            console.error('Get student rank error:', error);
            res.status(500).json({ error: 'Failed to fetch rank' });
        }
    }
};

module.exports = leaderboardController;
