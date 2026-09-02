require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const orcamentoRoutes = require("./routes/orcamentoRoutes");


const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);


// ======================================================
// CORS
// ======================================================

const corsOptions = {
  origin: function (origin, callback) {

    // Permite requisições sem origin
    // (Postman, aplicações internas etc.)
    if (!origin) {
      return callback(null, true);
    }


    const allowedOrigins = [

      "http://localhost:3000",

      "http://127.0.0.1:3000",

      "http://localhost:3001",

      "https://jw-mservice-tec-eletric2.vercel.app",

      "https://jw-mservice-tec-eletric2-1qxtac5a6-uesleimfs-projects.vercel.app",

    ];


    // --------------------------------------------------
    // Origens autorizadas
    // --------------------------------------------------

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost")
    ) {

      return callback(null, true);

    }


    console.log(
      "🚫 Origin bloqueado:",
      origin
    );


    callback(
      new Error("Not allowed by CORS")
    );

  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-access-token",
  ],

  optionsSuccessStatus: 200,
};


app.use(
  cors(corsOptions)
);


app.options(
  "*",
  cors(corsOptions)
);


// ======================================================
// SOCKET.IO
// ======================================================

const io = new Server(server, {

  cors: corsOptions,

  transports: [
    "websocket",
    "polling",
  ],

  path: "/socket.io",

  pingTimeout: 60000,

  pingInterval: 25000,

});


// ======================================================
// MONGODB
// ======================================================

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {

    console.log(
      "✅ MongoDB conectado"
    );

  })

  .catch((err) => {

    console.error(
      "❌ Erro MongoDB:",
      err
    );

    process.exit(1);

  });


mongoose.connection.on(
  "connected",
  () => {

    console.log(
      "🟢 Evento: MongoDB conectado"
    );

  }
);


mongoose.connection.on(
  "disconnected",
  () => {

    console.log(
      "🟡 Evento: MongoDB desconectado"
    );

  }
);


mongoose.connection.on(
  "reconnected",
  () => {

    console.log(
      "🔄 Evento: MongoDB reconectado"
    );

  }
);


mongoose.connection.on(
  "error",
  (err) => {

    console.error(
      "🔴 Evento: Erro MongoDB:",
      err.message
    );

  }
);


// ======================================================
// ROTAS
// ======================================================
app.use("/api/orcamentos", orcamentoRoutes);
app.use("/api/avaliacoes", require("./routes/avaliacoes"));
app.use("/api/notifications", require("./routes/notifications"));

app.use(
  "/api/auth",
  require("./routes/auth"));


app.use(
  "/api/profissionais",
  require("./routes/profissionais")
);


app.use(
  "/api/users",
  require("./routes/userRoutes")
);


app.use(
  "/api/orders",
  require("./routes/orders")
);


app.use(
  "/api/chat",
  require("./routes/chatRoutes")
);


app.use(
  "/api/conversations",
  require("./routes/conversationRoutes")
);


app.use(
  "/api/reviews",
  require("./routes/reviewRoutes")
);


app.use(
  "/api/payments",
  require("./routes/paymentRoutes")
);


app.use(
  "/api/mercadopago",
  require("./routes/mercadopagoRoutes")
);


app.use(
  "/api/webhook/mp",
  require("./routes/webhookMP")
);


// ======================================================
// SOCKET HANDLER
// ======================================================
//
// IMPORTANTE:
//
// Todo o comportamento do Socket.IO fica centralizado
// em socket/socketHandler.js.
//
// Não coloque outro io.on("connection") aqui.
// Isso evita eventos duplicados.
//
require("./socket/socketHandler")(io);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
  "/",
  (req, res) => {

    res.json({

      status: "online",

      message:
        "JW Service API funcionando 🚀",

      version:
        "2.0.0",

    });

  }
);


// ======================================================
// SOCKET HEALTH
// ======================================================

app.get(
  "/socket-health",
  (req, res) => {

    res.json({

      status: "ok",

      uptime:
        process.uptime(),

      sockets:
        io.engine.clientsCount,

    });

  }
);


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
  (err, req, res, next) => {

    console.error(
      "❌ ERROR HANDLER:",
      err
    );


    res.status(500).json({

      success: false,

      message:
        err.message ||
        "Erro interno do servidor",

    });

  }
);


// ======================================================
// START SERVER
// ======================================================

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🚀 Servidor rodando na porta ${PORT}`
    );

    console.log(
      `🌐 http://localhost:${PORT}`
    );

  }
);