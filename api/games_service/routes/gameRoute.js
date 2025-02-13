const express = require('express');
const GameController = require('../controllers/gameController');
const router = express.Router();

router.get('/', GameController.getGameTypes);
router.get('/:gameType', GameController.getGameTypeInfo);

module.exports = router;