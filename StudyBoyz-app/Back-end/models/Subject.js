// ============================================================
// models/Subject.js
// ============================================================
const { supabaseAdmin } = require('../config/supabase');

const Subject = {
  async findByUser(userId) {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*, recordings(count)')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      recording_count: s.recordings?.[0]?.count ?? 0,
    }));
  },

  async findByIdAndUser(id, userId) {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async findByNameAndUser(name, userId) {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('name', name)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async create({ name, icon = 'book-outline', user_id }) {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert([{ name, icon, user_id }])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, userId, { name, icon }) {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    if (name) {
      await supabaseAdmin
        .from('recordings')
        .update({ subject: name })
        .eq('subject_id', id)
        .eq('user_id', userId);
    }
    return data;
  },

  async delete(id, userId) {
    await supabaseAdmin
      .from('recordings')
      .update({ subject_id: null, subject: null })
      .eq('subject_id', id)
      .eq('user_id', userId);
    const { error } = await supabaseAdmin
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  },

  async getRecordings(subjectId, userId) {
    const { data, error } = await supabaseAdmin
      .from('recordings')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async syncFromRecording(name, userId) {
    if (!name) return null;
    let subject = await this.findByNameAndUser(name, userId);
    if (!subject) subject = await this.create({ name, user_id: userId });
    return subject.id;
  },
};

module.exports = Subject;