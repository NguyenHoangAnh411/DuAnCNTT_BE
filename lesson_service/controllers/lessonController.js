const { admin, database } = require('../../services/firebaseService');

class LessonController {
  // Get a lesson by ID
  static async getLessonById(req, res) {
    const { lessonId } = req.params;

    try {
      const lessonRef = database.ref(`lessons/${lessonId}`);
      const lessonSnapshot = await lessonRef.once('value');
      const lesson = lessonSnapshot.val();

      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      res.status(200).json({ id: lessonId, ...lesson });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lesson', details: error.message });
    }
  }

  // Get all lessons with pagination
  static async getAllLessons(req, res) {
    const { page = 1, limit = 10 } = req.query;

    try {
      const lessonsRef = database.ref('lessons');
      const lessonsSnapshot = await lessonsRef.once('value');
      const lessonsData = lessonsSnapshot.val() || {};

      const lessons = Object.keys(lessonsData)
        .map(key => ({ id: key, ...lessonsData[key] }))
        .slice((page - 1) * limit, page * limit);

      res.status(200).json(lessons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lessons', details: error.message });
    }
  }

  // Create a new lesson
  static async createLesson(req, res) {
    const { title, content, exercises, quizzes, additionalInfo } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newLesson = {
      title,
      content,
      exercises: exercises || [],
      quizzes: quizzes || [],
      additionalInfo: additionalInfo || '',
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };

    try {
      const lessonRef = database.ref('lessons').push();
      await lessonRef.set(newLesson);
      
      res.status(201).json({ id: lessonRef.key, ...newLesson });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create lesson', details: error.message });
    }
  }

  // Update lesson
  static async updateLesson(req, res) {
    const { lessonId } = req.params;
    const updates = req.body;

    try {
      const lessonRef = database.ref(`lessons/${lessonId}`);
      const lessonSnapshot = await lessonRef.once('value');

      if (!lessonSnapshot.exists()) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      await lessonRef.update(updates);
      res.status(200).json({ message: 'Lesson updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update lesson', details: error.message });
    }
  }

  // Delete lesson
  static async deleteLesson(req, res) {
    const { lessonId } = req.params;

    try {
      const lessonRef = database.ref(`lessons/${lessonId}`);
      const lessonSnapshot = await lessonRef.once('value');

      if (!lessonSnapshot.exists()) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      await lessonRef.remove();
      res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete lesson', details: error.message });
    }
  }

  // Mark lesson as completed
  static async completeLesson(req, res) {
    const { lessonId } = req.params;
    const userId = req.user.uid;

    try {
      const completionRef = database.ref(`lessonCompletions/${userId}/${lessonId}`);
      await completionRef.set({
        completedAt: admin.database.ServerValue.TIMESTAMP,
      });

      res.status(200).json({ message: 'Lesson marked as completed' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark lesson as completed', details: error.message });
    }
  }

  // Get all completed lessons for a user
  static async getCompletedLessons(req, res) {
    const userId = req.user.uid;

    try {
      const completedRef = database.ref(`lessonCompletions/${userId}`);
      const completedSnapshot = await completedRef.once('value');
      const completedLessons = completedSnapshot.val() || {};

      const formattedCompletedLessons = Object.keys(completedLessons).map(lessonId => ({
        lessonId,
        ...completedLessons[lessonId]
      }));

      res.status(200).json(formattedCompletedLessons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch completed lessons', details: error.message });
    }
  }
}

module.exports = LessonController;
