const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.post('/reviews', auth, reviewController.createReview);
router.get('/reviews/:professionalId', reviewController.getReviews);

module.exports = router;
