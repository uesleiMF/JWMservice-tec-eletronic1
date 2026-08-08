
const Order = require('../models/Order');
const Conversation = require('../models/Conversation');

// ======================================================
// CRIAR PEDIDO + CONVERSA (VERSÃO SEGURA)
// ======================================================

exports.createOrder = async (req, res) => {
  try {

    const {
      profissionalId,
      servico,
      descricao,
      valor
    } = req.body;

    const clienteId = req.user._id; // vem do token

    if (!profissionalId || !servico) {
      return res.status(400).json({
        message: 'Profissional e serviço são obrigatórios'
      });
    }

    // ======================================================
    // 1. CRIAR PEDIDO
    // ======================================================

    const newOrder = await Order.create({
      cliente: clienteId,
      profissional: profissionalId,
      servico: servico.trim(),
      descricao: descricao?.trim() || '',
      valor: valor || 0,
      status: 'pendente'
    });

    // ======================================================
    // 2. PROCURAR CONVERSA EXISTENTE
    // ======================================================

    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          clienteId,
          profissionalId
        ]
      }
    }).sort({
      lastMessageAt: -1
    });

    // ======================================================
    // 3. SE NÃO EXISTIR, CRIAR CONVERSA
    // ======================================================

    if (!conversation) {

      conversation = await Conversation.create({

        participants: [
          clienteId,
          profissionalId
        ],

        client: clienteId,

        profissional: profissionalId,

        order: newOrder._id,

        orderId: newOrder._id,

        lastMessageAt: new Date(),

        metadata: {
          createdBy: clienteId,
          source: 'order'
        }

      });

      console.log(
        '🆕 Nova conversa criada:',
        conversation._id
      );

    }

    // ======================================================
    // 4. SE JÁ EXISTIR, REUTILIZAR
    // ======================================================

    else {

      conversation.order = newOrder._id;

      conversation.orderId = newOrder._id;

      if (!conversation.client) {
        conversation.client = clienteId;
      }

      if (!conversation.profissional) {
        conversation.profissional = profissionalId;
      }

      await conversation.save();

      console.log(
        '♻️ Conversa existente reutilizada:',
        conversation._id
      );
    }

    // ======================================================
    // 5. VINCULAR CONVERSA AO PEDIDO
    // ======================================================

    newOrder.conversation = conversation._id;

    await newOrder.save();

    // ======================================================
    // 6. POPULAR RESPOSTA
    // ======================================================

    const orderPopulated = await Order.findById(
      newOrder._id
    )
      .populate(
        'cliente',
        'name email phone foto'
      )
      .populate(
        'profissional',
        'name email phone foto servico avaliacaoMedia'
      );

    // ======================================================
    // 7. POPULAR CONVERSA
    // ======================================================

    const conversationPopulated =
      await Conversation.findById(
        conversation._id
      )
        .populate(
          'participants',
          'name email phone foto role'
        )
        .populate(
          'order'
        );

    // ======================================================
    // 8. RESPOSTA
    // ======================================================

    return res.status(201).json({

      success: true,

      order: orderPopulated,

      conversation: conversationPopulated

    });

  } catch (err) {

    console.error(
      'Erro ao criar pedido:',
      err
    );

    return res.status(500).json({

      message: 'Erro ao criar pedido',

      error: err.message

    });

  }
};
