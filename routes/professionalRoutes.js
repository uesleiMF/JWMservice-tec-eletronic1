const express = require('express');
const router = express.Router();

const validateCoordinates = require('../middlewares/validateCoordinates');
const professionalController = require('../controllers/professionalController');

// Buscar profissionais próximos (com middleware)
router.get('/professionals', validateCoordinates, professionalController.findNearby);

// Buscar profissional por ID (essa rota está faltando, adicione-a)
router.get('/professionals/:id', professionalController.findById);

// Atualizar perfil do profissional
router.put('/professionals/:id', professionalController.updateProfile);

module.exports = router;
