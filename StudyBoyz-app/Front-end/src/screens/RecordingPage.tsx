// ============================================================
// RecordingPage.tsx v2
// Flujo: idle → [Iniciar] → recording → [Pausar/Reanudar] → [Detener] → modal guardar
// Compatible web (MediaRecorder) y móvil (expo-av)
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRecorder } from "../../hooks/useRecorder";
import recordingApiService from "../../services/recordingApiService";

type RecordingPageProps = {
  onNavigateToSubjects?: () => void;
  onNavigateToRecientes?: () => void;
};

const formatDuration = (millis: number): string => {
  const total = Math.floor(millis / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export default function RecordingPage({
  onNavigateToSubjects,
  onNavigateToRecientes,
}: RecordingPageProps) {
  const {
    state,
    durationMillis,
    metering,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useRecorder();

  const [materias, setMaterias] = useState<string[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  // Modal guardar
  const [saveModal, setSaveModal] = useState(false);
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [recordingTitle, setRecordingTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal upload externo
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Animación dot
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state === "recording") {
      dotAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, {
            toValue: 0.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      dotAnim.current.start();
    } else {
      dotAnim.current?.stop();
      dotOpacity.setValue(1);
    }
  }, [state]);

  useEffect(() => {
    fetchMaterias();
  }, []);

  const fetchMaterias = async () => {
    setLoadingMaterias(true);
    const data = await recordingApiService.getMaterias();
    setMaterias(data);
    setLoadingMaterias(false);
  };

  // ── Iniciar ──────────────────────────────────────────────────
  const handleStart = async () => {
    await startRecording();
  };

  // ── Pausa / Reanuda ──────────────────────────────────────────
  const handlePauseResume = async () => {
    if (state === "recording") await pauseRecording();
    else if (state === "paused") await resumeRecording();
  };

  // ── Marcar punto ─────────────────────────────────────────────
  const handleMarkPoint = () => {
    Alert.alert(
      "📍 Punto marcado",
      `Marca registrada en ${formatDuration(durationMillis)}`,
    );
  };

  // ── Detener → modal ──────────────────────────────────────────
  const handleStop = async () => {
    const result = await stopRecording();
    if (!result) return;
    setPendingResult(result);
    setRecordingTitle(`Grabación ${new Date().toLocaleDateString("es-MX")}`);
    setSelectedSubject("");
    setCustomSubject("");
    setSaveModal(true);
  };

  // ── Guardar con materia ──────────────────────────────────────
  const handleSave = async () => {
    if (!pendingResult) return;
    const subject = customSubject.trim() || selectedSubject;
    if (!subject) {
      Alert.alert(
        "Materia requerida",
        "Selecciona o escribe una materia antes de guardar.",
      );
      return;
    }
    setSaving(true);
    const res = await recordingApiService.saveRecording({
      uri: pendingResult.uri,
      blob: pendingResult.blob,
      mimeType: pendingResult.mimeType,
      durationMillis: pendingResult.durationMillis,
      title:
        recordingTitle.trim() ||
        `Grabación ${new Date().toLocaleDateString("es-MX")}`,
      subject,
    });
    setSaving(false);
    if (res.success) {
      setSaveModal(false);
      setPendingResult(null);
      Alert.alert(
        "✅ Guardado",
        "Tu grabación se guardó. La transcripción comenzará en unos segundos.",
        [
          { text: "Ver grabaciones", onPress: () => onNavigateToRecientes?.() },
          { text: "Nueva grabación", onPress: () => {} },
        ],
      );
    } else {
      Alert.alert("Error", res.message);
    }
  };

  // ── Descartar ────────────────────────────────────────────────
  const handleDiscard = () => {
    Alert.alert("Descartar", "¿Seguro? No se puede recuperar.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Descartar",
        style: "destructive",
        onPress: () => {
          setSaveModal(false);
          setPendingResult(null);
        },
      },
    ]);
  };

  // ── Cancelar grabación activa ────────────────────────────────
  const handleCancel = () => {
    Alert.alert("Cancelar", "¿Descartar la grabación actual?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí, descartar",
        style: "destructive",
        onPress: async () => {
          await cancelRecording();
          onNavigateToSubjects?.();
        },
      },
    ]);
  };

  // ── Upload externo ───────────────────────────────────────────
  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0]!;
      setUploadMessage("Subiendo audio...");
      setUploading(true);
      setUploadModal(true);
      const res = await recordingApiService.uploadExternal({
        uri: file.uri,
        name: file.name || "audio_file",
        mimeType: file.mimeType || "audio/mpeg",
      });
      setUploading(false);
      if (res.success) {
        setUploadMessage(
          "¡Audio subido! La transcripción comenzará automáticamente.",
        );
        setTimeout(() => {
          setUploadModal(false);
          onNavigateToRecientes?.();
        }, 2000);
      } else {
        setUploadModal(false);
        Alert.alert("Error", res.message);
      }
    } catch (err: any) {
      setUploading(false);
      setUploadModal(false);
      Alert.alert("Error", err.message || "No se pudo subir el archivo.");
    }
  };

  // ── Estados derivados ────────────────────────────────────────
  const isIdle = state === "idle";
  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isActive = isRecording || isPaused;

  // ── Color de la onda según estado ────────────────────────────
  const waveColor = isRecording ? "#007AFF" : isPaused ? "#FFB300" : "#D0D0D0";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {isIdle
                ? "Grabación"
                : isRecording
                  ? "Grabando"
                  : isPaused
                    ? "Pausado"
                    : "Finalizado"}
            </Text>
            <Text style={styles.headerSub}>
              {isIdle
                ? "Presiona iniciar para comenzar"
                : isRecording
                  ? "Sesión en curso"
                  : isPaused
                    ? "Grabación pausada"
                    : ""}
            </Text>
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickAudio}>
            <Ionicons name="cloud-upload-outline" size={17} color="#007AFF" />
            <Text style={styles.uploadBtnText}>Subir audio</Text>
          </TouchableOpacity>
        </View>

        {/* Materia */}
        <View style={styles.subjectSection}>
          <Text style={styles.subjectLabel}>Materia Actual</Text>
          <View style={styles.subjectSelector}>
            <View style={styles.subjectContent}>
              <View
                style={[
                  styles.subjectDot,
                  { backgroundColor: isActive ? "#007AFF" : "#D0D0D0" },
                ]}
              />
              <Text
                style={[
                  styles.subjectName,
                  { color: isActive ? "#333" : "#aaa" },
                ]}
              >
                {isActive
                  ? "Se asignará al guardar"
                  : "Sin materia seleccionada"}
              </Text>
            </View>
          </View>
        </View>

        {/* Visualización */}
        <View style={styles.vizCard}>
          {/* Tiempo */}
          <Text
            style={[
              styles.timeDisplay,
              { color: isActive ? "#007AFF" : "#C0C0C0" },
            ]}
          >
            {formatDuration(durationMillis)}
          </Text>
          <Text style={styles.timeLabel}>Tiempo transcurrido</Text>

          {/* Waveform */}
          <View style={styles.waveform}>
            {metering.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: Math.max(3, h), backgroundColor: waveColor },
                ]}
              />
            ))}
          </View>

          {/* Estado */}
          <View style={styles.statusRow}>
            <Animated.View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isRecording
                    ? "#FF3B30"
                    : isPaused
                      ? "#FFB300"
                      : "#D0D0D0",
                  opacity: isRecording ? dotOpacity : 1,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isRecording
                    ? "#FF3B30"
                    : isPaused
                      ? "#FFB300"
                      : "#999",
                },
              ]}
            >
              {isRecording
                ? "En Vivo"
                : isPaused
                  ? "Pausado"
                  : isIdle
                    ? "Listo"
                    : "Detenido"}
            </Text>
          </View>
        </View>

        {/* ── CONTROLES ── */}
        <View style={styles.controls}>
          {/* Botón INICIAR — solo visible en idle */}
          {isIdle && (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Ionicons name="mic" size={28} color="#FFF" />
              <Text style={styles.startButtonText}>Iniciar Grabación</Text>
            </TouchableOpacity>
          )}

          {/* Controles activos — visibles cuando está grabando o pausado */}
          {isActive && (
            <>
              {/* Marcar punto */}
              <TouchableOpacity
                style={styles.flagButton}
                onPress={handleMarkPoint}
              >
                <Ionicons name="flag" size={18} color="#FFF" />
                <Text style={styles.flagButtonText}>
                  Marcar punto importante
                </Text>
              </TouchableOpacity>

              {/* Fila de botones */}
              <View style={styles.actionRow}>
                {/* Pausar / Reanudar */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handlePauseResume}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons
                      name={isRecording ? "pause" : "play"}
                      size={24}
                      color="#007AFF"
                    />
                  </View>
                  <Text style={styles.actionLabel}>
                    {isRecording ? "Pausar" : "Reanudar"}
                  </Text>
                </TouchableOpacity>

                {/* Detener */}
                <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
                  <View style={styles.actionIconWrap}>
                    <View style={styles.stopSquare} />
                  </View>
                  <Text style={styles.stopLabel}>Detener</Text>
                </TouchableOpacity>

                {/* Cancelar */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleCancel}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  </View>
                  <Text style={styles.actionLabel}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tiempo de estudio: {formatDuration(durationMillis)}
          </Text>
          <TouchableOpacity
            style={styles.subjectsBtn}
            onPress={onNavigateToSubjects}
          >
            <Text style={styles.subjectsBtnText}>Ir a Materias →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Modal: Guardar grabación ────────────────────────── */}
      <Modal visible={saveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Guardar grabación</Text>
            <Text style={styles.modalSub}>
              <Ionicons name="time-outline" size={13} color="#999" />{" "}
              {formatDuration(pendingResult?.durationMillis || 0)}
            </Text>

            <Text style={styles.fieldLabel}>Título</Text>
            <TextInput
              style={styles.fieldInput}
              value={recordingTitle}
              onChangeText={setRecordingTitle}
              placeholder="Nombre de la grabación"
              placeholderTextColor="#bbb"
            />

            <Text style={styles.fieldLabel}>
              Materia{" "}
              {loadingMaterias && (
                <ActivityIndicator size="small" color="#999" />
              )}
            </Text>

            {materias.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chips}
              >
                {materias.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.chip,
                      selectedSubject === m &&
                        !customSubject &&
                        styles.chipActive,
                    ]}
                    onPress={() => {
                      setSelectedSubject(m);
                      setCustomSubject("");
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedSubject === m &&
                          !customSubject &&
                          styles.chipTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {materias.length === 0 && !loadingMaterias && (
              <Text style={styles.noMateriaHint}>
                Aún no tienes materias. Escribe una nueva abajo.
              </Text>
            )}

            <TextInput
              style={[styles.fieldInput, { marginTop: 10 }]}
              value={customSubject}
              onChangeText={(t) => {
                setCustomSubject(t);
                if (t) setSelectedSubject("");
              }}
              placeholder="O escribe una materia nueva..."
              placeholderTextColor="#bbb"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.discardBtn}
                onPress={handleDiscard}
              >
                <Ionicons name="trash-outline" size={15} color="#FF3B30" />
                <Text style={styles.discardText}>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={styles.saveText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Upload externo ───────────────────────────── */}
      <Modal visible={uploadModal} transparent animationType="fade">
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadCard}>
            {uploading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <Ionicons name="checkmark-circle" size={52} color="#34C759" />
            )}
            <Text style={styles.uploadTitle}>
              {uploading ? "Subiendo audio..." : "¡Listo!"}
            </Text>
            <Text style={styles.uploadText}>{uploadMessage}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F7" },
  scrollContent: { padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#1A1A2E" },
  headerSub: { fontSize: 13, color: "#999", marginTop: 2 },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  uploadBtnText: { color: "#007AFF", fontWeight: "600", fontSize: 13 },

  subjectSection: { marginBottom: 16 },
  subjectLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subjectSelector: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    overflow: "hidden",
  },
  subjectContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  subjectDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  subjectName: { fontSize: 15 },

  vizCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeDisplay: {
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: -1,
    marginBottom: 4,
  },
  timeLabel: { fontSize: 12, color: "#999", marginBottom: 20 },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 56,
    width: "100%",
    marginBottom: 16,
  },
  waveBar: { flex: 1, borderRadius: 2, minHeight: 3 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "600" },

  controls: { marginBottom: 16 },

  // Botón de inicio
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#007AFF",
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 12,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: { color: "#FFF", fontSize: 18, fontWeight: "700" },

  flagButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  flagButtonText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 14,
    borderRadius: 12,
  },
  stopBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionIconWrap: { marginBottom: 6 },
  stopSquare: {
    width: 18,
    height: 18,
    backgroundColor: "#FFF",
    borderRadius: 3,
  },
  actionLabel: { fontSize: 12, color: "#444", fontWeight: "500" },
  stopLabel: { fontSize: 12, color: "#FFF", fontWeight: "500" },

  footer: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  footerText: { fontSize: 12, color: "#999", marginBottom: 12 },
  subjectsBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  subjectsBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  // Modal guardar
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
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  modalSub: { fontSize: 13, color: "#999", marginBottom: 20 },
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
    marginBottom: 12,
  },
  chips: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
    backgroundColor: "#FAFAFA",
  },
  chipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  chipText: { fontSize: 13, color: "#666" },
  chipTextActive: { color: "#FFF", fontWeight: "600" },
  noMateriaHint: {
    fontSize: 13,
    color: "#bbb",
    marginBottom: 4,
    fontStyle: "italic",
  },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  discardBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD0D0",
    backgroundColor: "#FFF8F8",
  },
  discardText: { color: "#FF3B30", fontWeight: "600" },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#007AFF",
  },
  saveText: { color: "#FFF", fontWeight: "600", fontSize: 15 },

  // Modal upload
  uploadOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    width: 280,
  },
  uploadTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  uploadText: { fontSize: 14, color: "#666", textAlign: "center" },
});
