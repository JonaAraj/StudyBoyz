const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY",
  );
}

// Cliente público — para operaciones del lado del usuario
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente de servicio — para operaciones admin (sin restricciones RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports = { supabase, supabaseAdmin };
