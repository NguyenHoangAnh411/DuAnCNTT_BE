const express = require('express');
const router = express.Router();
const PersonalizedController = require('../controllers/personalizedController')

router.post('/', PersonalizedController.addLearningHistory);
router.get('/:userId', PersonalizedController.getLearningHistory);
router.patch('/user-profile', PersonalizedController.updateUserProfile);
router.get('/personalized-recommendations/:userId', PersonalizedController.getPersonalizedRecommendations);

module.exports = router;