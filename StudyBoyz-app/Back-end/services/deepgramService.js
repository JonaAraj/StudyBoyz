// ============================================================
// deepgramService.js — Integración con Deepgram SDK v5
// ============================================================

const { createClient } = require("@deepgram/sdk");

const deepgramService = {
  async transcribeFromUrl(audioUrl, language = "es") {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

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
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY); // ← aquí adentro

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
