// ============================================================
// deepgramService.js — Integración con Deepgram SDK v5
// ============================================================

const { createClient } = require("@deepgram/sdk");

// Verificar que la API key existe al cargar el servicio
if (!process.env.DEEPGRAM_API_KEY) {
  console.error(
    "❌ CRÍTICO: DEEPGRAM_API_KEY no está definida en variables de entorno.",
  );
  console.error(
    "   Verifica que el archivo .env exista en Back-end/ y contenga DEEPGRAM_API_KEY.",
  );
  console.error("   Las transcripciones fallarán sin esta API key.");
}

const deepgramService = {
  async transcribeFromUrl(audioUrl, language = "es") {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error(
        "DEEPGRAM_API_KEY no definida. Verifica variables de entorno.",
      );
    }

    console.log(
      `📝 Transcribiendo desde URL con Deepgram (idioma: ${language})...`,
    );
    const deepgram = createClient(apiKey);

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: audioUrl },
      { model: "nova-2", language, punctuate: true, smart_format: true },
    );

    if (error) throw new Error(`Deepgram error: ${error.message}`);
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) throw new Error("No se obtuvo texto de la transcripción.");
    return transcript;
  },

  async transcribeFromBuffer(buffer, mimetype = "audio/m4a", language = "es") {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error(
        "DEEPGRAM_API_KEY no definida. Verifica variables de entorno.",
      );
    }

    console.log(
      `📝 Transcribiendo desde buffer (${mimetype}, idioma: ${language})...`,
    );
    const deepgram = createClient(apiKey);

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        mimetype,
        model: "nova-2",
        language,
        punctuate: true,
        smart_format: true,
      },
    );

    if (error) throw new Error(`Deepgram error: ${error.message}`);
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) throw new Error("No se obtuvo texto de la transcripción.");
    return transcript;
  },
};

module.exports = deepgramService;
