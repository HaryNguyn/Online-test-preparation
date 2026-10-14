-- Select database
 USE harringuyn;

-- Drop existing tables to avoid FK conflicts
DROP TABLE IF EXISTS Leaderboard;
DROP TABLE IF EXISTS Submissions;
DROP TABLE IF EXISTS Questions;
DROP TABLE IF EXISTS Exams;
DROP TABLE IF EXISTS UserMapping;
DROP TABLE IF EXISTS Users;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin', 'parent') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create UserMapping table to link mock frontend IDs with backend UUIDs
CREATE TABLE IF NOT EXISTS UserMapping (
    mock_id VARCHAR(10) NOT NULL COMMENT 'Mock user ID from frontend (e.g., "0", "1", "2")',
    backend_id VARCHAR(36) NOT NULL COMMENT 'Real backend user UUID',
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (mock_id),
    UNIQUE KEY uniq_backend_id (backend_id),
    UNIQUE KEY uniq_email (email),
    KEY idx_mapping_backend (backend_id),
    CONSTRAINT fk_mapping_user FOREIGN KEY (backend_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Exams table
CREATE TABLE IF NOT EXISTS Exams (
    id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    duration INT NOT NULL COMMENT 'Duration in minutes',
    total_marks INT NOT NULL,
    passing_marks INT NOT NULL,
    status ENUM('draft', 'pending', 'published', 'archived', 'rejected') DEFAULT 'draft',
    shuffle_questions BOOLEAN DEFAULT FALSE COMMENT 'Whether to shuffle question order for students',
    shuffle_options BOOLEAN DEFAULT FALSE COMMENT 'Whether to shuffle option order for each question',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_exams_creator (created_by),
    CONSTRAINT fk_exams_user FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Questions table
CREATE TABLE IF NOT EXISTS Questions (
    id VARCHAR(36) NOT NULL,
    exam_id VARCHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice_single', 'multiple_choice_multiple', 'essay') NOT NULL,
    options JSON NULL COMMENT 'Array of options for multiple choice questions',
    correct_answer JSON NOT NULL COMMENT 'Single index for single choice, array of indices for multiple choice, null for essay',
    marks INT NOT NULL,
    order_number INT NOT NULL,
    image_url VARCHAR(255) NULL,
    audio_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_questions_exam (exam_id),
    CONSTRAINT fk_questions_exam FOREIGN KEY (exam_id) REFERENCES Exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Submissions table
CREATE TABLE IF NOT EXISTS Submissions (
    id VARCHAR(36) NOT NULL,
    exam_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    answers JSON NOT NULL COMMENT 'Array of answers: indices for multiple choice, text for essays',
    score DECIMAL(5,2) NOT NULL COMMENT 'Calculated score, can be partial for essays',
    total_marks INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    time_taken INT NULL COMMENT 'Time taken in seconds',
    graded_by VARCHAR(36) NULL COMMENT 'Teacher who graded essay questions',
    graded_at TIMESTAMP NULL,
    partial_scores JSON NULL COMMENT 'Essay scores per question index',
    grading_status ENUM('auto_graded', 'pending_manual', 'manually_graded') DEFAULT 'auto_graded',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_submissions_exam (exam_id),
    KEY idx_submissions_student (student_id),
    KEY idx_submissions_grading (grading_status),
    CONSTRAINT fk_submissions_exam FOREIGN KEY (exam_id) REFERENCES Exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_user FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_grader FOREIGN KEY (graded_by) REFERENCES Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Leaderboard table
CREATE TABLE IF NOT EXISTS Leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    total_marks INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    time_taken INT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_leaderboard_exam (exam_id),
    KEY idx_leaderboard_student (student_id),
    CONSTRAINT fk_leaderboard_exam FOREIGN KEY (exam_id) REFERENCES Exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_leaderboard_user FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE Submissions 
ADD COLUMN partial_scores JSON NULL COMMENT 'Essay scores per question index' AFTER graded_at;

UPDATE Questions SET marks = 10 WHERE marks < 10;



--- 
USE harringuyn;

-- Tạo test mới về Toán
SET @exam_id = UUID();
SET @teacher_id = (SELECT id FROM Users WHERE role = 'teacher' LIMIT 1);

INSERT INTO Exams (id, title, description, subject, grade_level, duration, total_marks, passing_marks, status, created_by)
VALUES (@exam_id, 'Toán - Phép tính cơ bản', 'Kiểm tra 15 phút - Toán lớp 5', 'Toán', '5', 15, 30, 18, 'published', @teacher_id);

-- Câu 1: 5 + 3 = ?
INSERT INTO Questions (id, exam_id, question_text, question_type, options, correct_answer, marks, order_number)
VALUES (UUID(), @exam_id, '5 + 3 = ?', 'multiple_choice_single', 
        JSON_ARRAY('6', '7', '8', '9'), 
        JSON_QUOTE('2'), 10, 0);

-- Câu 2: 12 - 7 = ?
INSERT INTO Questions (id, exam_id, question_text, question_type, options, correct_answer, marks, order_number)
VALUES (UUID(), @exam_id, '12 - 7 = ?', 'multiple_choice_single', 
        JSON_ARRAY('3', '4', '5', '6'), 
        JSON_QUOTE('2'), 10, 1);

-- Câu 3: 4 × 5 = ?
INSERT INTO Questions (id, exam_id, question_text, question_type, options, correct_answer, marks, order_number)
VALUES (UUID(), @exam_id, '4 × 5 = ?', 'multiple_choice_single', 
        JSON_ARRAY('15', '18', '20', '25'), 
        JSON_QUOTE('2'), 10, 2);

-- Kiểm tra kết quả
SELECT 'Test created successfully!' as status;
SELECT e.title, e.total_marks, COUNT(q.id) as question_count 
FROM Exams e 
LEFT JOIN Questions q ON e.id = q.exam_id 
WHERE e.id = @exam_id
GROUP BY e.id, e.title, e.total_marks;

USE harringuyn;

-- Add avatar_url column if it doesn't exist
ALTER TABLE harringuyn.Users
ADD COLUMN avatar_url VARCHAR(500) NULL
COMMENT 'URL to user profile picture' 
AFTER role;

USE harringuyn;

-- Add grade column if not exists
ALTER TABLE Users 
ADD COLUMN grade VARCHAR(20) NULL COMMENT 'Student grade level (e.g., "10", "11", "12")' AFTER role;

-- Update existing students with default grade
UPDATE Users SET grade = '10' WHERE role = 'student' AND (grade IS NULL OR grade = '');

-- Verify the changes
SELECT 'Migration completed - grade column added' as status;
SELECT id, email, name, role, grade FROM Users LIMIT 5;

-- Select database
USE harringuyn;

-- Drop existing tables to avoid FK conflicts
DROP TABLE IF EXISTS Videos;

-- Create Videos table for YouTube learning videos
CREATE TABLE IF NOT EXISTS Videos (
    id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    youtube_url VARCHAR(500) NOT NULL,
    youtube_id VARCHAR(20) NOT NULL COMMENT 'YouTube video ID extracted from URL',
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    duration INT NULL COMMENT 'Video duration in seconds',
    thumbnail_url VARCHAR(500) NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_videos_subject (subject),
    KEY idx_videos_grade (grade_level),
    KEY idx_videos_creator (created_by),
    CONSTRAINT fk_videos_user FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE harringuyn;

-- Add shuffle_questions column
-- If you get "Duplicate column name" error, the column already exists - that's fine!
ALTER TABLE Exams 
ADD COLUMN shuffle_questions BOOLEAN DEFAULT FALSE 
COMMENT 'Whether to shuffle question order for students' 
AFTER status;

-- Add shuffle_options column  
-- If you get "Duplicate column name" error, the column already exists - that's fine!
ALTER TABLE Exams 
ADD COLUMN shuffle_options BOOLEAN DEFAULT FALSE 
COMMENT 'Whether to shuffle option order for each question' 
AFTER shuffle_questions;

-- Verify columns were added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Exams'
    AND COLUMN_NAME IN ('shuffle_questions', 'shuffle_options')
ORDER BY ORDINAL_POSITION;

USE test_db;

-- Add essay_files column to Submissions table
ALTER TABLE Submissions 
ADD COLUMN essay_files JSON DEFAULT NULL
COMMENT 'JSON object mapping question index to file URL: {"0": "/uploads/submissions/file.pdf"}';

-- Check if column was added successfully
DESCRIBE Submissions;
