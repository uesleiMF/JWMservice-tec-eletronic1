const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/pay', paymentController.createOrder);
router.post('/pay/capture/:orderId', paymentController.captureOrder);

module.exports = router;
