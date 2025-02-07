const express = require('express');
const router = express.Router();
const SimulatedController = require('../controllers/simulatedController');

router.get('/', SimulatedController.getAllDialogues);
router.get('/:dialogueId', SimulatedController.getDialogueById);
router.post('/save-progress', SimulatedController.saveUserProgress);
router.post('/', SimulatedController.addDialogue);


module.exports = router;