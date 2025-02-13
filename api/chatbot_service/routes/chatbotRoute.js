const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbotController');

router.post('/', ChatbotController.ChatBot);

module.exports = router;
