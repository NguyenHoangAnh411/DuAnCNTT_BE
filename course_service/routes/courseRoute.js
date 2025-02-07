const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/courseController');

// Lấy danh sách tất cả khóa học
router.get('/', CourseController.getAllCourses);

// Lấy chi tiết khóa học theo ID
router.get('/:courseId', CourseController.getCourseById);

// Tìm kiếm khóa học
router.get('/search', CourseController.searchCourses);

module.exports = router;
