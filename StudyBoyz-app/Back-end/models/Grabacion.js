const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'recordings';
const BUCKET = 'recordings';

const Grabacion = {
  async findByUser(userId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*, subjects(name, icon)')   // join para traer nombre e ícono de la materia
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findByIdAndUser(id, userId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*, subjects(name, icon)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * Actualiza título y/o materia de una grabación.
   * Acepta subject_id (UUID) — si se pasa null desvincula la materia.
   */
  async update(id, userId, { title, subject_id }) {
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (subject_id !== undefined) updates.subject_id = subject_id;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, subjects(name, icon)')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id, userId, filePath) {
    const recording = await this.findByIdAndUser(id, userId);
    if (!recording) throw new Error('Grabación no encontrada o sin permiso.');

    if (filePath) {
      // El filePath puede venir como ruta completa — extraemos solo el path relativo al bucket
      const pathInBucket = filePath.includes('audio/')
        ? filePath.substring(filePath.indexOf('audio/'))
        : filePath.split('/').pop();
      await supabaseAdmin.storage.from(BUCKET).remove([pathInBucket]);
    }

    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  },

  async getDownloadUrl(filePath) {
    // Normalizar: si viene la URL completa, extraer solo el path relativo
    const pathInBucket = filePath.includes('audio/')
      ? filePath.substring(filePath.indexOf('audio/'))
      : filePath.split('/').pop();
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(pathInBucket, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
};

module.exports = Grabacion;