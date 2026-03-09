// ============================================================
// TranscriptionView.tsx — Pantalla de transcripción
// Ver, editar y descargar como PDF
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import transcriptionService from "../../services/trasncriptionService";
import type { Transcription } from "../../services/trasncriptionService";

type TranscriptionViewProps = {
  recordingId: string;
  recordingTitle: string;
  recordingSubject?: string | null;
  transcriptStatus?: string;
  onBack: () => void;
};

type ViewMode = "view" | "edit";

export default function TranscriptionView({
  recordingId,
  recordingTitle,
  recordingSubject,
  transcriptStatus,
  onBack,
}: TranscriptionViewProps) {
  const [transcription, setTranscription] = useState<Transcription | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(transcriptStatus || "pending");
  const [mode, setMode] = useState<ViewMode>("view");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Polling para estados pending/processing
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animación de pulso para estado processing
  useEffect(() => {
    if (status === "processing") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  // Cargar transcripción y hacer polling si está pendiente
  useEffect(() => {
    fetchTranscription();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [recordingId]);

  const fetchTranscription = async () => {
    const { transcription: t, status: s } =
      await transcriptionService.getByRecording(recordingId);
    setTranscription(t);
    setStatus(s);
    setLoading(false);

    if (t) {
      setEditContent(t.content);
    }

    // Si está en proceso, hacer polling cada 5 segundos
    if (s === "pending" || s === "processing") {
      pollRef.current = setInterval(async () => {
        const { transcription: pt, status: ps } =
          await transcriptionService.getByRecording(recordingId);
        if (pt) {
          setTranscription(pt);
          setEditContent(pt.content);
          setStatus("done");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (ps === "error") {
          setStatus("error");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 5000);
    }
  };

  const handleSave = async () => {
    if (!transcription || !editContent.trim()) return;
    setSaving(true);
    const res = await transcriptionService.update(
      transcription.id,
      editContent,
    );
    setSaving(false);
    if (res.success) {
      setTranscription(res.transcription);
      setHasChanges(false);
      setMode("view");
    } else {
      Alert.alert("Error", res.message);
    }
  };

  const handleDownloadPdf = async () => {
    if (!transcription) return;
    setDownloading(true);
    const res = await transcriptionService.downloadAsPdf(
      transcription,
      recordingTitle,
    );
    setDownloading(false);
    if (!res.success) {
      Alert.alert("Error", res.message || "No se pudo generar el PDF.");
    }
  };

  const handleRequestTranscription = async () => {
    setStatus("processing");
    const res = await transcriptionService.requestTranscription(recordingId);
    if (!res.success) {
      setStatus("error");
      Alert.alert("Error", res.message);
    } else {
      // Iniciar polling
      pollRef.current = setInterval(async () => {
        const { transcription: pt, status: ps } =
          await transcriptionService.getByRecording(recordingId);
        if (pt) {
          setTranscription(pt);
          setEditContent(pt.content);
          setStatus("done");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (ps === "error") {
          setStatus("error");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 5000);
    }
  };

  // ── Render estados vacíos ───────────────────────────────────
  const renderEmpty = () => {
    if (status === "processing" || status === "pending") {
      return (
        <View style={styles.centered}>
          <Animated.View style={{ opacity: pulseAnim }}>
            <Ionicons name="mic" size={56} color="#007AFF" />
          </Animated.View>
          <Text style={styles.emptyTitle}>Transcribiendo...</Text>
          <Text style={styles.emptyText}>
            Deepgram está procesando tu audio. Esto puede tomar unos segundos.
          </Text>
          <ActivityIndicator color="#007AFF" style={{ marginTop: 16 }} />
        </View>
      );
    }

    if (status === "error") {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={56} color="#FF3B30" />
          <Text style={styles.emptyTitle}>Error en transcripción</Text>
          <Text style={styles.emptyText}>
            No se pudo transcribir este audio. Puedes intentarlo de nuevo.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRequestTranscription}
          >
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <Ionicons name="document-text-outline" size={56} color="#ccc" />
        <Text style={styles.emptyTitle}>Sin transcripción</Text>
        <Text style={styles.emptyText}>
          Este audio aún no tiene transcripción.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={handleRequestTranscription}
        >
          <Ionicons name="play" size={16} color="#FFF" />
          <Text style={styles.retryBtnText}>Transcribir ahora</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (hasChanges) {
              Alert.alert(
                "Cambios sin guardar",
                "¿Salir sin guardar los cambios?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Salir", style: "destructive", onPress: onBack },
                ],
              );
            } else {
              onBack();
            }
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backText}>Atrás</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {transcription && mode === "view" && (
            <>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => setMode("edit")}
              >
                <Ionicons name="pencil-outline" size={20} color="#007AFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerBtn}
                onPress={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            </>
          )}

          {mode === "edit" && (
            <>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => {
                  setEditContent(transcription?.content || "");
                  setHasChanges(false);
                  setMode("view");
                }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveHeaderText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Info de la grabación */}
      <View style={styles.recordingInfo}>
        <View style={styles.recordingIconWrap}>
          <Ionicons name="document-text" size={22} color="#007AFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.recordingTitle} numberOfLines={1}>
            {recordingTitle}
          </Text>
          {recordingSubject && (
            <Text style={styles.recordingSubject}>{recordingSubject}</Text>
          )}
        </View>
        {transcription?.edited && (
          <View style={styles.editedBadge}>
            <Text style={styles.editedBadgeText}>Editado</Text>
          </View>
        )}
        {status === "done" && !transcription?.edited && (
          <View style={styles.iaBadge}>
            <Text style={styles.iaBadgeText}>IA</Text>
          </View>
        )}
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : !transcription ? (
        renderEmpty()
      ) : mode === "view" ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.textContainer}
        >
          <Text style={styles.transcriptionText}>{transcription.content}</Text>
          <Text style={styles.dateText}>
            {new Date(transcription.created_at).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </ScrollView>
      ) : (
        <View style={styles.editorContainer}>
          <Text style={styles.editorHint}>
            <Ionicons
              name="information-circle-outline"
              size={13}
              color="#999"
            />{" "}
            Editando transcripción
          </Text>
          <TextInput
            style={styles.editor}
            value={editContent}
            onChangeText={(t) => {
              setEditContent(t);
              setHasChanges(true);
            }}
            multiline
            textAlignVertical="top"
            autoFocus
            placeholder="Escribe la transcripción..."
            placeholderTextColor="#bbb"
          />
        </View>
      )}
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
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: "#007AFF", fontSize: 16 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn: { padding: 8 },
  cancelText: { color: "#666", fontSize: 15 },
  saveHeaderBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  saveHeaderText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  recordingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  recordingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  recordingSubject: { fontSize: 12, color: "#999", marginTop: 2 },
  editedBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  editedBadgeText: { fontSize: 11, color: "#FF9500", fontWeight: "600" },
  iaBadge: {
    backgroundColor: "#E8F4FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  iaBadgeText: { fontSize: 11, color: "#007AFF", fontWeight: "700" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginTop: 12 },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: { color: "#FFF", fontWeight: "600" },
  scrollView: { flex: 1 },
  textContainer: { padding: 24, paddingBottom: 48 },
  transcriptionText: {
    fontSize: 16,
    color: "#1a1a1a",
    lineHeight: 28,
    fontFamily: "Georgia",
    letterSpacing: 0.2,
  },
  dateText: { marginTop: 32, fontSize: 12, color: "#bbb", textAlign: "center" },
  editorContainer: { flex: 1, padding: 16 },
  editorHint: { fontSize: 12, color: "#999", marginBottom: 8 },
  editor: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    lineHeight: 26,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
});
