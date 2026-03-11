// ============================================================
// transcriptionService.ts — Servicio de Transcripciones (Front-end)
// Maneja consulta, edición y descarga en PDF
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = 'http://192.168.1.7:3000/api';

export interface Transcription {
  id: string;
  recording_id: string;
  user_id: number;
  content: string;
  edited: boolean;
  created_at: string;
}

const getToken = async () => AsyncStorage.getItem("@studyboyz_token");

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getToken();
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });
};

const transcriptionService = {
  /**
   * Obtiene la transcripción de una grabación
   */
  async getByRecording(recordingId: string): Promise<{
    transcription: Transcription | null;
    status: string;
  }> {
    try {
      const res = await apiFetch(`/recordings/${recordingId}/transcription`);
      const data = await res.json();
      if (data.success) {
        return { transcription: data.transcription, status: "done" };
      }
      return { transcription: null, status: data.status || "pending" };
    } catch {
      return { transcription: null, status: "error" };
    }
  },

  /**
   * Actualiza el contenido de una transcripción (edición manual)
   */
  async update(transcriptionId: string, content: string) {
    try {
      const res = await apiFetch(`/transcriptions/${transcriptionId}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
      return await res.json();
    } catch {
      return { success: false, message: "Error de conexión." };
    }
  },

  /**
   * Solicita transcripción de una grabación existente
   */
  async requestTranscription(recordingId: string) {
    try {
      const res = await apiFetch(`/recordings/${recordingId}/transcribe`, {
        method: "POST",
      });
      return await res.json();
    } catch {
      return { success: false, message: "Error de conexión." };
    }
  },

  /**
   * Sube un audio externo desde el dispositivo
   * @param fileUri - URI del archivo local
   * @param fileName - nombre del archivo
   * @param mimeType - tipo MIME
   * @param title - título de la grabación
   * @param subject - materia
   */
  async uploadExternalAudio(
    fileUri: string,
    fileName: string,
    mimeType: string,
    title?: string,
    subject?: string,
  ) {
    try {
      const token = await getToken();
      const formData = new FormData();

      formData.append("audio", {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      if (title) formData.append("title", title);
      if (subject) formData.append("subject", subject);

      const res = await fetch(`${API_BASE_URL}/recordings/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // NO poner Content-Type aquí — fetch lo setea automático con boundary para multipart
        },
        body: formData,
      });

      return await res.json();
    } catch {
      return { success: false, message: "Error al subir el archivo." };
    }
  },

  /**
   * Genera y descarga un PDF de la transcripción
   * Usa la API de impresión de Expo
   */
  async downloadAsPdf(transcription: Transcription, recordingTitle: string) {
    try {
      // Importación dinámica para evitar errores si expo-print no está instalado
      const Print = await import("expo-print");
      const Sharing = await import("expo-sharing");

      const date = new Date(transcription.created_at).toLocaleDateString(
        "es-MX",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        },
      );

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Georgia, serif;
                max-width: 800px;
                margin: 40px auto;
                padding: 0 40px;
                color: #1a1a1a;
                line-height: 1.8;
              }
              .header {
                border-bottom: 2px solid #007AFF;
                padding-bottom: 16px;
                margin-bottom: 32px;
              }
              .app-name {
                font-size: 12px;
                color: #007AFF;
                font-weight: bold;
                letter-spacing: 2px;
                text-transform: uppercase;
              }
              h1 {
                font-size: 26px;
                margin: 8px 0 4px;
                color: #1a1a1a;
              }
              .meta {
                font-size: 13px;
                color: #666;
              }
              .badge {
                display: inline-block;
                background: #e8f4ff;
                color: #007AFF;
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 12px;
                margin-left: 8px;
              }
              .content {
                font-size: 16px;
                white-space: pre-wrap;
                text-align: justify;
              }
              .footer {
                margin-top: 48px;
                padding-top: 16px;
                border-top: 1px solid #eee;
                font-size: 11px;
                color: #aaa;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="app-name">StudyBoyz</div>
              <h1>${recordingTitle}</h1>
              <div class="meta">
                ${date}
                ${transcription.edited ? '<span class="badge">Editado</span>' : ""}
              </div>
            </div>
            <div class="content">${transcription.content}</div>
            <div class="footer">
              Generado por StudyBoyz · ${new Date().toLocaleDateString("es-MX")}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Transcripción — ${recordingTitle}`,
          UTI: "com.adobe.pdf",
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};

export default transcriptionService;
