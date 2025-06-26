const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.delete('/orders/:id', orderController.deleteOrder);

module.exports = router;
