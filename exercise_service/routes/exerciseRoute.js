const express = require('express');
const router = express.Router();



const ExerciseController = require('../controllers/exerciseController')

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