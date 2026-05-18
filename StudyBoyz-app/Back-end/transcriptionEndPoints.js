const multer = require("multer");
const Transcription = require("./models/Transcription");
const deepgramService = require("./services/deepgramService");
const { supabaseAdmin } = require("./config/supabase");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = [
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/m4a",
      "audio/ogg",
      "audio/webm",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de audio no soportado."));
    }
  },
});

// ── Helper: subir buffer a Supabase Storage ─────────────────
const uploadToStorage = async (buffer, filename, mimetype) => {
  const { data, error } = await supabaseAdmin.storage
    .from("recordings")
    .upload(`uploads/${filename}`, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabaseAdmin.storage
    .from("recordings")
    .getPublicUrl(`uploads/${filename}`);

  return { path: `uploads/${filename}`, publicUrl: urlData.publicUrl };
};

// ── Helper: obtener URL firmada para transcribir ─────────────
const getSignedUrl = async (filePath) => {
  const fileName = filePath.includes("uploads/")
    ? filePath
    : `uploads/${filePath.split("/").pop()}`;

  const { data, error } = await supabaseAdmin.storage
    .from("recordings")
    .createSignedUrl(filePath, 300); // 5 minutos para que Deepgram descargue

  if (error) throw error;
  return data.signedUrl;
};

// ------------------------------------------------------------
// POST /recordings/upload — Subir audio externo desde dispositivo
// Multipart form: archivo en campo "audio", body: title, subject, user_id implícito del token
// ------------------------------------------------------------
const uploadAudioExternal = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No se recibió archivo de audio." });
    }

    const { title, subject } = req.body;
    const userId = req.user.id;
    const filename = `${userId}_${Date.now()}_${req.file.originalname.replace(/\s/g, "_")}`;

    // 1. Subir a Supabase Storage
    const { path, publicUrl } = await uploadToStorage(
      req.file.buffer,
      filename,
      req.file.mimetype,
    );

    // 2. Guardar en BD
    const { data: recording, error: dbError } = await supabaseAdmin
      .from("recordings")
      .insert([
        {
          title: title || req.file.originalname,
          file_path: path,
          size_bytes: req.file.size,
          subject_id: subject || null,
          user_id: userId,
          transcript_status: "pending",
        },
      ])
      .select("*")
      .single();

    if (dbError) throw dbError;

    // 3. Transcribir en background (no bloquea la respuesta)
    transcribeInBackground(
      recording.id,
      userId,
      path,
      req.file.mimetype,
      req.file.buffer,
    );

    return res.status(201).json({
      success: true,
      message: "Audio subido. La transcripción está en proceso.",
      recording,
    });
  } catch (err) {
    console.error("[UPLOAD EXTERNAL]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------------------------------------------------
// POST /recordings/:id/transcribe — Transcribir grabación existente
// Útil para reintentar transcripciones fallidas
// ------------------------------------------------------------
const transcribeExisting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const Grabacion = require("./models/Grabacion");
    const recording = await Grabacion.findByIdAndUser(id, userId);
    if (!recording) {
      return res
        .status(404)
        .json({ success: false, message: "Grabación no encontrada." });
    }

    if (recording.transcript_status === "processing") {
      return res
        .status(409)
        .json({ success: false, message: "Ya está siendo transcrita." });
    }

    // Lanzar en background
    transcribeInBackground(
      recording.id,
      userId,
      recording.file_path,
      "audio/mp4",
    );

    return res.json({ success: true, message: "Transcripción iniciada." });
  } catch (err) {
    console.error("[TRANSCRIBE EXISTING]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------------------------------------------------
// GET /recordings/:id/transcription — Obtener transcripción
// ------------------------------------------------------------
const getTranscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transcription = await Transcription.findByRecording(id, userId);
    
    const Grabacion = require("./models/Grabacion");
    const recording = await Grabacion.findByIdAndUser(id, userId);

    if (!transcription) {
      return res.status(404).json({
        success: false,
        message: "Transcripción no encontrada.",
        status: "pending",
      });
    }

    return res.json({ 
      success: true, 
      transcription,
      markers: recording?.markers || [] 
    });
  } catch (err) {
    console.error("[GET TRANSCRIPTION]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------------------------------------------------
// PUT /transcriptions/:id — Editar contenido de transcripción
// ------------------------------------------------------------
const updateTranscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "El contenido no puede estar vacío.",
      });
    }

    const updated = await Transcription.update(id, userId, content.trim());
    return res.json({ success: true, transcription: updated });
  } catch (err) {
    console.error("[UPDATE TRANSCRIPTION]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------------------------------------------------
// Función interna: transcribir en background sin bloquear
// ------------------------------------------------------------
const transcribeInBackground = async (
  recordingId,
  userId,
  filePath,
  mimetype,
  buffer = null,
) => {
  try {
    // Verificar API KEY antes de procesar
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error(
        "DEEPGRAM_API_KEY no está configurada. Verifica el archivo .env",
      );
    }

    console.log(`\n🔄 [${recordingId}] Iniciando transcripción...`);
    console.log(`   - Usuario: ${userId}`);
    console.log(`   - Tipo MIME: ${mimetype}`);
    console.log(
      `   - Modo: ${buffer ? "Buffer directo" : `URL firmada (${filePath})`}`,
    );
    console.log(
      `   - API Key configurada: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
    );

    // Marcar como processing
    await Transcription.updateRecordingStatus(recordingId, "processing");

    let transcript;

    if (buffer) {
      // Audio recién subido — usar buffer directamente
      console.log(`   - Transcribiendo desde buffer (${buffer.length} bytes)...`);
      transcript = await deepgramService.transcribeFromBuffer(buffer, mimetype);
    } else {
      // Grabación existente — obtener URL firmada
      const signedUrl = await getSignedUrl(filePath);
      console.log(`   - Transcribiendo desde URL...`);
      transcript = await deepgramService.transcribeFromUrl(signedUrl);
    }

    // Guardar transcripción
    await Transcription.create({
      recording_id: recordingId,
      user_id: userId,
      content: transcript,
    });

    // Marcar como done
    await Transcription.updateRecordingStatus(recordingId, "done");

    console.log(
      `✅ [${recordingId}] Transcripción completada (${transcript.length} caracteres)\n`,
    );
  } catch (err) {
    console.error(`\n❌ Error transcribiendo ${recordingId}:`);
    console.error(`   Mensaje: ${err.message}`);
    console.error(`   Stack: ${err.stack}\n`);
    await Transcription.updateRecordingStatus(recordingId, "error").catch(
      () => {},
    );
  }
};

// Exportar la función para uso en endpoint.js al detener grabación
module.exports = {
  uploadAudioExternal,
  transcribeExisting,
  getTranscription,
  updateTranscription,
  transcribeInBackground,
  upload,
};