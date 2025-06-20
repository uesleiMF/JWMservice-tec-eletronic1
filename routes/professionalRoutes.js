const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const Professional = require('../models/Professional');
const auth = require('../middleware/authMiddleware'); // middleware JWT

// Configuração Multer para salvar arquivos em 'uploads/'
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Criar ou atualizar perfil profissional
router.post('/', auth, async (req, res) => {
  try {
    const { services, description, price, address, location } = req.body;

    let professional = await Professional.findOne({ user: req.user.id });

    if (professional) {
      professional.services = services;
      professional.description = description;
      professional.price = price;
      professional.address = address;
      professional.location = location;

      await professional.save();
      return res.json(professional);
    }

    professional = new Professional({
      user: req.user.id,
      services,
      description,
      price,
      address,
      location,
    });

    await professional.save();
    res.status(201).json(professional);
  } catch (err) {
    console.error('Erro ao salvar perfil profissional:', err);
    res.status(500).json({ message: 'Erro ao salvar perfil profissional' });
  }
});

// Upload múltiplo de fotos para perfil profissional
router.post('/upload-photos', auth, upload.array('photos', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Nenhuma foto enviada' });
    }

    const professional = await Professional.findOne({ user: req.user.id });
    if (!professional) {
      return res.status(404).json({ message: 'Perfil profissional não encontrado' });
    }

    const photosPaths = req.files.map(file => `/uploads/${file.filename}`);

    professional.photos = (professional.photos || []).concat(photosPaths);
    await professional.save();

    res.json({ message: 'Fotos adicionadas com sucesso', photos: professional.photos });
  } catch (err) {
    console.error('Erro ao enviar fotos:', err);
    res.status(500).json({ message: 'Erro ao enviar fotos' });
  }
});

// Listar todos os profissionais
router.get('/', async (req, res) => {
  try {
    const professionals = await Professional.find()
      .populate('user', 'name photo email');
    res.json(professionals);
  } catch (err) {
    console.error('Erro ao listar profissionais:', err);
    res.status(500).json({ message: 'Erro ao listar profissionais' });
  }
});

// Buscar profissionais próximos por geolocalização
router.get('/near', async (req, res) => {
  const { lat, lng, maxDistance = 10000 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude e longitude são obrigatórios' });
  }

  try {
    const professionals = await Professional.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).populate('user', 'name photo email');

    res.json(professionals);
  } catch (err) {
    console.error('Erro ao buscar profissionais próximos:', err);
    res.status(500).json({ message: 'Erro ao buscar profissionais próximos' });
  }
});

// Buscar perfil profissional completo (com avaliações)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const mongoose = require('mongoose');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const professional = await Professional.findById(id)
      .populate('user', 'name photo email')
      .lean();

    if (!professional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }

    const Review = require('../models/Review');
    const reviews = await Review.find({ professional: professional._id })
      .populate('client', 'name')
      .sort({ createdAt: -1 })
      .lean();

    professional.reviews = reviews.map(r => ({
      user: r.client.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      _id: r._id,
    }));

    res.json(professional);
  } catch (err) {
    console.error('Erro ao buscar perfil do profissional:', err);
    res.status(500).json({ message: 'Erro ao buscar perfil do profissional' });
  }
});

module.exports = router;
