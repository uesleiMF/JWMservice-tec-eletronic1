const Orcamento = require("../models/Orcamento"); // ajuste o caminho se necessário

async function gerarNumeroOS() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  const prefixo = `OS-${ano}${mes}${dia}`;

  // Busca a última OS do dia
  const ultima = await Orcamento.findOne({
    numeroOS: { $regex: `^${prefixo}-` },
  })
    .sort({ numeroOS: -1 })
    .select("numeroOS")
    .lean();

  let sequencial = 1;

  if (ultima?.numeroOS) {
    const partes = ultima.numeroOS.split("-");
    const ultimoNumero = parseInt(partes[2], 10);

    if (!isNaN(ultimoNumero)) {
      sequencial = ultimoNumero + 1;
    }
  }

  return `${prefixo}-${String(sequencial).padStart(3, "0")}`;
}

module.exports = gerarNumeroOS;