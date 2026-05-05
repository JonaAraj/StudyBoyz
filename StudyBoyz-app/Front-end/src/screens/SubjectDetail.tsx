// ============================================================
// screens/SubjectDetail.tsx
// Muestra las grabaciones de una materia con opciones:
// editar título, eliminar, descargar, ver transcripción
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import subjectService, {
  type Subject,
  type SubjectRecording,
} from "../../services/subjectService";
import recordingsService from "../../services/recordingsService";
import TranscriptionView from "./TranscriptionView";

type Props = {
  subject: Subject;
  subjectIndex: number;
  onBack: () => void;
  onNavigateToRecording?: () => void;
};

interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pendiente", color: "#8E8E93", bg: "#F2F2F7" },
  processing: { label: "Procesando", color: "#FF9500", bg: "#FFF3E0" },
  done: { label: "Transcrito", color: "#34C759", bg: "#E8FAF0" },
  error: { label: "Error", color: "#FF3B30", bg: "#FFE8E8" },
};

const getStatus = (s: string | null) =>
  statusConfig[s ?? "pending"] ?? statusConfig.pending;

export default function SubjectDetail({
  subject,
  subjectIndex,
  onBack,
  onNavigateToRecording,
}: Props) {
  const { accent, bg } = subjectService.getCardColor(subjectIndex);

  const [recordings, setRecordings] = useState<SubjectRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal editar grabación
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SubjectRecording | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Descarga
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Vista transcripción inline
  const [transcriptionRec, setTranscriptionRec] =
    useState<SubjectRecording | null>(null);

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

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const { recordings: recs } = await subjectService.getRecordings(
        subject.id,
      );
      setRecordings(recs);
      setLoading(false);
      setRefreshing(false);
    },
    [subject.id],
  );

  useEffect(() => {
    load();
  }, [load]);

  // ── Eliminar ───────────────────────────────────────────────
  const handleDelete = (rec: SubjectRecording) => {
    showAlert(
      "Eliminar grabación",
      `¿Seguro que deseas eliminar "${rec.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const res = await recordingsService.delete(
              rec.id,
              rec.file_path ?? "",
            );
            if (res.success) {
              setRecordings((prev) => prev.filter((r) => r.id !== rec.id));
            } else {
              showAlert("Error", res.message ?? "No se pudo eliminar.");
            }
          },
        },
      ],
    );
  };

  // ── Editar ─────────────────────────────────────────────────
  const openEdit = (rec: SubjectRecording) => {
    setEditTarget(rec);
    setEditTitle(rec.title);
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editTitle.trim()) return;
    setSaving(true);
    const res = await recordingsService.update(editTarget.id, {
      title: editTitle.trim(),
    });
    setSaving(false);
    if (res.success) {
      setRecordings((prev) =>
        prev.map((r) =>
          r.id === editTarget.id ? { ...r, title: editTitle.trim() } : r,
        ),
      );
      setEditModal(false);
    } else {
      showAlert("Error", res.message ?? "No se pudo actualizar.");
    }
  };

  // ── Descargar ──────────────────────────────────────────────
  const handleDownload = async (rec: SubjectRecording) => {
    setDownloadingId(rec.id);
    try {
      const url = await recordingsService.getDownloadUrl(rec.id);
      if (!url) {
        showAlert("Error", "No se pudo obtener el enlace de descarga.");
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

  // ── Transcripción ──────────────────────────────────────────
  if (transcriptionRec) {
    return (
      <TranscriptionView
        recordingId={transcriptionRec.id}
        recordingTitle={transcriptionRec.title}
        recordingSubject={subject.name}
        transcriptStatus={transcriptionRec.transcript_status}
        onBack={() => setTranscriptionRec(null)}
      />
    );
  }

  // ── Render item ────────────────────────────────────────────
  const renderItem = ({ item }: { item: SubjectRecording }) => {
    const status = getStatus(item.transcript_status);
    const isDownloading = downloadingId === item.id;

    return (
      <View style={styles.recCard}>
        {/* Cabecera */}
        <View style={styles.recHeader}>
          <View style={[styles.recIconWrap, { backgroundColor: bg }]}>
            <Ionicons name="mic" size={18} color={accent} />
          </View>
          <View style={styles.recInfo}>
            <Text style={styles.recTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.recMeta}>
              {item.duration
                ? subjectService.formatDuration(item.duration)
                : "--"}
              {" · "}
              {subjectService.formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        {/* Footer: badge + acciones */}
        <View style={styles.recFooter}>
          {/* Badge estado */}
          <View style={[styles.badge, { backgroundColor: status?.bg }]}>
            <Text style={[styles.badgeText, { color: status?.color }]}>
              {status?.label}
            </Text>
          </View>

          {/* Botones de acción */}
          <View style={styles.recActions}>
            {/* Ver transcripción */}
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: bg }]}
              onPress={() => setTranscriptionRec(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="document-text-outline" size={14} color={accent} />
              <Text style={[styles.actionChipText, { color: accent }]}>
                Ver
              </Text>
            </TouchableOpacity>

            {/* Editar */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => openEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={18} color="#8E8E93" />
            </TouchableOpacity>

            {/* Eliminar */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={accent} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: accent + "22" }]}>
            <Ionicons
              name={(subject.icon as any) || "book-outline"}
              size={28}
              color={accent}
            />
          </View>
          <Text style={[styles.headerTitle, { color: accent }]}>
            {subject.name}
          </Text>
          <Text style={styles.headerCount}>
            {recordings.length} grabación{recordings.length !== 1 ? "es" : ""}
          </Text>
        </View>
        {onNavigateToRecording && (
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: accent }]}
            onPress={onNavigateToRecording}
          >
            <Ionicons name="mic" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={styles.loadingText}>Cargando grabaciones...</Text>
        </View>
      ) : recordings.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="mic-off-outline" size={56} color="#D0D0D0" />
          <Text style={styles.emptyTitle}>Sin grabaciones</Text>
          <Text style={styles.emptyText}>
            Graba una clase y asígnala a esta materia.
          </Text>
          {onNavigateToRecording && (
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: accent }]}
              onPress={onNavigateToRecording}
            >
              <Ionicons name="mic" size={18} color="#FFF" />
              <Text style={styles.emptyBtnText}>Ir a grabar</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={recordings}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={accent}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Modal editar título */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Editar grabación</Text>
            <Text style={styles.fieldLabel}>Título</Text>
            <TextInput
              style={styles.fieldInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Nombre de la grabación"
              placeholderTextColor="#bbb"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: accent },
                  saving && { opacity: 0.7 },
                ]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveText}>Guardar</Text>
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
  container: { flex: 1, backgroundColor: "#F2F4F7" },
  header: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  backBtn: { position: "absolute", top: 14, left: 12, padding: 6 },
  newBtn: {
    position: "absolute",
    top: 14,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { alignItems: "center", marginTop: 8 },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerCount: { fontSize: 13, color: "#8E8E93", marginTop: 2 },

  list: { padding: 16, paddingBottom: 32 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: { color: "#999", marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  emptyText: { fontSize: 14, color: "#999", textAlign: "center" },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: "#FFF", fontWeight: "600" },

  recCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  recIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  recInfo: { flex: 1 },
  recTitle: { fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  recMeta: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
  recFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    flexShrink: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  recActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 2,
  },
  actionChipText: { fontSize: 12, fontWeight: "600" },
  iconBtn: {
    padding: 6,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#1a1a1a",
    backgroundColor: "#FAFAFA",
    marginBottom: 16,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  cancelText: { color: "#666", fontWeight: "600" },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFF", fontWeight: "600", fontSize: 15 },

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
