const Notification = require("../models/Notification");

async function createNotification({ userId, title, message, type = "info", link = null }) {
  try {
    if (!userId) return;

    await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
    });
  } catch (err) {
    console.error("Erro ao criar notificação:", err.message);
  }
}

module.exports = createNotification;