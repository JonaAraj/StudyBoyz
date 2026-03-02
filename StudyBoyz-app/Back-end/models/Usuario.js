// ============================================================
// Usuario.js — Modelo de Usuario
// Encapsula todas las queries de la tabla "Users"
// ============================================================

const { supabaseAdmin } = require("../config/supabase");
const bcrypt = require("bcryptjs");

const TABLE = "Users";

const Usuario = {
  /**
   * Busca un usuario por su email
   * @param {string} email
   */
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("Email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return data || null;
  },

  /**
   * Busca un usuario por su userName
   * @param {string} userName
   */
  async findByUserName(userName) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("userName", userName)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  },

  /**
   * Busca un usuario por id
   * @param {number} id
   */
  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("id, userName, Email, created_at")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  },

  /**
   * Crea un nuevo usuario con la contraseña hasheada
   * @param {{ userName: string, email: string, password: string }}
   */
  async create({ userName, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([
        {
          userName,
          Email: email,
          password: hashedPassword,
        },
      ])
      .select("id, userName, Email, created_at")
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Verifica si la contraseña en texto plano coincide con el hash guardado
   * @param {string} plainPassword
   * @param {string} hashedPassword
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

module.exports = Usuario;
