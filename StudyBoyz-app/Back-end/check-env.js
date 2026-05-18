// ============================================================
// check-env.js — Verificar que las variables de entorno se cargan
// Ejecuta: node check-env.js
// ============================================================

require("dotenv").config();

console.log("\n========== VERIFICACIÓN DE VARIABLES DE ENTORNO ==========\n");

const requiredEnvVars = [
  "DEEPGRAM_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "EXPO_API_BASE_URL",
];

let allPresent = true;

requiredEnvVars.forEach((key) => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ ${key}: NO DEFINIDA`);
    allPresent = false;
  } else {
    // Mostrar primeros y últimos caracteres para seguridad
    const masked =
      value.length > 10
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value;
    console.log(`✅ ${key}: ${masked}`);
  }
});

console.log("\n" + "=".repeat(60) + "\n");

if (!allPresent) {
  console.error(
    "⚠️  PROBLEMA: Algunas variables de entorno están faltando.\n",
  );
  console.error("Verifica que:");
  console.error("1. El archivo .env existe en: Back-end/.env");
  console.error("2. Ejecutas 'node' desde la carpeta Back-end");
  console.error("3. Las claves están correctamente definidas en .env\n");
  process.exit(1);
} else {
  console.log("✅ Todas las variables de entorno están correctamente cargadas.\n");
  process.exit(0);
}
