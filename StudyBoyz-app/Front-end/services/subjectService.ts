// ============================================================
// services/subjectService.ts
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.7:3000/api'; // ← tu IP

export interface Subject {
  id: string;
  name: string;
  icon: string;
  user_id: number;
  created_at: string;
  recording_count: number;
}

export interface SubjectRecording {
  id: string;
  title: string;
  file_path: string;
  duration: number | null;
  size_bytes: number | null;
  subject: string | null;
  subject_id: string | null;
  created_at: string;
  transcript_status: 'pending' | 'processing' | 'done' | 'error';
}

const getToken = async () => AsyncStorage.getItem('@studyboyz_token');

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getToken();
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });
};

const subjectService = {
  async getAll(): Promise<Subject[]> {
    try {
      const res = await apiFetch('/subjects');
      const data = await res.json();
      return data.success ? data.subjects : [];
    } catch { return []; }
  },

  async create(name: string, icon: string = 'book-outline') {
    try {
      const res = await apiFetch('/subjects', {
        method: 'POST',
        body: JSON.stringify({ name, icon }),
      });
      return await res.json();
    } catch { return { success: false, message: 'Error de conexión.' }; }
  },

  async update(id: string, fields: { name?: string; icon?: string }) {
    try {
      const res = await apiFetch(`/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      return await res.json();
    } catch { return { success: false, message: 'Error de conexión.' }; }
  },

  async delete(id: string) {
    try {
      const res = await apiFetch(`/subjects/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch { return { success: false, message: 'Error de conexión.' }; }
  },

  async getRecordings(subjectId: string): Promise<{ subject: Subject | null; recordings: SubjectRecording[] }> {
    try {
      const res = await apiFetch(`/subjects/${subjectId}/recordings`);
      const data = await res.json();
      return data.success
        ? { subject: data.subject, recordings: data.recordings }
        : { subject: null, recordings: [] };
    } catch { return { subject: null, recordings: [] }; }
  },

  // Iconos disponibles para el selector
  availableIcons: [
    { name: 'calculator',     label: 'Matemáticas'   },
    { name: 'book',           label: 'Literatura'    },
    { name: 'leaf',           label: 'Biología'      },
    { name: 'flask',          label: 'Química'       },
    { name: 'planet',         label: 'Física'        },
    { name: 'globe',          label: 'Historia'      },
    { name: 'code-slash',     label: 'Programación'  },
    { name: 'musical-notes',  label: 'Música'        },
    { name: 'brush',          label: 'Arte'          },
    { name: 'fitness',        label: 'Deporte'       },
    { name: 'language',       label: 'Idiomas'       },
    { name: 'stats-chart',    label: 'Estadística'   },
    { name: 'megaphone',      label: 'Comunicación'  },
    { name: 'construct',      label: 'Ingeniería'    },
    { name: 'heart',          label: 'Medicina'      },
    { name: 'book-outline',   label: 'General'       },
  ] as { name: string; label: string }[],

  // Color de tarjeta por índice (8 colores que rotan)
  getCardColor(index: number): { bg: string; accent: string } {
    const palette = [
      { bg: '#EBF4FF', accent: '#007AFF' },
      { bg: '#FFF3E0', accent: '#FF9500' },
      { bg: '#E8FAF0', accent: '#34C759' },
      { bg: '#F3E8FF', accent: '#AF52DE' },
      { bg: '#FFE8E8', accent: '#FF3B30' },
      { bg: '#E8F9FF', accent: '#5AC8FA' },
      { bg: '#FFFBE0', accent: '#FFCC00' },
      { bg: '#F0F0F5', accent: '#8E8E93' },
    ];
    return palette[index % palette.length] || palette[0];
  },

  formatDuration(seconds: number | null): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  },
};

export default subjectService;