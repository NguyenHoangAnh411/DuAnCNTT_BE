const express = require('express');
const AdminUserController = require('../controllers/adminUserController');
const AdminCourseController = require('../controllers/adminCourseController');
const ExerciseController = require('../controllers/adminExerciseController');
const NotificationController = require('../controllers/adminNotification');
const { upload } = require('../../services/firebaseService');
const router = express.Router();

// Notification
router.post('/sendNotification', NotificationController.sendNotification);
router.get('/getNotifications/:userId', NotificationController.getNotificationsByUserId);

// Exercise Controller
router.post('/simulated-conversations', ExerciseController.addSimulatedConversations);
router.post('/speaking-exercises', ExerciseController.addSpeakingExercise);

router.delete('/exercises/:skill/:id', ExerciseController.deleteExercise);
    // Grammar
router.post('/grammar-exercises', ExerciseController.addGrammarExercise);
router.put('/grammar-exercises/:id', ExerciseController.updateGrammarExercise);
    // Speaking
router.post('/speaking-exercises', ExerciseController.addSpeakingExercise);
router.put('/speaking-exercises/:id', ExerciseController.updateSpeakingExercise);
    // Writing
router.post('/writing-topics', ExerciseController.addWritingTopic);
router.put('/writing-topics/:id', ExerciseController.updateWritingTopic);
    // Listening
router.post('/listening-exercises', upload.single('audioFile'), ExerciseController.addListeningExercise);
router.patch('/listening-exercises/:id', ExerciseController.updateListeningExercise);
    // Reading
router.post('/reading-exercises', ExerciseController.addReadingExercise);
router.patch('/reading-exercises/:id', ExerciseController.updateReadingExercise);
    // Vocabulary

// User Controller
router.get('/users', AdminUserController.listUsers);
router.post('/users', AdminUserController.createUser);
router.get('/users/:id', AdminUserController.getUserById);
router.put('/users/:id', AdminUserController.updateUser);
router.delete('/users/:id', AdminUserController.deleteUser);
router.patch('/users/:id/status', AdminUserController.toggleUserStatus);
router.patch('/users/:id/role', AdminUserController.updateUserRole);

// Course Controller
router.get('/courses', AdminCourseController.getAllCourses);
router.post('/courses', AdminCourseController.addCourse);
router.put('/courses/:id', AdminCourseController.updateCourse);
router.delete('/courses/:id', AdminCourseController.deleteCourse);
router.get('/courses/:id', AdminCourseController.getCourseDetails);

module.exports = router;