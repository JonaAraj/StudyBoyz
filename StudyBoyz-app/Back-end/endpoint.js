// ============================================================
// endpoint.js — Todas las rutas de StudyBoyz
// ============================================================

const express = require('express');
const router = express.Router();

const Usuario = require('./models/Usuario');
const Grabacion = require('./models/Grabacion');
const Materia = require('./models/Materia');
const Subject = require('./models/Subject');
const deepgramService = require('./services/deepgramService');
const multer = require('multer');
const Transcription = require('./models/Transcription');
const { generateToken, requireAuth } = require('./middleware/auth');
const { supabaseAdmin } = require('./config/supabase');
const { upload, transcribeInBackground } = require('./transcriptionEndPoints');

// ============================================================
// AUTH
// ============================================================

router.post('/auth/register', async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password)
      return res.status(400).json({ success: false, message: 'userName, email y password son requeridos.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });

    if (await Usuario.findByEmail(email))
      return res.status(409).json({ success: false, message: 'Ya existe una cuenta con ese email.' });
    if (await Usuario.findByUserName(userName))
      return res.status(409).json({ success: false, message: 'Ese nombre de usuario ya está en uso.' });

    const newUser = await Usuario.create({ userName, email, password });
    const token = generateToken({ id: newUser.id, userName: newUser.userName, email: newUser.Email });

    return res.status(201).json({
      success: true, message: '¡Cuenta creada exitosamente!', token,
      user: { id: newUser.id, userName: newUser.userName, email: newUser.Email, createdAt: newUser.created_at },
    });
  } catch (err) {
    console.error('[REGISTER]', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ success: false, message: 'Usuario/email y contraseña son requeridos.' });

    const isEmail = identifier.includes('@');
    const user = isEmail ? await Usuario.findByEmail(identifier) : await Usuario.findByUserName(identifier);

    if (!user || !(await Usuario.verifyPassword(password, user.password)))
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });

    const token = generateToken({ id: user.id, userName: user.userName, email: user.Email });
    return res.status(200).json({
      success: true, message: '¡Sesión iniciada!', token,
      user: { id: user.id, userName: user.userName, email: user.Email, createdAt: user.created_at },
    });
  } catch (err) {
    console.error('[LOGIN]', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    return res.json({
      success: true,
      user: { id: user.id, userName: user.userName, email: user.Email, createdAt: user.created_at },
    });
  } catch (err) {
    console.error('[ME]', err);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

router.post('/auth/logout', requireAuth, (req, res) => {
  return res.status(200).json({ success: true, message: 'Sesión cerrada correctamente.' });
});

// ============================================================
// RECORDINGS
// ============================================================

router.get('/recordings', requireAuth, async (req, res) => {
  try {
    const recordings = await Grabacion.findByUser(req.user.id);
    res.json({ success: true, recordings });
  } catch (err) {
    console.error('[RECORDINGS GET]', err);
    res.status(500).json({ success: false, message: 'Error al obtener grabaciones.' });
  }
});

// PUT /recordings/:id — actualiza título y/o materia (subject_id UUID)
router.put('/recordings/:id', requireAuth, async (req, res) => {
  try {
    const { title, subject_id } = req.body;

    // Validar que subject_id sea UUID válido si se envía
    if (subject_id !== undefined && subject_id !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(subject_id)) {
        return res.status(400).json({ success: false, message: 'subject_id inválido.' });
      }
      // Verificar que la materia pertenece al usuario
      const subject = await Subject.findByIdAndUser(subject_id, req.user.id);
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Materia no encontrada.' });
      }
    }

    const updated = await Grabacion.update(req.params.id, req.user.id, { title, subject_id });
    res.json({ success: true, recording: updated });
  } catch (err) {
    console.error('[RECORDINGS PUT]', err);
    res.status(500).json({ success: false, message: 'Error al actualizar grabación.' });
  }
});

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

// POST /recordings/save — guardar grabación recibiendo subject_id (UUID) directamente
router.post('/recordings/save', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No se recibió archivo de audio.' });

    const { title, subject_id, duration } = req.body;
    const userId = req.user.id;

    // Validar subject_id si se envió
    if (subject_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(subject_id)) {
        return res.status(400).json({ success: false, message: 'subject_id inválido.' });
      }
      const subject = await Subject.findByIdAndUser(subject_id, userId);
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Materia no encontrada.' });
      }
    }

    const ext = req.file.originalname.split('.').pop() || 'm4a';
    const filename = `${userId}_${Date.now()}.${ext}`;

    // Subir a Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('recordings')
      .upload(`audio/${filename}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (storageError) throw storageError;

    const filePath = `audio/${filename}`;

    // Insertar registro con subject_id directo — sin syncFromRecording
    const { data: recording, error: dbError } = await supabaseAdmin
      .from('recordings')
      .insert([{
        title: title || `Grabación ${new Date().toLocaleDateString('es-MX')}`,
        file_path: filePath,
        size_bytes: req.file.size,
        duration: duration ? parseInt(duration) : null,
        subject_id: subject_id || null,
        user_id: userId,
        transcript_status: 'pending',
      }])
      .select('*, subjects(name, icon)')
      .single();
    if (dbError) throw dbError;

    // Transcribir en background
    transcribeInBackground(recording.id, userId, filePath, req.file.mimetype, req.file.buffer);

    return res.status(201).json({
      success: true,
      message: 'Grabación guardada. Transcripción en proceso.',
      recording,
    });
  } catch (err) {
    console.error('[SAVE RECORDING]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /recordings/upload — subir audio externo con subject_id opcional
router.post('/recordings/upload', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No se recibió archivo.' });

    const { title, subject_id } = req.body;
    const userId = req.user.id;

    // Validar subject_id si se envió
    if (subject_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(subject_id)) {
        return res.status(400).json({ success: false, message: 'subject_id inválido.' });
      }
      const subject = await Subject.findByIdAndUser(subject_id, userId);
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Materia no encontrada.' });
      }
    }

    const filename = `${userId}_${Date.now()}_${req.file.originalname.replace(/\s/g, '_')}`;

    const { error: storageError } = await supabaseAdmin.storage
      .from('recordings')
      .upload(`uploads/${filename}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (storageError) throw storageError;

    const filePath = `uploads/${filename}`;

    const { data: recording, error: dbError } = await supabaseAdmin
      .from('recordings')
      .insert([{
        title: title || req.file.originalname,
        file_path: filePath,
        size_bytes: req.file.size,
        subject_id: subject_id || null,
        user_id: userId,
        transcript_status: 'pending',
      }])
      .select('*, subjects(name, icon)')
      .single();
    if (dbError) throw dbError;

    transcribeInBackground(recording.id, userId, filePath, req.file.mimetype, req.file.buffer);

    return res.status(201).json({
      success: true,
      message: 'Audio subido. Transcripción en proceso.',
      recording,
    });
  } catch (err) {
    console.error('[UPLOAD EXTERNAL]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /recordings/:id/transcribe — reintentar transcripción
router.post('/recordings/:id/transcribe', requireAuth, async (req, res) => {
  try {
    const recording = await Grabacion.findByIdAndUser(req.params.id, req.user.id);
    if (!recording) return res.status(404).json({ success: false, message: 'No encontrada.' });
    if (recording.transcript_status === 'processing')
      return res.status(409).json({ success: false, message: 'Ya está siendo transcrita.' });
    transcribeInBackground(recording.id, req.user.id, recording.file_path, 'audio/mp4');
    return res.json({ success: true, message: 'Transcripción iniciada.' });
  } catch (err) {
    console.error('[TRANSCRIBE]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /recordings/:id/transcription
router.get('/recordings/:id/transcription', requireAuth, async (req, res) => {
  try {
    const transcription = await Transcription.findByRecording(req.params.id, req.user.id);
    if (!transcription)
      return res.status(404).json({ success: false, message: 'Transcripción no encontrada.', status: 'pending' });
    return res.json({ success: true, transcription });
  } catch (err) {
    console.error('[GET TRANSCRIPTION]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /transcriptions/:id
router.put('/transcriptions/:id', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim())
      return res.status(400).json({ success: false, message: 'El contenido no puede estar vacío.' });
    const updated = await Transcription.update(req.params.id, req.user.id, content.trim());
    return res.json({ success: true, transcription: updated });
  } catch (err) {
    console.error('[UPDATE TRANSCRIPTION]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// MATERIAS (legacy — se mantiene por compatibilidad)
// ============================================================

router.get('/materias', requireAuth, async (req, res) => {
  try {
    const materias = await Materia.findByUser(req.user.id);
    res.json({ success: true, materias });
  } catch (err) {
    console.error('[MATERIAS GET]', err);
    res.status(500).json({ success: false, message: 'Error al obtener materias.' });
  }
});

// ============================================================
// SUBJECTS — tabla propia con CRUD completo
// ============================================================

// GET /subjects
router.get('/subjects', requireAuth, async (req, res) => {
  try {
    const subjects = await Subject.findByUser(req.user.id);
    res.json({ success: true, subjects });
  } catch (err) {
    console.error('[SUBJECTS GET]', err);
    res.status(500).json({ success: false, message: 'Error al obtener materias.' });
  }
});

// POST /subjects
router.post('/subjects', requireAuth, async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name?.trim())
      return res.status(400).json({ success: false, message: 'El nombre es requerido.' });

    const existing = await Subject.findByNameAndUser(name.trim(), req.user.id);
    if (existing)
      return res.status(409).json({ success: false, message: 'Ya existe una materia con ese nombre.' });

    const subject = await Subject.create({
      name: name.trim(),
      icon: icon || 'book-outline',
      user_id: req.user.id,
    });
    res.status(201).json({ success: true, subject });
  } catch (err) {
    console.error('[SUBJECTS POST]', err);
    res.status(500).json({ success: false, message: 'Error al crear materia.' });
  }
});

// PUT /subjects/:id
router.put('/subjects/:id', requireAuth, async (req, res) => {
  try {
    const { name, icon } = req.body;
    const updated = await Subject.update(req.params.id, req.user.id, { name, icon });
    res.json({ success: true, subject: updated });
  } catch (err) {
    console.error('[SUBJECTS PUT]', err);
    res.status(500).json({ success: false, message: 'Error al actualizar materia.' });
  }
});

// DELETE /subjects/:id
router.delete('/subjects/:id', requireAuth, async (req, res) => {
  try {
    await Subject.delete(req.params.id, req.user.id);
    res.json({ success: true, message: 'Materia eliminada.' });
  } catch (err) {
    console.error('[SUBJECTS DELETE]', err);
    res.status(500).json({ success: false, message: 'Error al eliminar materia.' });
  }
});

// GET /subjects/:id/recordings
router.get('/subjects/:id/recordings', requireAuth, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUser(req.params.id, req.user.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Materia no encontrada.' });
    const recordings = await Subject.getRecordings(req.params.id, req.user.id);
    res.json({ success: true, subject, recordings });
  } catch (err) {
    console.error('[SUBJECTS RECORDINGS]', err);
    res.status(500).json({ success: false, message: 'Error al obtener grabaciones.' });
  }
});

module.exports = router;