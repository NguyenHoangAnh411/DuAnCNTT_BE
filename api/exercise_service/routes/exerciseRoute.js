const express = require('express');
const router = express.Router();

const TestController = require('../controllers/testController');
const ExerciseController = require('../controllers/exerciseController')
// Test Controller
router.get("/", TestController.getTests);

router.get("/:testId/questions", TestController.getTestQuestion);

router.post("/saveTestResult", TestController.submitTest);

router.get("/users/test-results/:userId", TestController.getTestResult);

// video
router.get("/transcript/:transcriptId", ExerciseController.getTranscript);
router.get("/video-topics", ExerciseController.getVideoTopic);
router.get("/audio-topics", ExerciseController.getAudioTopics);

router.get('/grammar-exercises', ExerciseController.getGrammarExercises);

router.get('/writing-exercises', ExerciseController.getWritingExercises);

router.get('/listening-exercises', ExerciseController.getListeningExercises);


router.get('/speaking-exercises', ExerciseController.getSpeakingExercises);


router.get('/simulated-conversations', ExerciseController.getSimulatedConversation);


router.get('/reading-exercises', ExerciseController.getReadingExercises);
router.get('/reading-exercises/:id', ExerciseController.getReadingExerciseById);

router.post('/analyze-sentiment', ExerciseController.AnalyzeSentiment);

module.exports = router;