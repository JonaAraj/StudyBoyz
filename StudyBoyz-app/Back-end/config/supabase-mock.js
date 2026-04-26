// ============================================================
// supabase-mock.js — Supabase Mock para desarrollo sin internet
// ============================================================

/**
 * 🚀 ESTA ES UNA SOLUCIÓN TEMPORAL PARA DESARROLLO
 * Cuando tengas acceso a internet, usa el cliente real de Supabase
 * 
 * Uso: Reemplaza la importación en tus archivos:
 * const { supabase } = require('./config/supabase-mock');
 */

class MockSupabase {
  constructor(url, anonKey) {
    this.url = url;
    this.auth = {};
    console.log("📦 [MOCK] Supabase Mock inicializado para desarrollo local");
  }

  auth = {
    signUp: async (credentials) => {
      console.log("[MOCK AUTH] Sign Up:", credentials.email);
      return {
        data: {
          user: {
            id: "mock-user-" + Math.random().toString(36).substr(2, 9),
            email: credentials.email,
            user_metadata: {},
          },
          session: {
            access_token: "mock-token-" + Math.random().toString(36).substr(2, 9),
            refresh_token: "mock-refresh-token",
            expires_in: 3600,
          },
        },
        error: null,
      };
    },

    signIn: async (credentials) => {
      console.log("[MOCK AUTH] Sign In:", credentials.email);
      return {
        data: {
          user: {
            id: "mock-user-123",
            email: credentials.email,
          },
          session: {
            access_token: "mock-token-abc123",
            refresh_token: "mock-refresh-token",
            expires_in: 3600,
          },
        },
        error: null,
      };
    },

    signOut: async () => {
      console.log("[MOCK AUTH] Sign Out");
      return { error: null };
    },

    getSession: async () => {
      console.log("[MOCK AUTH] Get Session");
      return {
        data: {
          session: null,
        },
        error: null,
      };
    },
  };

  from = (table) => {
    return {
      select: (columns) => ({
        eq: (field, value) => ({
          then: (callback) => {
            console.log(`[MOCK DB] SELECT ${columns} FROM ${table} WHERE ${field} = ${value}`);
            callback({
              data: [],
              error: null,
            });
          },
        }),
        then: (callback) => {
          console.log(`[MOCK DB] SELECT ${columns} FROM ${table}`);
          callback({
            data: [],
            error: null,
          });
          return Promise.resolve({
            data: [],
            error: null,
          });
        },
      }),
      insert: (data) => ({
        then: (callback) => {
          console.log(`[MOCK DB] INSERT INTO ${table}:`, data);
          callback({
            data: [{ id: "mock-id-" + Math.random().toString(36).substr(2, 9), ...data }],
            error: null,
          });
          return Promise.resolve({
            data: [{ id: "mock-id-" + Math.random().toString(36).substr(2, 9), ...data }],
            error: null,
          });
        },
      }),
      update: (data) => ({
        eq: (field, value) => ({
          then: (callback) => {
            console.log(`[MOCK DB] UPDATE ${table} SET`, data, `WHERE ${field} = ${value}`);
            callback({
              data: [data],
              error: null,
            });
          },
        }),
      }),
      delete: () => ({
        eq: (field, value) => ({
          then: (callback) => {
            console.log(`[MOCK DB] DELETE FROM ${table} WHERE ${field} = ${value}`);
            callback({
              data: null,
              error: null,
            });
          },
        }),
      }),
    };
  };
}

module.exports = {
  createClient: (url, key) => new MockSupabase(url, key),
};
