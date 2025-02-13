const express = require('express');
const UserController = require('../controllers/userController');
const AuthController = require('../controllers/authController');
const LoginController = require('../controllers/loginController');
const AttendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../../services/firebaseService');
const router = express.Router();

// Login Controller
router.post('/login', LoginController.login);
router.post('/saveUserInfo', LoginController.saveUserInfo);
router.get('/getUserRole/:uid', LoginController.getUserRole);

// Auth Controller
router.post('/register', AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/request-reset-password', AuthController.requestResetPassword);
router.post('/verify-reset-code', AuthController.verifyResetPasswordCode);
router.post('/reset-password', AuthController.resetPassword);
router.post('/change-password', authMiddleware.authenticateJWT, AuthController.changePassword);

// User Controller
router.get('/profile/:userId', UserController.getUserProfile);
router.put('/profile', authMiddleware.authenticateJWT, UserController.updateUserProfile);
router.post(
    '/upload-avatar', 
    upload.single('avatar'),
    authMiddleware.authenticateJWT,
    UserController.uploadAvatar
);

router.post('/logout', authMiddleware.authenticateJWT, UserController.logout);
router.get('/', UserController.listUsers);
router.get('/search', UserController.searchUsers);

// Attendance Controller
router.post('/attendance/check-in', AttendanceController.checkIn);
router.get('/attendance/history/:uid', AttendanceController.getAttendanceHistory);

module.exports = router;
