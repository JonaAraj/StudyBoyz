import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import recordingsService from "../../services/recordingsService";
import type { Recording } from "../../services/recordingsService";
import TranscriptionView from "./TranscriptionView";

// Materias disponibles para reasignar
const MATERIAS = [
  "Matemáticas",
  "Historia",
  "Biología",
  "Literatura",
  "Física",
  "Química",
  "Programación Avanzada",
  "Otra",
];

type RecientesProps = {
  onNavigateToRecording?: () => void;
};

interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export default function Recientes({ onNavigateToRecording }: RecientesProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de edición
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Recording | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [saving, setSaving] = useState(false);

  // Descarga
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Vista transcripción inline
  const [transcriptionRec, setTranscriptionRec] = useState<Recording | null>(
    null,
  );

  // Custom Alert Modal (Reemplaza a Alert nativo)
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({ visible: false, title: "", message: "", buttons: [] });

  const showAlert = (
    title: string,
    message: string,
    buttons?: AlertButton[],
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: "OK" }],
    });
  };
  const closeAlert = () =>
    setCustomAlert((prev) => ({ ...prev, visible: false }));

  const fetchRecordings = useCallback(async () => {
    const data = await recordingsService.getAll();
    setRecordings(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecordings();
  };

  // ── Eliminar ────────────────────────────────────────────────
  const handleDelete = (rec: Recording) => {
    showAlert(
      "Eliminar grabación",
      `¿Eliminar "${rec.title}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const res = await recordingsService.delete(rec.id, rec.file_path);
            if (res.success) {
              setRecordings((prev) => prev.filter((r) => r.id !== rec.id));
            } else {
              showAlert("Error", res.message);
            }
          },
        },
      ],
    );
  };

  // ── Descargar ───────────────────────────────────────────────
  const handleDownload = async (rec: Recording) => {
    setDownloadingId(rec.id);
    try {
      const url = await recordingsService.getDownloadUrl(rec.id);
      if (!url) {
        showAlert("Error", "No se pudo generar el enlace de descarga.");
        setDownloadingId(null);
        return;
      }

      if (Platform.OS === "web") {
        // Solución Web nativa (JS Blob y Anchor para forzar descarga)
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${rec.title}.m4a`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        // Solución Móvil (Expo FileSystem y Sharing)
        const FileSystem = await import("expo-file-system");
        const Sharing = await import("expo-sharing");

        const safeTitle = rec.title.replace(/[^a-z0-9]/gi, "_");
        const fileUri = `${FileSystem.documentDirectory}${safeTitle}.m4a`;

        const { uri } = await FileSystem.downloadAsync(url, fileUri);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            dialogTitle: `Descargar ${rec.title}`,
          });
        } else {
          showAlert(
            "Error",
            "No se puede compartir o guardar en este dispositivo.",
          );
        }
      }
    } catch (error) {
      showAlert("Error", "Ocurrió un problema al descargar el archivo.");
    }
    setDownloadingId(null);
  };

  // ── Editar ──────────────────────────────────────────────────
  const openEdit = (rec: Recording) => {
    setEditTarget(rec);
    setEditTitle(rec.title);
    // @ts-ignore - Soporte para la relación subjects(name) de Supabase
    setEditSubject(rec.subjects?.name || rec.subject || "");
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editTitle.trim()) {
      showAlert("Error", "El título no puede estar vacío.");
      return;
    }
    setSaving(true);
    const res = await recordingsService.update(editTarget.id, {
      title: editTitle.trim(),
      subject_id: editSubject,
    });
    setSaving(false);
    if (res.success) {
      setRecordings((prev) =>
        prev.map((r) => (r.id === editTarget.id ? res.recording : r)),
      );
      setEditModal(false);
    } else {
      showAlert("Error", res.message);
    }
  };

  // ── Transcripción ──────────────────────────────────────────
  if (transcriptionRec) {
    return (
      <TranscriptionView
        recordingId={transcriptionRec.id}
        recordingTitle={transcriptionRec.title}
        recordingSubject={
          (transcriptionRec as any).subjects?.name ||
          (transcriptionRec as any).subject ||
          ""
        }
        transcriptStatus={(transcriptionRec as any).transcript_status}
        onBack={() => setTranscriptionRec(null)}
      />
    );
  }

  // ── Render tarjeta ──────────────────────────────────────────
  const RecordingCard = ({ rec }: { rec: Recording }) => {
    const isDownloading = downloadingId === rec.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrapper}>
            <Ionicons name="mic" size={20} color="#007AFF" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {rec.title}
            </Text>
            <Text style={styles.cardSubject}>
              {/* @ts-ignore */}
              {rec.subjects?.name || rec.subject || "Sin materia"} ·{" "}
              {recordingsService.formatDate(rec.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#999" />
            <Text style={styles.metaText}>
              {recordingsService.formatDuration(rec.duration)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="folder-outline" size={13} color="#999" />
            <Text style={styles.metaText}>
              {recordingsService.formatSize(rec.size_bytes)}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setTranscriptionRec(rec)}
          >
            <Ionicons name="document-text-outline" size={16} color="#5856D6" />
            <Text style={[styles.actionText, { color: "#5856D6" }]}>Ver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openEdit(rec)}
          >
            <Ionicons name="pencil-outline" size={16} color="#007AFF" />
            <Text style={[styles.actionText, { color: "#007AFF" }]}>
              Editar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDownload(rec)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#34C759" />
            ) : (
              <Ionicons name="download-outline" size={16} color="#34C759" />
            )}
            <Text style={[styles.actionText, { color: "#34C759" }]}>
              Descargar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(rec)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={[styles.actionText, { color: "#FF3B30" }]}>
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Recientes</Text>
          <Text style={styles.headerSub}>
            {recordings.length} grabación{recordings.length !== 1 ? "es" : ""}
          </Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={onNavigateToRecording}>
          <Ionicons name="mic" size={18} color="#FFF" />
          <Text style={styles.newBtnText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : recordings.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="mic-off-outline" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>Sin grabaciones</Text>
          <Text style={styles.emptyText}>Tus grabaciones aparecerán aquí</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={onNavigateToRecording}
          >
            <Text style={styles.emptyBtnText}>Comenzar a grabar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
        >
          {recordings.map((rec) => (
            <RecordingCard key={rec.id} rec={rec} />
          ))}
        </ScrollView>
      )}

      {/* Modal de edición */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar grabación</Text>

            <Text style={styles.fieldLabel}>Título</Text>
            <TextInput
              style={styles.fieldInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Nombre de la grabación"
              placeholderTextColor="#bbb"
            />

            <Text style={styles.fieldLabel}>Materia</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
            >
              {MATERIAS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, editSubject === m && styles.chipActive]}
                  onPress={() => setEditSubject(m)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      editSubject === m && styles.chipTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Custom Alert (Cross-Platform) ─────────────────────────── */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{customAlert.title}</Text>
            <Text style={styles.alertMessage}>{customAlert.message}</Text>
            <View style={styles.alertButtonContainer}>
              {customAlert.buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.alertButton,
                    idx > 0 && styles.alertButtonBorder,
                  ]}
                  onPress={() => {
                    closeAlert();
                    if (btn.onPress) {
                      setTimeout(btn.onPress, 300);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.alertButtonText,
                      btn.style === "cancel" && styles.alertButtonTextCancel,
                      btn.style === "destructive" &&
                        styles.alertButtonTextDestructive,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  headerSub: { fontSize: 12, color: "#999", marginTop: 2 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBtnText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginTop: 8 },
  emptyText: { fontSize: 14, color: "#999" },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: { color: "#FFF", fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  cardSubject: { fontSize: 12, color: "#999", marginTop: 2 },
  cardMeta: { flexDirection: "row", gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#999" },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F8F8F8",
  },
  actionText: { fontSize: 12, fontWeight: "600" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  chipsScroll: { marginBottom: 24 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
    backgroundColor: "#fafafa",
  },
  chipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  chipText: { fontSize: 13, color: "#666" },
  chipTextActive: { color: "#FFF", fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  cancelBtnText: { color: "#666", fontWeight: "600" },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontWeight: "600" },

  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingTop: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    overflow: "hidden",
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    paddingHorizontal: 20,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    paddingHorizontal: 20,
    textAlign: "center",
  },
  alertButtonContainer: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  alertButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  alertButtonBorder: { borderLeftWidth: 1, borderLeftColor: "#E8E8E8" },
  alertButtonText: { fontSize: 16, fontWeight: "600", color: "#007AFF" },
  alertButtonTextCancel: { color: "#999", fontWeight: "400" },
  alertButtonTextDestructive: { color: "#FF3B30", fontWeight: "600" },
});
