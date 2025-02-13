const express = require('express');
const LessonController = require('../controllers/lessonController');
const router = express.Router();

router.get('/', LessonController.getAllLessons);
router.get('/:lessonId', LessonController.getLessonById);
router.post('/', LessonController.createLesson);
router.put('/:lessonId', LessonController.updateLesson);
router.delete('/:lessonId', LessonController.deleteLesson);
router.post('/:lessonId/complete', LessonController.completeLesson);
router.get('/completed', LessonController.getCompletedLessons);

module.exports = router;
