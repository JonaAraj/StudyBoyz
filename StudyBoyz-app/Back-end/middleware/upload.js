const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Asegurar que el directorio de uploads existe
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento
const storage = multer.memoryStorage();({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  const permitidos = /\.(mp3|wav|pdf|m4a)$/i;
  const extensionValida = permitidos.test(path.extname(file.originalname));
  const mimeValido = /audio\/|application\/pdf/.test(file.mimetype);

  if (extensionValida && mimeValido) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de audio (mp3, wav, m4a) y PDF"));
  }
};

// Crear instancia de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo
  },
});

module.exports = upload;
