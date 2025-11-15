const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const examController = require('../controllers/examController');
const submissionController = require('../controllers/submissionController');
const leaderboardController = require('../controllers/leaderboardController');
const userMappingController = require('../controllers/userMappingController');
const { upload, uploadController } = require('../controllers/uploadController');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getCurrentUser);
router.post('/auth/logout', authController.logout);
router.put('/auth/change-password', authController.changePassword);

// Exam routes
router.get('/exams', examController.getAllExams);
router.get('/exams/:id', examController.getExamById);
router.post('/exams', examController.createExam);
router.put('/exams/:id', examController.updateExam);
router.delete('/exams/:id', examController.deleteExam);

// Submission routes
router.post('/submissions', submissionController.createSubmission);
router.get('/submissions/student/:studentId', submissionController.getStudentSubmissions);
router.get('/submissions/exam/:examId', submissionController.getExamSubmissions);
router.get('/submissions/pending', submissionController.getPendingSubmissions);
router.get('/submissions/:id', submissionController.getSubmissionById);
router.put('/submissions/:id/grade', submissionController.gradeSubmission);

// Leaderboard routes
router.get('/leaderboard/exam/:examId', leaderboardController.getExamLeaderboard);
router.get('/leaderboard/global', leaderboardController.getGlobalLeaderboard);
router.get('/leaderboard/student/:studentId/rank', leaderboardController.getStudentRank);

// User mapping routes
router.get('/user-mapping/resolve', userMappingController.resolveUserId);

// Thêm route mới để xử lý upload file
router.post('/upload', upload.single('file'), uploadController.uploadFile);

module.exports = router;
