const express = require('express');
const VocabController = require('../controllers/vocabularyController');

const router = express.Router();

router.get('/', VocabController.getVocabulary); 
router.get('/category/:category', VocabController.getVocabularyByCategory); 
router.delete('/:id', VocabController.deleteVocabulary); 

module.exports = router;