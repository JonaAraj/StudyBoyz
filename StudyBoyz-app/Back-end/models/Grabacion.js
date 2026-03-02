const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'recordings';
const BUCKET = 'recordings';

const Grabacion = {
  async findByUser(userId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findByIdAndUser(id, userId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async update(id, userId, { title, subject }) {
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (subject !== undefined) updates.subject = subject;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id, userId, filePath) {
    const recording = await this.findByIdAndUser(id, userId);
    if (!recording) throw new Error('Grabación no encontrada o sin permiso.');

    if (filePath) {
      const fileName = filePath.split('/').pop();
      await supabaseAdmin.storage.from(BUCKET).remove([fileName]);
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
    const fileName = filePath.split('/').pop();
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(fileName, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
};

module.exports = Grabacion;