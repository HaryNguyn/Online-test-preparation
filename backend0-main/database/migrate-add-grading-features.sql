-- ===========================
-- Migration: Add Grading Features
-- Date: 2025-11-15
-- Description: Add support for essay questions and manual grading without dropping tables
-- ===========================

USE harringuyn;

-- 1. Check if partial_scores column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Column partial_scores already exists - skipping'
        ELSE 'Column partial_scores does not exist'
    END as check_result
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'harringuyn' 
  AND TABLE_NAME = 'Submissions' 
  AND COLUMN_NAME = 'partial_scores';

-- 2. Add partial_scores column (only if it doesn't exist)
-- If you get error "Duplicate column name", it means column already exists - safe to ignore
-- ALTER TABLE Submissions 
-- ADD COLUMN partial_scores JSON NULL COMMENT 'Essay scores per question index' AFTER graded_at;

-- 3. Update marks for existing questions (from 1 to 10)
UPDATE Questions SET marks = 10 WHERE marks < 10;

-- 4. Verify the changes (run these queries separately if needed)
-- SELECT 'Migration completed successfully!' as status;
-- SELECT COUNT(*) as questions_updated FROM Questions WHERE marks = 10;
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'harringuyn' 
--   AND TABLE_NAME = 'Submissions' 
--   AND COLUMN_NAME = 'partial_scores';
