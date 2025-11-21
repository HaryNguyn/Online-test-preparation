-- Select database
USE harringuyn;

-- Drop existing tables to avoid FK conflicts
DROP TABLE IF EXISTS Videos;
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
    grade VARCHAR(50) DEFAULT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
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

-- ===========================
-- DATA MIGRATION / FIXES
-- ===========================

-- Fix marks for existing questions (update from default 1 to 10)
-- This ensures consistent scoring across old and new questions
UPDATE Questions SET marks = 10 WHERE marks < 10;


