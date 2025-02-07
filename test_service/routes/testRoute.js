const express = require('express');
const TestController = require('../controllers/testController');
const router = express.Router();

router.get("", TestController.getTests);

router.get("/:testId/questions", TestController.getTestQuestion);

router.post("/saveTestResult", TestController.submitTest);

router.get("/users/test-results/:userId", TestController.getTestResult);

module.exports = router;