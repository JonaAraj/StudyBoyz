// ============================================================
// auth.js — Middleware de autenticación JWT
// Protege rutas que requieren sesión activa
// ============================================================

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_inseguro";

/**
 * Genera un JWT con los datos del usuario
 * @param {{ id, userName, email }} payload
 * @returns {string} token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

/**
 * Middleware Express — verifica el token en el header Authorization
 * Uso: router.get('/ruta-protegida', requireAuth, handler)
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No autorizado. Token requerido.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // disponible en el handler como req.user
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado.",
    });
  }
};

module.exports = { generateToken, requireAuth };
