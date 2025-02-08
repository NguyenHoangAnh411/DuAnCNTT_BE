const express = require('express');
const MomoPayment = require('../controllers/momoPayment');

const router = express.Router();

router.post('/create-payment', MomoPayment.createPayment);
router.post('/callback', MomoPayment.processPaymentCallback);

module.exports = router;