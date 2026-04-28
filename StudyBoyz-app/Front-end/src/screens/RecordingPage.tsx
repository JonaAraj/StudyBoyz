// ============================================================
// RecordingPage.tsx v3
// Flujo: idle → [Iniciar] → recording → [Pausar/Reanudar] → [Detener] → modal guardar
// Modal guardar: selecciona materia por UUID (subject_id) o crea una nueva
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
import subjectService, { type Subject } from "../../services/subjectService";

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

interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

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

  // Lista de materias como objetos Subject (con id UUID)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Modal guardar
  const [saveModal, setSaveModal] = useState(false);
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [recordingTitle, setRecordingTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);

  // Modal upload externo
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Marcadores de puntos importantes (tiempos en milisegundos)
  const [markers, setMarkers] = useState<number[]>([]);

  // Custom Alert Modal (Reemplaza a Alert nativo para compatibilidad Web/Móvil)
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({ visible: false, title: "", message: "", buttons: [] });

  const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: "OK" }],
    });
  };
  const closeAlert = () => setCustomAlert((prev) => ({ ...prev, visible: false }));

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
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    const data = await recordingApiService.getSubjects();
    setSubjects(data);
    setLoadingSubjects(false);
  };

  // ── Iniciar ──────────────────────────────────────────────────
  const handleStart = async () => {
    setMarkers([]);
    await startRecording();
  };

  // ── Pausa / Reanuda ──────────────────────────────────────────
  const handlePauseResume = async () => {
    if (state === "recording") await pauseRecording();
    else if (state === "paused") await resumeRecording();
  };

  // ── Marcar punto ─────────────────────────────────────────────
  const handleMarkPoint = () => {
    setMarkers((prev) => [...prev, durationMillis]);
  };

  // ── Detener → abrir modal ────────────────────────────────────
  const handleStop = async () => {
    const result = await stopRecording();
    if (!result) return;
    setPendingResult(result);
    setRecordingTitle(`Grabación ${new Date().toLocaleDateString("es-MX")}`);
    setSelectedSubject(null);
    setCustomSubjectName("");
    setSaveModal(true);
    // Refrescar materias al abrir modal
    fetchSubjects();
  };

  // ── Crear materia nueva desde el modal de guardar ────────────
  const handleCreateAndSelectSubject = async () => {
    const name = customSubjectName.trim();
    if (!name) return;
    setCreatingSubject(true);
    const res = await subjectService.create(name, "book-outline");
    setCreatingSubject(false);
    if (res.success && res.subject) {
      // Agregar a la lista local y seleccionarla
      const newSubject: Subject = res.subject;
      setSubjects((prev) => [...prev, newSubject]);
      setSelectedSubject(newSubject);
      setCustomSubjectName("");
    } else {
      showAlert("Error", res.message || "No se pudo crear la materia.");
    }
  };

  // ── Guardar grabación ────────────────────────────────────────
  const handleSave = async () => {
    if (!pendingResult) return;

    // Si hay texto en customSubjectName sin haber creado → crear primero
    if (customSubjectName.trim() && !selectedSubject) {
      showAlert(
        "Materia sin crear",
        `¿Deseas crear la materia "${customSubjectName.trim()}" y guardar?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Crear y guardar",
            onPress: async () => {
              setCreatingSubject(true);
              const res = await subjectService.create(
                customSubjectName.trim(),
                "book-outline",
              );
              setCreatingSubject(false);
              if (res.success && res.subject) {
                await doSave(res.subject.id);
              } else {
                showAlert(
                  "Error",
                  res.message || "No se pudo crear la materia.",
                );
              }
            },
          },
        ],
      );
      return;
    }

    if (!selectedSubject) {
      showAlert(
        "Materia requerida",
        "Selecciona una materia antes de guardar.",
      );
      return;
    }

    await doSave(selectedSubject.id);
  };

  const doSave = async (subjectId: string) => {
    if (!pendingResult) return;
    setSaving(true);
    const res = await recordingApiService.saveRecording({
      uri: pendingResult.uri,
      blob: pendingResult.blob,
      mimeType: pendingResult.mimeType,
      durationMillis: pendingResult.durationMillis,
      title:
        recordingTitle.trim() ||
        `Grabación ${new Date().toLocaleDateString("es-MX")}`,
      subjectId,
        markers,
    });
    setSaving(false);

    if (res.success) {
      setMarkers([]);
      setSaveModal(false);
      setPendingResult(null);
      showAlert(
        "✅ Guardado",
        "Tu grabación se guardó. La transcripción comenzará en unos segundos.",
        [
          { text: "Ver grabaciones", onPress: () => onNavigateToRecientes?.() },
          { text: "Nueva grabación", onPress: () => {} },
        ],
      );
    } else {
      showAlert("Error", res.message);
    }
  };

  // ── Descartar ────────────────────────────────────────────────
  const handleDiscard = () => {
    showAlert("Descartar", "¿Seguro? No se puede recuperar.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Descartar",
        style: "destructive",
        onPress: () => {
          setSaveModal(false);
          setPendingResult(null);
            setMarkers([]);
            setTimeout(() => showAlert("Descartado", "La grabación ha sido descartada."), 300);
        },
      },
    ]);
  };

  // ── Cancelar grabación activa ────────────────────────────────
  const handleCancel = () => {
    showAlert("Cancelar", "¿Descartar la grabación actual?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí, descartar",
        style: "destructive",
        onPress: async () => {
          await cancelRecording();
            setMarkers([]);
            setTimeout(() => showAlert("Cancelado", "Se ha cancelado la grabación."), 300);
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
        showAlert("Error", res.message);
      }
    } catch (err: any) {
      setUploading(false);
      setUploadModal(false);
      showAlert("Error", err.message || "No se pudo subir el archivo.");
    }
  };

  // ── Estados derivados ────────────────────────────────────────
  const isIdle = state === "idle";
  const isRecording = state === "recording";
  const isPaused = state === "paused";
  const isActive = isRecording || isPaused;
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

        {/* Materia actual (indicador visual) */}
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
          <Text
            style={[
              styles.timeDisplay,
              { color: isActive ? "#007AFF" : "#C0C0C0" },
            ]}
          >
            {formatDuration(durationMillis)}
          </Text>
          <Text style={styles.timeLabel}>Tiempo transcurrido</Text>

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

        {/* Controles */}
        <View style={styles.controls}>
          {isIdle && (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Ionicons name="mic" size={28} color="#FFF" />
              <Text style={styles.startButtonText}>Iniciar Grabación</Text>
            </TouchableOpacity>
          )}

          {isActive && (
            <>
              <TouchableOpacity
                style={styles.flagButton}
                onPress={handleMarkPoint}
              >
                <Ionicons name="flag" size={18} color="#FFF" />
                <Text style={styles.flagButtonText}>
                  {markers.length > 0 ? `Marcar punto (${markers.length})` : "Marcar punto importante"}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionRow}>
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

                <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
                  <View style={styles.actionIconWrap}>
                    <View style={styles.stopSquare} />
                  </View>
                  <Text style={styles.stopLabel}>Detener</Text>
                </TouchableOpacity>

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

      {/* ── Modal: Guardar grabación ─────────────────────────── */}
      <Modal visible={saveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Guardar grabación</Text>
            <Text style={styles.modalSub}>
              <Ionicons name="time-outline" size={13} color="#999" />{" "}
              {formatDuration(pendingResult?.durationMillis || 0)}
            </Text>

            {/* Título */}
            <Text style={styles.fieldLabel}>Título</Text>
            <TextInput
              style={styles.fieldInput}
              value={recordingTitle}
              onChangeText={setRecordingTitle}
              placeholder="Nombre de la grabación"
              placeholderTextColor="#bbb"
            />

            {/* Selector de materia */}
            <Text style={styles.fieldLabel}>
              Materia{" "}
              {loadingSubjects && (
                <ActivityIndicator size="small" color="#999" />
              )}
            </Text>

            {/* Chips de materias existentes */}
            {subjects.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chips}
              >
                {subjects.map((s) => {
                  const isSelected =
                    selectedSubject?.id === s.id && !customSubjectName;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        setSelectedSubject(s);
                        setCustomSubjectName("");
                      }}
                    >
                      <Ionicons
                        name={(s.icon as any) || "book-outline"}
                        size={13}
                        color={isSelected ? "#FFF" : "#666"}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {subjects.length === 0 && !loadingSubjects && (
              <Text style={styles.noMateriaHint}>
                Aún no tienes materias. Escribe una nueva abajo.
              </Text>
            )}

            {/* Crear materia nueva */}
            <View style={styles.newSubjectRow}>
              <TextInput
                style={[styles.fieldInput, styles.newSubjectInput]}
                value={customSubjectName}
                onChangeText={(t) => {
                  setCustomSubjectName(t);
                  if (t) setSelectedSubject(null);
                }}
                placeholder="O escribe una materia nueva..."
                placeholderTextColor="#bbb"
                returnKeyType="done"
                onSubmitEditing={handleCreateAndSelectSubject}
              />
              {customSubjectName.trim().length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.createSubjectBtn,
                    creatingSubject && { opacity: 0.6 },
                  ]}
                  onPress={handleCreateAndSelectSubject}
                  disabled={creatingSubject}
                >
                  {creatingSubject ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="add" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Materia seleccionada (confirmación visual) */}
            {selectedSubject && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={15} color="#34C759" />
                <Text style={styles.selectedBadgeText}>
                  {selectedSubject.name}
                </Text>
              </View>
            )}

            {/* Botones */}
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

      {/* ── Modal: Upload externo ────────────────────────────── */}
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
                  style={[styles.alertButton, idx > 0 && styles.alertButtonBorder]}
                  onPress={() => {
                    closeAlert();
                    if (btn.onPress) {
                      setTimeout(btn.onPress, 300); // Dar tiempo a que cierre el actual
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.alertButtonText,
                      btn.style === "cancel" && styles.alertButtonTextCancel,
                      btn.style === "destructive" && styles.alertButtonTextDestructive,
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
  chips: { marginBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
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
    marginBottom: 10,
    fontStyle: "italic",
  },

  newSubjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  newSubjectInput: { flex: 1, marginBottom: 0 },
  createSubjectBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#34C759",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8FAF0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 4,
  },
  selectedBadgeText: {
    fontSize: 13,
    color: "#34C759",
    fontWeight: "600",
  },

  modalBtns: { flexDirection: "row", gap: 10, marginTop: 12 },
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
  alertButtonBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "#E8E8E8",
  },
  alertButtonText: { fontSize: 16, fontWeight: "600", color: "#007AFF" },
  alertButtonTextCancel: { color: "#999", fontWeight: "400" },
  alertButtonTextDestructive: { color: "#FF3B30", fontWeight: "600" },
});
