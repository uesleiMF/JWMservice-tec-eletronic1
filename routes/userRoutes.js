const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

// ======================================================
// BUSCAR USUÁRIO POR ID
// ======================================================
router.get('/:id', userController.getUserById);

// ======================================================
// ATUALIZAR PERFIL
// ======================================================
router.put('/:id', userController.updateUser);

// ======================================================
// ATUALIZAR LOCALIZAÇÃO
// ======================================================
router.patch('/:id/location', userController.updateLocation);

module.exports = router;