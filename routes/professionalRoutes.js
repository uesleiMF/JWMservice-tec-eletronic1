const express = require('express');
const router = express.Router();
const professionalController = require('../controllers/professionalController');

router.get('/professionals', professionalController.findNearby);
router.put('/professionals/:id', professionalController.updateProfile);

module.exports = router;
