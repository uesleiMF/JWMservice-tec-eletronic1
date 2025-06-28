const ServiceRequest = require('../models/ServiceRequest');
const Receipt = require('../models/Receipt');

exports.createService = async (req, res) => {
  const { professionalId, description, date, location, amount } = req.body;
  const commission = (amount * 0.1).toFixed(2); // 10% comissão
  try {
    const service = await ServiceRequest.create({
      client: req.user._id,
      professional: professionalId,
      description,
      date,
      location,
      amount,
      commission
    });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
};

exports.updateStatus = async (req, res) => {
  const { serviceId } = req.params;
  const { status } = req.body;
  try {
    const service = await ServiceRequest.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    service.status = status;
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
};

exports.linkPaymentToService = async (req, res) => {
  const { orderId, serviceId } = req.body;
  try {
    const service = await ServiceRequest.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    service.paypalOrderId = orderId;
    service.paymentStatus = 'pago';
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao vincular pagamento' });
  }
};

exports.releasePayment = async (req, res) => {
  const { serviceId } = req.params;
  try {
    const service = await ServiceRequest.findById(serviceId).populate('professional');
    if (!service || service.status !== 'concluido') 
      return res.status(400).json({ error: 'Serviço inválido' });
    if (service.paymentStatus === 'liberado') 
      return res.status(400).json({ error: 'Pagamento já liberado' });

    service.paymentStatus = 'liberado';
    await service.save();

    await Receipt.create({
      service: service._id,
      transactionId: service.paypalOrderId,
      client: service.client,
      professional: service.professional._id,
      amount: service.amount,
      commission: service.commission,
      releasedAt: new Date()
    });

    res.json({ message: 'Pagamento liberado', service });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao liberar pagamento' });
  }
};

exports.getProfessionalServices = async (req, res) => {
  try {
    const services = await ServiceRequest.find({ professional: req.user._id }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
};

// Nova função para pegar os serviços do cliente logado
exports.getClientServices = async (req, res) => {
  try {
    const services = await ServiceRequest.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar serviços do cliente' });
  }
};
