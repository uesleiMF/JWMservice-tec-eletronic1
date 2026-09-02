// routes/notifications.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware"); // ← corrigido

// =====================================================
// LISTAR NOTIFICAÇÕES DO USUÁRIO LOGADO
// =====================================================
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id || req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(notifications);
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

// =====================================================
// MARCAR UMA NOTIFICAÇÃO COMO LIDA
// =====================================================
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id || req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notificação não encontrada" });
    }

    res.json({ ok: true, notification });
  } catch (err) {
    console.error("Erro ao marcar notificação:", err);
    res.status(500).json({ error: "Erro ao marcar notificação" });
  }
});

// =====================================================
// MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
// =====================================================
router.patch("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id || req.user.id, read: false },
      { read: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao marcar todas:", err);
    res.status(500).json({ error: "Erro ao marcar todas" });
  }
});

// =====================================================
// CONTAR NOTIFICAÇÕES NÃO LIDAS
// =====================================================
router.get("/unread-count", protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id || req.user.id,
      read: false,
    });

    res.json({ count });
  } catch (err) {
    console.error("Erro ao contar notificações:", err);
    res.status(500).json({ error: "Erro ao contar notificações" });
  }
});

module.exports = router;