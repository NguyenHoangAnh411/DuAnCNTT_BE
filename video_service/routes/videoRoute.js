const express = require('express');
const VideoController = require('../controllers/videoController');
const router = express.Router();

router.get("/transcript/:transcriptId", VideoController.getTranscript);
router.get("/video-topics", VideoController.getVideoTopic);
router.get("/audio-topics", VideoController.getAudioTopics);
module.exports = router;