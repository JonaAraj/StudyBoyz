// ============================================================
// server.js — Servidor Express principal
// ============================================================

require("dotenv").config();

// 🔧 SOLUCIÓN: Usar Google DNS si el DNS local no funciona
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Google DNS

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

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🎓 StudyBoyz API v1.2.0                    ║
║            ✅ Servidor ejecutado correctamente               ║
╠═══════════════════════════════════════════════════════════════╣
║  🔗 Local:       http://localhost:${PORT}                      ║
║  🔗 Red:         http://${serverIP}:${PORT}                    ║
║  🗄️  Base Datos:  Supabase                                    ║
║  🔑 DNS:         Google (8.8.8.8, 8.8.4.4)                   ║
╚═══════════════════════════════════════════════════════════════╝
  `);
  console.log("[SERVER] Escuchando en puerto", PORT);
});

module.exports = app;
