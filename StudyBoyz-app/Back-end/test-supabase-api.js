require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan las variables SUPABASE_URL y/o llave en tu archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log(`Intentando conectar a: ${supabaseUrl}`);
  try {
    // Intentamos traer solo 1 usuario de tu nueva tabla "users"
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
      console.error("❌ Error de Supabase (revisa tus llaves o el nombre de la tabla):", error.message);
      return;
    }

    console.log("✅ ¡Conexión REST API exitosa! La base de datos responde perfectamente.");
    console.log("📝 Datos obtenidos (arreglo vacío si no hay usuarios aún):", data);
  } catch (err) {
    console.error("❌ Error general de conexión:", err.message);
  }
}

testSupabaseConnection();