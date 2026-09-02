const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Conversation = require("../models/Conversation");
const Avaliacao = require("../models/Avaliacao");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const createNotification = require("../utils/createNotification");

// ======================================================
// CRIAR PEDIDO + CRIAR CONVERSA
// ======================================================
router.post("/", protect, async (req, res) => {
  try {
    const {
      profissionalId,
      servico,
      descricao,
      valor,
      endereco,
      dataPreferencia,
      periodo,
    } = req.body;

    const clienteId = req.user._id;

    if (!profissionalId || !servico) {
      return res.status(400).json({
        message: "Profissional e serviço são obrigatórios",
      });
    }

    // =============================
    // CRIA PEDIDO
    // =============================
    const order = await Order.create({
      cliente: clienteId,
      profissional: profissionalId,
      servico: servico.trim(),
      descricao: descricao || "",
      valor: Number(valor) || 0,
      status: "pendente",
      endereco: endereco || "",
      dataPreferencia: dataPreferencia || null,
      periodo: periodo || "",
    });

    // =============================
    // CRIA CONVERSA
    // =============================
    const conversation = await Conversation.create({
      participants: [clienteId, profissionalId],
      orderId: order._id,
      metadata: {
        createdBy: clienteId,
        source: "order",
      },
    });

    // =============================
    // VINCULA AO PEDIDO
    // =============================
    order.conversation = conversation._id;
    await order.save();

    // =============================
    // NOTIFICAÇÃO PARA O PROFISSIONAL
    // =============================
    const cliente = await User.findById(clienteId).select("name");

    await createNotification({
      userId: profissionalId,
      title: "Novo pedido recebido",
      message: `${cliente?.name || "Um cliente"} solicitou o serviço: ${servico}`,
      type: "order",
      link: `/profissional/chat?conversation=${conversation._id}`, // ← agora vai pro chat
    });

    // =============================
    // RETORNO COMPLETO
    // =============================
    const finalOrder = await Order.findById(order._id)
      .populate("cliente", "name email phone foto role")
      .populate("profissional", "name email phone foto role")
      .populate("conversation");

    const finalConversation = await Conversation.findById(conversation._id).populate(
      "participants",
      "name email phone foto role"
    );

    res.status(201).json({
      success: true,
      order: finalOrder,
      conversation: finalConversation,
    });
  } catch (err) {
    console.error("❌ ERRO CRIAR PEDIDO:", err);
    res.status(500).json({
      message: "Erro ao criar pedido",
      error: err.message,
    });
  }
});

// ======================================================
// LISTAR PEDIDOS DO CLIENTE LOGADO
// ======================================================
router.get("/meus", protect, async (req, res) => {
  try {
    const pedidos = await Order.find({ cliente: req.user._id })
      .populate("profissional", "name foto servico")
      .sort({ createdAt: -1 })
      .lean();

    const pedidosComAvaliacao = await Promise.all(
      pedidos.map(async (pedido) => {
        let avaliado = false;
        try {
          avaliado = !!(await Avaliacao.exists({ order: pedido._id }));
        } catch (e) {}
        return {
          ...pedido,
          avaliado,
        };
      })
    );

    res.json(pedidosComAvaliacao);
  } catch (err) {
    console.error("ERRO LISTAR PEDIDOS DO CLIENTE:", err);
    res.status(500).json({ message: "Erro ao listar pedidos" });
  }
});

// ======================================================
// PEDIDOS DO PROFISSIONAL
// ======================================================
router.get("/professional/:id", protect, async (req, res) => {
  try {
    const orders = await Order.find({
      profissional: req.params.id,
    })
      .populate("cliente", "name email phone foto role")
      .populate("conversation")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ ERRO BUSCAR PEDIDOS:", err);
    res.status(500).json({
      message: "Erro ao buscar pedidos",
    });
  }
});

// ======================================================
// ACEITAR PEDIDO
// ======================================================
router.patch("/:id/aceitar", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    if (String(order.profissional) !== String(req.user._id)) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    order.status = "aceito";
    await order.save();

    // Notifica o cliente
    await createNotification({
      userId: order.cliente,
      title: "Pedido aceito!",
      message: `Seu pedido "${order.servico}" foi aceito pelo profissional.`,
      type: "order",
      link: "/cliente/pedidos",
    });

    res.json({
      message: "Pedido aceito",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao aceitar pedido" });
  }
});

// ======================================================
// RECUSAR PEDIDO
// ======================================================
router.patch("/:id/recusar", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    if (String(order.profissional) !== String(req.user._id)) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    order.status = "recusado";
    await order.save();

    // Notifica o cliente
    await createNotification({
      userId: order.cliente,
      title: "Pedido recusado",
      message: `Seu pedido "${order.servico}" foi recusado.`,
      type: "order",
      link: "/cliente/pedidos",
    });

    res.json({
      message: "Pedido recusado",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: "Erro ao recusar pedido" });
  }
});

// ======================================================
// INICIAR SERVIÇO
// ======================================================
router.patch("/:id/iniciar", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    if (String(order.profissional) !== String(req.user._id)) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    order.status = "em_andamento";
    await order.save();

    // Notifica o cliente
    await createNotification({
      userId: order.cliente,
      title: "Serviço iniciado",
      message: `O profissional iniciou o serviço "${order.servico}".`,
      type: "order",
      link: "/cliente/pedidos",
    });

    res.json({
      message: "Serviço iniciado",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: "Erro ao iniciar serviço" });
  }
});

// ======================================================
// FINALIZAR SERVIÇO
// ======================================================
router.patch("/:id/finalizar", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    if (String(order.profissional) !== String(req.user._id)) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    order.status = "finalizado";
    order.dataFinalizacao = new Date();
    await order.save();

    // Notifica o cliente
    await createNotification({
      userId: order.cliente,
      title: "Serviço finalizado",
      message: `O serviço "${order.servico}" foi finalizado. Você já pode avaliar!`,
      type: "order",
      link: "/cliente/pedidos",
    });

    res.json({
      message: "Serviço finalizado",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: "Erro ao finalizar serviço" });
  }
});

module.exports = router;