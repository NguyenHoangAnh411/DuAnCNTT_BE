const express = require('express');

const router = express.Router();
const PremiumController = require('../controllers/premiumController');
const momoPayment = require('../controllers/momoPayment');
// PremiumController
router.post('/activate', PremiumController.updatePremiumStatus);
router.get('/status/:userId', PremiumController.checkPremiumStatus);
router.post('/cancel', PremiumController.cancelPremium);

// Momo Payment
router.post('/payment/momoPayment', momoPayment.momoPayment);

module.exports = router;