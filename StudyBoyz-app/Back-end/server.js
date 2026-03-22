// ============================================================
// server.js — Servidor Express principal
// ============================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const os = require("os");
const authRoutes = require("./endpoint");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ─────────────────────────────────────
app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rutas ────────────────────────────────────────────────────
app.use("/api", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", app: "StudyBoyz API", version: "1.2.0" });
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada." });
});

// ── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err);
  res
    .status(500)
    .json({ success: false, message: "Error interno del servidor." });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  // Lógica para encontrar la IP local de tu PC
  const interfaces = os.networkInterfaces();
  let serverIP = "localhost";

  Object.keys(interfaces).forEach((ifname) => {
    interfaces[ifname].forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        serverIP = iface.address;
      }
    });
  });

  console.log(`✅ Servidor corriendo.`);
  console.log(`💻 Local:   http://localhost:${PORT}`);
  console.log(
    `📱 Móvil:   http://${serverIP}:${PORT}  `
  );
});

module.exports = app;
