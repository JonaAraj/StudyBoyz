import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import recordingsService from "../../services/recordingsService";
import type { Recording } from "../../services/recordingsService";

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
    Alert.alert(
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
              Alert.alert("Error", res.message);
            }
          },
        },
      ],
    );
  };

  // ── Descargar ───────────────────────────────────────────────
  const handleDownload = async (rec: Recording) => {
    const url = await recordingsService.getDownloadUrl(rec.id);
    if (url) {
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "No se pudo generar el enlace de descarga.");
    }
  };

  // ── Editar ──────────────────────────────────────────────────
  const openEdit = (rec: Recording) => {
    setEditTarget(rec);
    setEditTitle(rec.title);
    setEditSubject(rec.subject || "");
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editTitle.trim()) {
      Alert.alert("Error", "El título no puede estar vacío.");
      return;
    }
    setSaving(true);
    const res = await recordingsService.update(editTarget.id, {
      title: editTitle.trim(),
      subject: editSubject,
    });
    setSaving(false);
    if (res.success) {
      setRecordings((prev) =>
        prev.map((r) => (r.id === editTarget.id ? res.recording : r)),
      );
      setEditModal(false);
    } else {
      Alert.alert("Error", res.message);
    }
  };

  // ── Render tarjeta ──────────────────────────────────────────
  const RecordingCard = ({ rec }: { rec: Recording }) => (
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
            {rec.subject || "Sin materia"} ·{" "}
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
          onPress={() => openEdit(rec)}
        >
          <Ionicons name="pencil-outline" size={16} color="#007AFF" />
          <Text style={[styles.actionText, { color: "#007AFF" }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDownload(rec)}
        >
          <Ionicons name="download-outline" size={16} color="#34C759" />
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
});
