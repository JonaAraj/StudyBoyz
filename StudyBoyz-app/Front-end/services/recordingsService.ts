import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Recording {
  id: string;
  title: string;
  file_path: string;
  duration: number | null;
  size_bytes: number | null;
  subject: string | null;
  created_at: string;
  user_id: number;
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

const recordingsService = {
  async getAll(): Promise<Recording[]> {
    try {
      const res = await apiFetch('/recordings');
      const data = await res.json();
      return data.success ? data.recordings : [];
    } catch {
      return [];
    }
  },

  async update(id: string, fields: { title?: string; subject?: string }) {
    try {
      const res = await apiFetch(`/recordings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Error de conexión.' };
    }
  },

  async delete(id: string, filePath: string) {
    try {
      const res = await apiFetch(`/recordings/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ filePath }),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Error de conexión.' };
    }
  },

  async getDownloadUrl(id: string): Promise<string | null> {
    try {
      const res = await apiFetch(`/recordings/${id}/download`);
      const data = await res.json();
      return data.success ? data.url : null;
    } catch {
      return null;
    }
  },

  formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  },
};

export default recordingsService;