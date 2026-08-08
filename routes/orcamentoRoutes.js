const express = require("express");
const router = express.Router();
const Orcamento = require("../models/Orcamento");
const { protect } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// Helper de cálculo (usado no update)
const calcularTotais = (maoDeObra = [], materiais = [], equipamentos = []) => {
  const calc = (lista) =>
    lista.reduce((acc, item) => {
      const qtd = Number(item.quantidade) || 0;
      const preco = Number(item.precoUnit) || 0;
      return acc + qtd * preco;
    }, 0);

  const totalMaoDeObra = calc(maoDeObra);
  const totalMateriais = calc(materiais);
  const totalEquipamentos = calc(equipamentos);

  return {
    totalMaoDeObra,
    totalMateriais,
    totalEquipamentos,
    valorTotal: totalMaoDeObra + totalMateriais + totalEquipamentos,
  };
};

// ======================================================
// CRIAR ORÇAMENTO
// ======================================================
router.post("/", protect, async (req, res) => {
  try {
    const {
      cliente,
      servico,
      unidade,
      maoDeObra = [],
      materiais = [],
      equipamentos = [],
      observacoes,
      validade,
    } = req.body;

    if (!cliente || !servico) {
      return res.status(400).json({ message: "Cliente e serviço são obrigatórios" });
    }

    // Filtra linhas vazias (sem descrição)
    const filtrarItens = (lista = []) =>
      lista.filter(
        (item) =>
          item.item &&
          item.item.trim() !== "" &&
          (Number(item.quantidade) > 0 || Number(item.precoUnit) > 0)
      );

    const maoDeObraFiltrada = filtrarItens(maoDeObra);
    const materiaisFiltrados = filtrarItens(materiais);
    const equipamentosFiltrados = filtrarItens(equipamentos);

    const orcamento = await Orcamento.create({
      profissional: req.user._id,
      cliente: cliente.trim(),
      servico: servico.trim(),
      unidade: unidade || "m²",
      maoDeObra: maoDeObraFiltrada,
      materiais: materiaisFiltrados,
      equipamentos: equipamentosFiltrados,
      observacoes,
      validade,
    });

    res.status(201).json({
      message: "Orçamento criado com sucesso",
      orcamento,
    });
  } catch (err) {
    console.error("ERRO CRIAR ORÇAMENTO:", err);
    res.status(500).json({
      message: "Erro ao criar orçamento",
      error: err.message,
    });
  }
});
// ======================================================
// LISTAR MEUS ORÇAMENTOS
// ======================================================
router.get("/meus", protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filtro = { profissional: req.user._id };
    if (status) filtro.status = status;

    const orcamentos = await Orcamento.find(filtro)
      .sort({ createdAt: -1 })
      .lean();

    res.json(orcamentos);
  } catch (err) {
    console.error("ERRO LISTAR MEUS ORÇAMENTOS:", err);
    res.status(500).json({ message: "Erro ao listar orçamentos" });
  }
});

// ======================================================
// BUSCAR UM ORÇAMENTO
// ======================================================
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const orcamento = await Orcamento.findById(req.params.id)
      .populate("profissional", "name email phone foto servico especialidade")
      .lean();

    if (!orcamento) {
      return res.status(404).json({ message: "Orçamento não encontrado" });
    }

    if (orcamento.profissional._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    res.json(orcamento);
  } catch (err) {
    console.error("ERRO BUSCAR ORÇAMENTO:", err);
    res.status(500).json({ message: "Erro ao buscar orçamento" });
  }
});

// ======================================================
// ATUALIZAR ORÇAMENTO
// ======================================================
router.put("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const orcamento = await Orcamento.findById(req.params.id);

    if (!orcamento) {
      return res.status(404).json({ message: "Orçamento não encontrado" });
    }

    if (orcamento.profissional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    if (orcamento.status === "finalizado") {
      return res.status(400).json({ message: "Orçamento finalizado não pode ser editado" });
    }

    const camposPermitidos = [
      "cliente",
      "servico",
      "unidade",
      "maoDeObra",
      "materiais",
      "equipamentos",
      "observacoes",
      "validade",
      "status",
    ];

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        orcamento[campo] = req.body[campo];
      }
    });

    // Recalcula totais
    orcamento.totais = calcularTotais(
      orcamento.maoDeObra,
      orcamento.materiais,
      orcamento.equipamentos
    );

    await orcamento.save();

    res.json({
      message: "Orçamento atualizado com sucesso",
      orcamento,
    });
  } catch (err) {
    console.error("ERRO ATUALIZAR ORÇAMENTO:", err);
    res.status(500).json({ message: "Erro ao atualizar orçamento" });
  }
});

// ======================================================
// ATUALIZAR APENAS STATUS
// ======================================================
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pendente", "aprovado", "recusado", "finalizado"].includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const orcamento = await Orcamento.findById(req.params.id);

    if (!orcamento) {
      return res.status(404).json({ message: "Orçamento não encontrado" });
    }

    if (orcamento.profissional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    orcamento.status = status;
    await orcamento.save();

    res.json({
      message: "Status atualizado com sucesso",
      orcamento,
    });
  } catch (err) {
    console.error("ERRO ATUALIZAR STATUS:", err);
    res.status(500).json({ message: "Erro ao atualizar status" });
  }
});

// ======================================================
// DELETAR ORÇAMENTO
// ======================================================
router.delete("/:id", protect, async (req, res) => {
  try {
    const orcamento = await Orcamento.findById(req.params.id);

    if (!orcamento) {
      return res.status(404).json({ message: "Orçamento não encontrado" });
    }

    if (orcamento.profissional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    await orcamento.deleteOne();

    res.json({ message: "Orçamento excluído com sucesso" });
  } catch (err) {
    console.error("ERRO DELETAR ORÇAMENTO:", err);
    res.status(500).json({ message: "Erro ao excluir orçamento" });
  }
});

module.exports = router;