// ============================================================
// screens/SubjectDetail.tsx
// Muestra las grabaciones de una materia con opciones:
// editar título, eliminar, ver transcripción
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Linking,
} from "react-native";
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

const statusConfig = {
  pending: { label: "Pendiente", color: "#8E8E93", bg: "#F2F2F7" },
  processing: { label: "Procesando", color: "#FF9500", bg: "#FFF3E0" },
  done: { label: "Transcrito", color: "#34C759", bg: "#E8FAF0" },
  error: { label: "Error", color: "#FF3B30", bg: "#FFE8E8" },
};

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

  // Vista transcripción inline
  const [transcriptionRec, setTranscriptionRec] =
    useState<SubjectRecording | null>(null);

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

  const handleDelete = (rec: SubjectRecording) => {
    Alert.alert(
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
              rec.file_path || "",
            );
            if (res.success) {
              setRecordings((prev) => prev.filter((r) => r.id !== rec.id));
            } else {
              Alert.alert("Error", res.message || "No se pudo eliminar.");
            }
          },
        },
      ],
    );
  };

  // ── Descargar Grabación ──────────────────────────────────────
  const handleDownload = async (rec: SubjectRecording) => {
    try {
      const url = await recordingsService.getDownloadUrl(rec.id);
      if (url) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", "No se pudo generar el enlace de descarga.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Ocurrió un problema al intentar descargar la grabación.",
      );
    }
  };

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
      Alert.alert("Error", res.message || "No se pudo actualizar.");
    }
  };

  // Si hay transcripción abierta, renderizar TranscriptionView
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

  const renderItem = ({ item }: { item: SubjectRecording }) => {
    const status = statusConfig[item.transcript_status] || statusConfig.pending;
    return (
      <View style={styles.recCard}>
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

        {/* Badge estado */}
        <View style={styles.recFooter}>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>

          <View style={styles.recActions}>
            {/* Ver transcripción */}
            {item.transcript_status === "done" && (
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: bg }]}
                onPress={() => setTranscriptionRec(item)}
              >
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color={accent}
                />
                <Text style={[styles.actionChipText, { color: accent }]}>
                  Ver
                </Text>
              </TouchableOpacity>
            )}

            {/* Descargar */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDownload(item)}
            >
              <Ionicons name="download-outline" size={18} color="#007AFF" />
            </TouchableOpacity>

            {/* Editar */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => openEdit(item)}
            >
              <Ionicons name="pencil-outline" size={18} color="#8E8E93" />
            </TouchableOpacity>

            {/* Eliminar */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDelete(item)}
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

      {/* Lista */}
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
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  recActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  actionChipText: { fontSize: 12, fontWeight: "600" },
  iconBtn: { padding: 6 },

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
});
