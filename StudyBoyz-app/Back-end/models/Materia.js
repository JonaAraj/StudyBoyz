// ============================================================
// Materia.js — Modelo de Materias
// Obtiene las materias únicas del usuario desde la tabla recordings
// ============================================================

const { supabaseAdmin } = require("../config/supabase");

const Materia = {
  /**
   * Obtiene todas las materias únicas que tiene un usuario
   * basado en el campo subject de sus grabaciones
   * @param {number} userId
   * @returns {string[]} lista de materias
   */
  async findByUser(userId) {
    const { data, error } = await supabaseAdmin
      .from("subjects")
      .select("name")
      .eq("user_id", userId);

    if (error) throw error;

    // Extraer valores únicos y ordenar
    const unique = [
      ...new Set(data.map((r) => r.name).filter(Boolean)),
    ].sort();
    return unique;
  },
};

module.exports = Materia;
