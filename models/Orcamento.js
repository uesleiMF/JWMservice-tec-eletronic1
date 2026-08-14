const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  item: { type: String, required: true, trim: true },
  un: { type: String, default: "un", trim: true },
  quantidade: { type: Number, required: true, min: 0 },
  precoUnit: { type: Number, required: true, min: 0 },
});

const OrcamentoSchema = new mongoose.Schema(
  {
    profissional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Número da Ordem de Serviço
    numeroOS: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true, // permite documentos antigos sem número
    },
    cliente: {
      type: String,
      required: true,
      trim: true,
    },
    servico: {
      type: String,
      required: true,
      trim: true,
    },
    unidade: {
      type: String,
      default: "m²",
      trim: true,
    },
    maoDeObra: [ItemSchema],
    materiais: [ItemSchema],
    equipamentos: [ItemSchema],
    totais: {
      totalMaoDeObra: { type: Number, default: 0 },
      totalMateriais: { type: Number, default: 0 },
      totalEquipamentos: { type: Number, default: 0 },
      valorTotal: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["pendente", "aprovado", "recusado", "finalizado"],
      default: "pendente",
      index: true,
    },
    observacoes: { type: String, trim: true },
    validade: { type: Date },
  },
  { timestamps: true }
);

// Calcula os totais automaticamente antes de salvar
OrcamentoSchema.pre("save", function (next) {
  const calc = (lista = []) =>
    lista.reduce(
      (acc, item) =>
        acc + (Number(item.quantidade) || 0) * (Number(item.precoUnit) || 0),
      0
    );

  this.totais.totalMaoDeObra = calc(this.maoDeObra);
  this.totais.totalMateriais = calc(this.materiais);
  this.totais.totalEquipamentos = calc(this.equipamentos);
  this.totais.valorTotal =
    this.totais.totalMaoDeObra +
    this.totais.totalMateriais +
    this.totais.totalEquipamentos;

  next();
});

module.exports = mongoose.model("Orcamento", OrcamentoSchema);