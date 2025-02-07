const express = require('express');
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({extended: true}))

const PremiumController = require('../controllers/premiumController');
const momoPayment = require('../controllers/momoPayment');
// PremiumController
router.post('/activate', PremiumController.updatePremiumStatus);
router.get('/status/:userId', PremiumController.checkPremiumStatus);
router.post('/cancel', PremiumController.cancelPremium);

// Momo Payment
router.post('/payment/momoPayment', momoPayment.momoPayment);
router.post('/payment/callback', momoPayment.Callback);
router.post('/payment/transactionStatus', momoPayment.checkTransactionStatus);

module.exports = router;