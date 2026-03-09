// ============================================================
// AGREGAR ESTOS ENDPOINTS AL ARCHIVO endpoint.js
// Pega antes del module.exports = router
// ============================================================

// Requiere al inicio de endpoint.js:
// const Materia = require('./models/Materia');
// const { transcribeInBackground, upload } = require('./transcriptionEndpoints');

const Materia = require("./models/Materia");

// ------------------------------------------------------------
// GET /materias — Materias únicas del usuario autenticado
// ------------------------------------------------------------
router.get("/materias", requireAuth, async (req, res) => {
  try {
    const materias = await Materia.findByUser(req.user.id);
    return res.json({ success: true, materias });
  } catch (err) {
    console.error("[MATERIAS GET]", err);
    return res
      .status(500)
      .json({ success: false, message: "Error al obtener materias." });
  }
});

// ------------------------------------------------------------
// POST /recordings/save — Guardar grabación con audio real
// Multipart: campo "audio" + body { title, subject }
// Dispara transcripción automática en background
// ------------------------------------------------------------
router.post(
  "/recordings/save",
  requireAuth,
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No se recibió archivo de audio." });
      }

      const { title, subject, duration } = req.body;
      const userId = req.user.id;
      const filename = `${userId}_${Date.now()}.${req.file.originalname.split(".").pop() || "m4a"}`;

      // 1. Subir a Supabase Storage
      const { data: storageData, error: storageError } =
        await supabaseAdmin.storage
          .from("recordings")
          .upload(`audio/${filename}`, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

      if (storageError) throw storageError;

      const filePath = `audio/${filename}`;

      // 2. Guardar registro en BD
      const { data: recording, error: dbError } = await supabaseAdmin
        .from("recordings")
        .insert([
          {
            title:
              title || `Grabación ${new Date().toLocaleDateString("es-MX")}`,
            file_path: filePath,
            size_bytes: req.file.size,
            duration: duration ? parseInt(duration) : null,
            subject: subject || null,
            user_id: userId,
            transcript_status: "pending",
          },
        ])
        .select("*")
        .single();

      if (dbError) throw dbError;

      // 3. Transcribir en background (no bloquea la respuesta)
      const { transcribeInBackground } = require("./transcriptionEndpoints");
      transcribeInBackground(
        recording.id,
        userId,
        filePath,
        req.file.mimetype,
        req.file.buffer,
      );

      return res.status(201).json({
        success: true,
        message: "Grabación guardada. Transcripción en proceso.",
        recording,
      });
    } catch (err) {
      console.error("[SAVE RECORDING]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
);
