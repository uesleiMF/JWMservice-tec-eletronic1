const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  createService,
  updateStatus,
  linkPaymentToService,
  releasePayment,
  getProfessionalServices
} = require('../controllers/serviceController');

router.post('/create', protect, createService);
router.patch('/:serviceId/status', protect, updateStatus);
router.post('/link-payment', protect, linkPaymentToService);
router.post('/:serviceId/release-payment', protect, releasePayment);
router.get('/me', protect, getProfessionalServices);

module.exports = router;
