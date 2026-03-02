// ============================================================
// endpoint.js — Rutas de autenticación StudyBoyz
// POST /auth/login    — Iniciar sesión
// POST /auth/register — Registro de nuevo usuario
// GET  /auth/me       — Perfil del usuario autenticado
// POST /auth/logout   — Cerrar sesión (client-side token removal)
// ============================================================

const express = require("express");
const router = express.Router();
const Usuario = require("./models/Usuario");
const { generateToken, requireAuth } = require("./middleware/auth");

// ------------------------------------------------------------
// POST /auth/register
// Body: { userName, email, password }
// ------------------------------------------------------------
router.post("/auth/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // Validación básica
    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "userName, email y password son requeridos.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await Usuario.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una cuenta con ese email.",
      });
    }

    // Verificar si el userName ya existe
    const existingUser = await Usuario.findByUserName(userName);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Ese nombre de usuario ya está en uso.",
      });
    }

    // Crear usuario
    const newUser = await Usuario.create({ userName, email, password });

    // Generar token
    const token = generateToken({
      id: newUser.id,
      userName: newUser.userName,
      email: newUser.Email,
    });

    return res.status(201).json({
      success: true,
      message: "¡Cuenta creada exitosamente!",
      token,
      user: {
        id: newUser.id,
        userName: newUser.userName,
        email: newUser.Email,
        createdAt: newUser.created_at,
      },
    });
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  }
});

// ------------------------------------------------------------
// POST /auth/login
// Body: { identifier, password }
// identifier puede ser email o userName
// ------------------------------------------------------------
router.post("/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario/email y contraseña son requeridos.",
      });
    }

    // Buscar por email o por userName
    const isEmail = identifier.includes("@");
    const user = isEmail
      ? await Usuario.findByEmail(identifier)
      : await Usuario.findByUserName(identifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas.",
      });
    }

    // Verificar contraseña
    const isValid = await Usuario.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas.",
      });
    }

    // Generar token JWT
    const token = generateToken({
      id: user.id,
      userName: user.userName,
      email: user.Email,
    });

    return res.status(200).json({
      success: true,
      message: "¡Sesión iniciada!",
      token,
      user: {
        id: user.id,
        userName: user.userName,
        email: user.Email,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  }
});

// ------------------------------------------------------------
// GET /auth/me — Ruta protegida: devuelve el perfil del usuario
// Header: Authorization: Bearer <token>
// ------------------------------------------------------------
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        userName: user.userName,
        email: user.Email,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("[ME ERROR]", err);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  }
});

// ------------------------------------------------------------
// POST /auth/logout
// El token se elimina en el cliente; aquí se confirma la acción
// ------------------------------------------------------------
router.post("/auth/logout", requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Sesión cerrada correctamente.",
  });
});

const Grabacion = require('./models/Grabacion');

// GET /recordings — Grabaciones del usuario autenticado
router.get('/recordings', requireAuth, async (req, res) => {
  try {
    const recordings = await Grabacion.findByUser(req.user.id);
    res.json({ success: true, recordings });
  } catch (err) {
    console.error('[RECORDINGS GET]', err);
    res.status(500).json({ success: false, message: 'Error al obtener grabaciones.' });
  }
});

// PUT /recordings/:id — Editar título y/o materia
router.put('/recordings/:id', requireAuth, async (req, res) => {
  try {
    const { title, subject } = req.body;
    const updated = await Grabacion.update(req.params.id, req.user.id, { title, subject });
    res.json({ success: true, recording: updated });
  } catch (err) {
    console.error('[RECORDINGS PUT]', err);
    res.status(500).json({ success: false, message: 'Error al actualizar grabación.' });
  }
});

// DELETE /recordings/:id — Eliminar grabación y archivo
router.delete('/recordings/:id', requireAuth, async (req, res) => {
  try {
    const { filePath } = req.body;
    await Grabacion.delete(req.params.id, req.user.id, filePath);
    res.json({ success: true, message: 'Grabación eliminada.' });
  } catch (err) {
    console.error('[RECORDINGS DELETE]', err);
    res.status(500).json({ success: false, message: 'Error al eliminar grabación.' });
  }
});

// GET /recordings/:id/download — URL de descarga firmada
router.get('/recordings/:id/download', requireAuth, async (req, res) => {
  try {
    const recording = await Grabacion.findByIdAndUser(req.params.id, req.user.id);
    if (!recording) return res.status(404).json({ success: false, message: 'No encontrada.' });

    const url = await Grabacion.getDownloadUrl(recording.file_path);
    res.json({ success: true, url });
  } catch (err) {
    console.error('[RECORDINGS DOWNLOAD]', err);
    res.status(500).json({ success: false, message: 'Error al generar URL.' });
  }
});

module.exports = router;
