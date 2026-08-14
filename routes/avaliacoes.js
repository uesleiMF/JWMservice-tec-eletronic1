const express = require("express");
const router = express.Router();
const Avaliacao = require("../models/Avaliacao");
const User = require("../models/User");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// ======================================================
// CRIAR AVALIAÇÃO
// ======================================================
router.post("/", protect, async (req, res) => {
  try {
    const { orderId, nota, comentario } = req.body;

    if (!orderId || !nota) {
      return res.status(400).json({ message: "Pedido e nota são obrigatórios" });
    }

    if (nota < 1 || nota > 5) {
      return res.status(400).json({ message: "A nota deve ser entre 1 e 5" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    // Só o cliente dono do pedido pode avaliar
    if (order.cliente.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    // Só pode avaliar se estiver finalizado
    if (order.status !== "finalizado") {
      return res.status(400).json({
        message: "Só é possível avaliar pedidos finalizados",
      });
    }

    // Já avaliou este pedido?
    const jaAvaliou = await Avaliacao.findOne({ order: orderId });
    if (jaAvaliou) {
      return res.status(400).json({ message: "Este pedido já foi avaliado" });
    }

    const avaliacao = await Avaliacao.create({
      cliente: req.user._id,
      profissional: order.profissional,
      order: orderId,
      nota: Number(nota),
      comentario: comentario?.trim() || "",
    });

    // Atualiza a média do profissional
    await atualizarMediaProfissional(order.profissional);

    res.status(201).json({
      message: "Avaliação enviada com sucesso",
      avaliacao,
    });
  } catch (err) {
    console.error("ERRO CRIAR AVALIAÇÃO:", err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "Este pedido já foi avaliado" });
    }

    res.status(500).json({ message: "Erro ao enviar avaliação" });
  }
});

// ======================================================
// BUSCAR AVALIAÇÕES DE UM PROFISSIONAL
// ======================================================
router.get("/profissional/:id", async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.find({ profissional: req.params.id })
      .populate("cliente", "name foto")
      .sort({ createdAt: -1 })
      .lean();

    res.json(avaliacoes);
  } catch (err) {
    console.error("ERRO BUSCAR AVALIAÇÕES:", err);
    res.status(500).json({ message: "Erro ao buscar avaliações" });
  }
});

// ======================================================
// Atualiza média e total de avaliações
// ======================================================
async function atualizarMediaProfissional(profissionalId) {
  const resultado = await Avaliacao.aggregate([
    { $match: { profissional: new mongoose.Types.ObjectId(profissionalId) } },
    {
      $group: {
        _id: "$profissional",
        media: { $avg: "$nota" },
        total: { $sum: 1 },
      },
    },
  ]);

  if (resultado.length > 0) {
    await User.findByIdAndUpdate(profissionalId, {
      avaliacaoMedia: Number(resultado[0].media.toFixed(1)),
      totalAvaliacoes: resultado[0].total,
    });
  } else {
    await User.findByIdAndUpdate(profissionalId, {
      avaliacaoMedia: 0,
      totalAvaliacoes: 0,
    });
  }
}

module.exports = router;