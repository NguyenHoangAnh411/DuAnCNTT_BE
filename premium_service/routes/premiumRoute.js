const express = require('express');
const MomoPayment = require('../controllers/momoPayment');
const PremiumController = require('../controllers/premiumController');

const router = express.Router();

router.post('/create-payment', MomoPayment.createPayment);
router.post('/callback', MomoPayment.callback);

router.post('/update-premium-status', PremiumController.updatePremiumStatus);
router.get('/check-premium-status/:userId', PremiumController.checkPremiumStatus);
router.post('/cancel-premium', PremiumController.cancelPremium);

module.exports = router;