// ============================================================
// recordingApiService.ts — Servicio para grabaciones (Front-end)
// Guardar audio grabado, subir externo, obtener materias
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const API_BASE_URL = "http://localhost:3000/api";

const getToken = async () => AsyncStorage.getItem("@studyboyz_token");

interface SaveRecordingParams {
  uri: string;
  blob?: Blob; // solo web
  mimeType: string;
  durationMillis: number;
  title: string;
  subject: string;
}

interface UploadExternalParams {
  uri: string;
  name: string;
  mimeType: string;
  title?: string;
  subject?: string;
}

const recordingApiService = {
  /**
   * Obtiene la lista de materias únicas del usuario
   */
  async getMaterias(): Promise<string[]> {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/materias`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.success ? data.materias : [];
    } catch {
      return [];
    }
  },

  /**
   * Guarda una grabación en el back-end
   * Funciona tanto en móvil (uri local) como en web (Blob)
   */
  async saveRecording(params: SaveRecordingParams) {
    try {
      const token = await getToken();
      const formData = new FormData();

      if (Platform.OS === "web" && params.blob) {
        // Web: usar Blob directamente
        const ext = params.mimeType.includes("webm") ? "webm" : "ogg";
        formData.append("audio", params.blob, `recording.${ext}`);
      } else {
        // Móvil: usar URI del sistema de archivos
        formData.append("audio", {
          uri: params.uri,
          name: "recording.m4a",
          type: params.mimeType || "audio/m4a",
        } as any);
      }

      formData.append("title", params.title);
      formData.append("subject", params.subject);
      formData.append(
        "duration",
        Math.floor(params.durationMillis / 1000).toString(),
      );

      const res = await fetch(`${API_BASE_URL}/recordings/save`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // NO agregar Content-Type — fetch lo pone automático con boundary
        },
        body: formData,
      });

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Error al guardar la grabación.",
      };
    }
  },

  /**
   * Sube un audio externo desde el dispositivo
   */
  async uploadExternal(params: UploadExternalParams) {
    try {
      const token = await getToken();
      const formData = new FormData();

      formData.append("audio", {
        uri: params.uri,
        name: params.name,
        type: params.mimeType,
      } as any);

      if (params.title) formData.append("title", params.title);
      if (params.subject) formData.append("subject", params.subject);

      const res = await fetch(`${API_BASE_URL}/recordings/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Error al subir el archivo.",
      };
    }
  },
};

export default recordingApiService;
