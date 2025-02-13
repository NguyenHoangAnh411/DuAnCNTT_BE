const express = require('express');
const MomoPayment = require('../controllers/momoPayment');
const Transaction = require('../controllers/transactionController');

const router = express.Router();

router.post('/create-payment', MomoPayment.createPayment);
router.post('/callback', MomoPayment.processPaymentCallback);

// Transactions
router.get('/completedTransaction', Transaction.getCompletedTransaction);
router.get('/pendingTransaction', Transaction.getPendingTransaction);

module.exports = router;