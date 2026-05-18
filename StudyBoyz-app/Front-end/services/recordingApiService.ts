// ============================================================
// recordingApiService.ts — Servicio para grabaciones (Front-end)
// Guardar audio grabado, subir externo, obtener materias (como Subject[])
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import subjectService, { type Subject } from "./subjectService";
import API_BASE_URL from "./apiConfig";

const getToken = async () => AsyncStorage.getItem("@studyboyz_token");

interface SaveRecordingParams {
  uri: string;
  blob?: Blob; // solo web
  mimeType: string;
  durationMillis: number;
  title: string;
  subjectId: string; // UUID de la materia (antes era subject: string)
  markers?: number[]; // Puntos importantes marcados durante la grabación
}

interface UploadExternalParams {
  uri: string;
  name: string;
  mimeType: string;
  title?: string;
  subjectId?: string; // UUID opcional
  blob?: Blob; // Añadido para mejor soporte en Web
}

const recordingApiService = {
  /**
   * Obtiene la lista de materias del usuario como objetos Subject completos,
   * con id (UUID) y nombre — para poder mostrar chips y enviar subject_id al guardar.
   */
  async getSubjects(): Promise<Subject[]> {
    return subjectService.getAll();
  },

  /**
   * Guarda una grabación en el back-end enviando subject_id (UUID).
   * Funciona tanto en móvil (uri local) como en web (Blob).
   */
  async saveRecording(params: SaveRecordingParams) {
    try {
      const token = await getToken();
      const formData = new FormData();

      if (Platform.OS === "web" && params.blob) {
        const ext = params.mimeType.includes("webm") ? "webm" : "ogg";
        formData.append("audio", params.blob, `recording.${ext}`);
      } else {
        formData.append("audio", {
          uri: params.uri,
          name: "recording.m4a",
          type: params.mimeType || "audio/m4a",
        } as any);
      }

      formData.append("title", params.title);
      if (params.subjectId) {
        formData.append("subject_id", params.subjectId);
      }
      if (params.markers && params.markers.length > 0) {
        formData.append("markers", JSON.stringify(params.markers));
      }
      formData.append(
        "duration",
        Math.floor(params.durationMillis / 1000).toString()
      );

      const res = await fetch(`${API_BASE_URL}/recordings/save`, {
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
        message: err.message || "Error al guardar la grabación.",
      };
    }
  },

  /**
   * Sube un audio externo desde el dispositivo.
   */
  async uploadExternal(params: UploadExternalParams) {
    try {
      const token = await getToken();
      const formData = new FormData();

      // Fallback para asegurar el mimeType correcto (muy útil para .ogg y otros formatos si el sistema no lo detecta)
      let finalMimeType = params.mimeType;
      if (!finalMimeType || finalMimeType === 'application/octet-stream') {
        const lowerName = params.name.toLowerCase();
        if (lowerName.endsWith('.ogg')) finalMimeType = 'audio/ogg';
        else if (lowerName.endsWith('.m4a')) finalMimeType = 'audio/m4a';
        else if (lowerName.endsWith('.mp3')) finalMimeType = 'audio/mpeg';
        else if (lowerName.endsWith('.wav')) finalMimeType = 'audio/wav';
        else if (lowerName.endsWith('.mp4')) finalMimeType = 'audio/mp4';
        else if (lowerName.endsWith('.webm')) finalMimeType = 'audio/webm';
      }

      // Soporte cruzado para Mobile y Web
      if (Platform.OS === "web") {
        if (params.blob) {
          formData.append("audio", params.blob, params.name);
        } else {
          // Si en web solo enviaron la URI (blob:http://...), intentamos transformarlo a un Blob real
          const response = await fetch(params.uri);
          const blob = await response.blob();
          formData.append("audio", blob, params.name);
        }
      } else {
        formData.append("audio", {
          uri: params.uri,
          name: params.name,
          type: finalMimeType,
        } as any);
      }

      if (params.title) formData.append("title", params.title);
      if (params.subjectId) formData.append("subject_id", params.subjectId);

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