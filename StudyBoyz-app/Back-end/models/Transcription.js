// ============================================================
// Transcription.js — Modelo de Transcripciones
// Encapsula todas las queries de la tabla "transcriptions"
// ============================================================

const { supabaseAdmin } = require("../config/supabase");

const TABLE = "transcriptions";
const RECORDINGS_TABLE = "recordings";

const Transcription = {
  /**
   * Busca la transcripción de una grabación específica
   * @param {string} recordingId - uuid
   * @param {number} userId
   */
  async findByRecording(recordingId, userId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("recording_id", recordingId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  },

  /**
   * Crea una nueva transcripción
   * @param {{ recording_id, user_id, content }}
   */
  async create({ recording_id, user_id, content }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{ recording_id, user_id, content, edited: false }])
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Actualiza el contenido de una transcripción (edición manual)
   * @param {string} id - uuid
   * @param {number} userId
   * @param {string} content
   */
  async update(id, userId, content) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ content, edited: true })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Actualiza el transcript_status de una grabación
   * @param {string} recordingId
   * @param {'pending'|'processing'|'done'|'error'} status
   */
  async updateRecordingStatus(recordingId, status) {
    const { error } = await supabaseAdmin
      .from(RECORDINGS_TABLE)
      .update({ transcript_status: status })
      .eq("id", recordingId);

    if (error) throw error;
  },
};

module.exports = Transcription;
