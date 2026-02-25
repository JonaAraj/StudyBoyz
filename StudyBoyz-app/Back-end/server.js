require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sequelize = require("./config/database");
const Usuario = require("./models/Usuario");
const Archivo = require("./models/Archivo");
const autenticar = require("./middleware/auth");
const upload = require("./middleware/upload");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("uploads")); // Servir archivos subidos estáticamente

// ========== RUTAS DE AUTENTICACIÓN ==========

// REGISTRO - Crear nuevo usuario
app.post("/auth/registro", async (req, res) => {
  try {
    const { nombre_usuario, email, contraseña, nombre_completo } = req.body;

    if (!nombre_usuario || !email || !contraseña) {
      return res.status(400).json({
        error: "nombre_usuario, email y contraseña son obligatorios",
      });
    }

    const usuarioExistente = await Usuario.findOne({
      where: { nombre_usuario },
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "El nombre de usuario ya existe" });
    }

    const usuario = await Usuario.create({
      nombre_usuario,
      email,
      contraseña,
      nombre_completo,
    });

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      mensaje: "Usuario creado exitosamente",
      usuario: {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN - Autenticar usuario
app.post("/auth/login", async (req, res) => {
  try {
    const { nombre_usuario, contraseña } = req.body;

    if (!nombre_usuario || !contraseña) {
      return res.status(400).json({
        error: "nombre_usuario y contraseña son obligatorios",
      });
    }

    const usuario = await Usuario.findOne({ where: { nombre_usuario } });

    if (!usuario) {
      return res
        .status(401)
        .json({ error: "nombre_usuario o contraseña incorrectos" });
    }

    const contraseñaValida = await usuario.verificarContraseña(contraseña);

    if (!contraseñaValida) {
      return res
        .status(401)
        .json({ error: "nombre_usuario o contraseña incorrectos" });
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      mensaje: "Login exitoso",
      usuario: {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        email: usuario.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RUTAS DE ARCHIVOS ==========

// SUBIR archivo (audio o PDF)
app.post(
  "/archivos/subir",
  autenticar,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se proporcionó archivo" });
      }

      const { descripcion } = req.body;
      const extension = path.extname(req.file.originalname).toLowerCase();
      let tipoArchivo = "otro";

      if ([".mp3", ".wav", ".m4a"].includes(extension)) {
        tipoArchivo = "audio";
      } else if (extension === ".pdf") {
        tipoArchivo = "pdf";
      }

      const archivo = await Archivo.create({
        usuario_id: req.usuario_id,
        nombre_original: req.file.originalname,
        nombre_guardado: req.file.filename,
        tipo_archivo: tipoArchivo,
        tamaño: req.file.size,
        ruta_archivo: `/uploads/${req.file.filename}`,
        descripcion: descripcion || null,
      });

      res.status(201).json({
        mensaje: "Archivo subido exitosamente",
        archivo: {
          id: archivo.id,
          nombre_original: archivo.nombre_original,
          tipo_archivo: archivo.tipo_archivo,
          tamaño: archivo.tamaño,
          ruta: archivo.ruta_archivo,
        },
      });
    } catch (error) {
      // Limpiar archivo si hay error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error al eliminar archivo:", err);
        });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

// OBTENER archivos del usuario
app.get("/archivos", autenticar, async (req, res) => {
  try {
    const { tipo } = req.query; // Filtrar por tipo: audio o pdf

    let where = { usuario_id: req.usuario_id };
    if (tipo) {
      where.tipo_archivo = tipo;
    }

    const archivos = await Archivo.findAll({
      where,
      order: [["creado_en", "DESC"]],
    });

    res.json({
      total: archivos.length,
      archivos,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DESCARGAR archivo
app.get("/archivos/descargar/:id", autenticar, async (req, res) => {
  try {
    const archivo = await Archivo.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.usuario_id,
      },
    });

    if (!archivo) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    const rutaCompleta = path.join(
      process.env.UPLOAD_DIR || "./uploads",
      archivo.nombre_guardado,
    );

    // Verificar que el archivo existe
    if (!fs.existsSync(rutaCompleta)) {
      return res
        .status(404)
        .json({ error: "Archivo no existe en el servidor" });
    }

    // Marcar como descargado
    await archivo.update({ descargado: true });

    res.download(rutaCompleta, archivo.nombre_original);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ELIMINAR archivo
app.delete("/archivos/:id", autenticar, async (req, res) => {
  try {
    const archivo = await Archivo.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.usuario_id,
      },
    });

    if (!archivo) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    // Eliminar archivo físico
    const rutaCompleta = path.join(
      process.env.UPLOAD_DIR || "./uploads",
      archivo.nombre_guardado,
    );

    if (fs.existsSync(rutaCompleta)) {
      fs.unlinkSync(rutaCompleta);
    }

    // Eliminar registro de la BD
    await archivo.destroy();

    res.json({ mensaje: "Archivo eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SINCRONIZAR BD E INICIAR SERVIDOR ==========

async function iniciarServidor() {
  try {
    // Sincronizar modelos con la BD
    await sequelize.sync({ alter: false });
    console.log("✓ Base de datos sincronizada");

    app.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
      console.log("📝 Para usar, primero registrate en POST /auth/registro");
    });
  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error.message);
    process.exit(1);
  }
}

iniciarServidor();
