import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Configuracion from "./Configuracion";

type RecordingPageProps = {
  onNavigateToSubjects?: () => void;
};

export default function RecordingPage({
  onNavigateToSubjects,
}: RecordingPageProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [time, setTime] = useState("00:42:15");

  const handleMarkPoint = () => {
    console.log("Marking important point");
  };

  const handlePause = () => {
    setIsRecording(!isRecording);
  };

  const handleStop = () => {
    setIsRecording(false);
  };

  const handleCancel = () => {
    setIsRecording(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grabando</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.welcomeText}>
            ¡Tu sesión de estudio ha comenzado!
          </Text>
        </View>

        {/* Subject Section */}
        <View style={styles.subjectSection}>
          <Text style={styles.subjectLabel}>Materia Actual</Text>
          <TouchableOpacity style={styles.subjectSelector}>
            <View style={styles.subjectContent}>
              <View style={styles.subjectIndicator} />
              <Text style={styles.subjectName}>Programación Avanzada</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recording Info */}
        <View style={styles.recordingInfo}>
          <View style={styles.timeSection}>
            <Text style={styles.timeDisplay}>{time}</Text>
            <Text style={styles.timeLabel}>Tiempo transcurrido</Text>
          </View>

          {/* Waveform */}
          <View style={styles.waveformContainer}>
            {[40, 60, 80, 100, 100, 100, 100, 100, 100, 100, 80, 60, 40].map(
              (opacity, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.waveBar,
                    { opacity: opacity / 100, backgroundColor: "#007AFF" },
                  ]}
                />
              ),
            )}
          </View>

          {/* Live Indicator */}
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>En Vivo</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsPanel}>
          <TouchableOpacity style={styles.flagButton} onPress={handleMarkPoint}>
            <Ionicons name="flag" size={20} color="#FFF" />
            <Text style={styles.flagButtonText}>Marcar punto importante</Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={handlePause}>
              <View style={styles.actionIcon}>
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

            <TouchableOpacity style={styles.actionBtnStop} onPress={handleStop}>
              <View style={styles.actionIconStop}>
                <View style={styles.stopSquare} />
              </View>
              <Text style={styles.actionLabelStop}>Detener</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleCancel}>
              <View style={styles.actionIcon}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </View>
              <Text style={styles.actionLabel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.recordingFooter}>
          <Text style={styles.footerText}>Tiempo de estudio: 00:00:00</Text>
          <TouchableOpacity
            style={styles.subjectsButton}
            onPress={onNavigateToSubjects}
          >
            <Text style={styles.subjectsButtonText}>Ir a Materias →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  settingsButton: {
    padding: 8,
  },
  mainContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  subjectSection: {
    marginBottom: 20,
  },
  subjectLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
  },
  subjectSelector: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  subjectContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subjectIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#007AFF",
    marginRight: 12,
  },
  subjectName: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  recordingInfo: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  timeSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  timeDisplay: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: "#999",
  },
  waveformContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    height: 60,
    marginBottom: 16,
  },
  waveBar: {
    width: 3,
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  liveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
  controlsPanel: {
    marginBottom: 20,
  },
  flagButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  flagButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionBtnStop: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionIconStop: {
    marginBottom: 8,
  },
  stopSquare: {
    width: 20,
    height: 20,
    backgroundColor: "#FFF",
    borderRadius: 2,
  },
  actionLabel: {
    fontSize: 12,
    color: "#333",
  },
  actionLabelStop: {
    fontSize: 12,
    color: "#FFF",
  },
  recordingFooter: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  subjectsButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  subjectsButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
