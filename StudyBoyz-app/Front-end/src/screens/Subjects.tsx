// ============================================================
// screens/Subjects.tsx
// Lista de materias desde API + crear nueva con modal (ícono + nombre)
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import subjectService, { type Subject } from "../../services/subjectService";

type SubjectsProps = {
  onNavigateToRecording?: () => void;
  onNavigateToConfiguracion?: () => void;
  onNavigateToRecientes: () => void;
  onNavigateToSubjectDetail?: (subject: Subject, index: number) => void;
};

interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

// ── Tarjeta de materia ───────────────────────────────────────
function SubjectCard({
  subject,
  index,
  onPress,
  onOptionsPress,
}: {
  subject: Subject;
  index: number;
  onPress: () => void;
  onOptionsPress: () => void;
}) {
  const { bg, accent } = subjectService.getCardColor(index);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <TouchableOpacity style={styles.cardMenu} onPress={onOptionsPress}>
        <Ionicons name="ellipsis-horizontal" size={18} color="#C0C0C0" />
      </TouchableOpacity>
      <View style={[styles.cardIcon, { backgroundColor: bg }]}>
        <Ionicons
          name={(subject.icon as any) || "book-outline"}
          size={26}
          color={accent}
        />
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {subject.name}
      </Text>
      <Text style={styles.cardNotes}>
        {subject.recording_count ?? 0} grabación
        {subject.recording_count !== 1 ? "es" : ""}
      </Text>
    </TouchableOpacity>
  );
}

// ── Selector de íconos ───────────────────────────────────────
function IconSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (icon: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.iconScroll}
      contentContainerStyle={styles.iconScrollContent}
    >
      {subjectService.availableIcons.map((ic) => {
        const isSelected = selected === ic.name;
        return (
          <TouchableOpacity
            key={ic.name}
            style={[styles.iconOption, isSelected && styles.iconOptionActive]}
            onPress={() => onSelect(ic.name)}
          >
            <Ionicons
              name={ic.name as any}
              size={22}
              color={isSelected ? "#007AFF" : "#8E8E93"}
            />
            <Text
              style={[
                styles.iconLabel,
                isSelected && { color: "#007AFF", fontWeight: "600" },
              ]}
            >
              {ic.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Pantalla principal ───────────────────────────────────────
export const Subjects = ({
  onNavigateToRecording,
  onNavigateToConfiguracion,
  onNavigateToRecientes,
  onNavigateToSubjectDetail,
}: SubjectsProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal crear
  const [createModal, setCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("book-outline");
  const [creating, setCreating] = useState(false);

  // Modal opciones/editar
  const [optionsModal, setOptionsModal] = useState(false);
  const [optionsTarget, setOptionsTarget] = useState<Subject | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("book-outline");
  const [editSaving, setEditSaving] = useState(false);

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

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await subjectService.getAll();
    setSubjects(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Crear materia ──────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await subjectService.create(newName.trim(), newIcon);
    setCreating(false);
    if (res.success) {
      setCreateModal(false);
      setNewName("");
      setNewIcon("book-outline");
      load(true);
    } else {
      showAlert("Error", res.message || "No se pudo crear la materia.");
    }
  };

  // ── Abrir opciones ─────────────────────────────────────────
  const openOptions = (subject: Subject) => {
    setOptionsTarget(subject);
    setEditMode(false);
    setEditName(subject.name);
    setEditIcon(subject.icon || "book-outline");
    setOptionsModal(true);
  };

  // ── Guardar edición ────────────────────────────────────────
  const handleEdit = async () => {
    if (!optionsTarget || !editName.trim()) return;
    setEditSaving(true);
    const res = await subjectService.update(optionsTarget.id, {
      name: editName.trim(),
      icon: editIcon,
    });
    setEditSaving(false);
    if (res.success) {
      setOptionsModal(false);
      load(true);
    } else {
      showAlert("Error", res.message || "No se pudo actualizar.");
    }
  };

  // ── Eliminar materia ───────────────────────────────────────
  const handleDelete = () => {
    if (!optionsTarget) return;
    showAlert(
      "Eliminar materia",
      `¿Eliminar "${optionsTarget.name}"? Las grabaciones no serán eliminadas, solo quedarán sin materia asignada.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setOptionsModal(false);
            const res = await subjectService.delete(optionsTarget.id);
            if (res.success) {
              load(true);
            } else {
              showAlert("Error", res.message || "No se pudo eliminar.");
            }
          },
        },
      ],
    );
  };

  const Header = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.title}>Mis Materias</Text>
        <Text style={styles.subtitle}>Organiza tu aprendizaje</Text>
      </View>
      <TouchableOpacity style={styles.searchButton}>
        <Ionicons name="search" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={subjects}
          numColumns={2}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={Header}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={subjects.length > 0 ? styles.row : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="folder-open-outline" size={52} color="#D0D0D0" />
              <Text style={styles.emptyTitle}>Sin materias</Text>
              <Text style={styles.emptyText}>
                Toca el botón + para crear tu primera materia.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardWrapper}>
              <SubjectCard
                subject={item}
                index={index}
                onPress={() => onNavigateToSubjectDetail?.(item, index)}
                onOptionsPress={() => openOptions(item)}
              />
            </View>
          )}
        />
      )}

      {/* FAB crear materia */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
        onPress={() => {
          setNewName("");
          setNewIcon("book-outline");
          setCreateModal(true);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={onNavigateToRecording}
        >
          <Ionicons name="home" size={24} color="#8E8E93" />
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.activeTab]}>
          <Ionicons name="folder" size={24} color="#007AFF" />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Materias</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={onNavigateToRecientes}
        >
          <Ionicons name="time" size={24} color="#8E8E93" />
          <Text style={styles.tabLabel}>Recientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={onNavigateToConfiguracion}
        >
          <Ionicons name="settings" size={24} color="#8E8E93" />
          <Text style={styles.tabLabel}>Ajustes</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal: Crear materia ─────────────────────────────── */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nueva materia</Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.fieldInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Ej. Matemáticas, Historia..."
              placeholderTextColor="#bbb"
              autoFocus
            />

            <Text style={styles.fieldLabel}>Ícono</Text>
            <IconSelector selected={newIcon} onSelect={setNewIcon} />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModal(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!newName.trim() || creating) && { opacity: 0.5 },
                ]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveText}>Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Opciones / Editar materia ────────────────── */}
      <Modal visible={optionsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            {!editMode ? (
              <>
                <Text style={styles.modalTitle}>{optionsTarget?.name}</Text>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setEditMode(true)}
                >
                  <Ionicons name="pencil-outline" size={20} color="#007AFF" />
                  <Text style={styles.optionText}>Editar materia</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.optionText, { color: "#FF3B30" }]}>
                    Eliminar materia
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelBtn, { marginTop: 12 }]}
                  onPress={() => setOptionsModal(false)}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Editar materia</Text>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nombre de la materia"
                  placeholderTextColor="#bbb"
                  autoFocus
                />
                <Text style={styles.fieldLabel}>Ícono</Text>
                <IconSelector selected={editIcon} onSelect={setEditIcon} />
                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setEditMode(false)}
                  >
                    <Text style={styles.cancelText}>Volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, editSaving && { opacity: 0.7 }]}
                    onPress={handleEdit}
                    disabled={editSaving}
                  >
                    {editSaving ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.saveText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8F9FB" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 110 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 40,
    marginBottom: 25,
    paddingHorizontal: 4,
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#1A2130" },
  subtitle: { fontSize: 16, color: "#8E8E93" },
  searchButton: { padding: 8 },

  row: { justifyContent: "space-between" },
  cardWrapper: { width: "48%", marginBottom: 14 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMenu: { position: "absolute", top: 10, right: 10, padding: 6 },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2130",
    marginBottom: 4,
  },
  cardNotes: { fontSize: 12, color: "#999" },

  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    maxWidth: 220,
  },

  fab: {
    position: "absolute",
    bottom: 84,
    right: 20,
    backgroundColor: "#007AFF",
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    height: 68,
    alignItems: "flex-start",
    paddingTop: 8,
    justifyContent: "space-around",
  },
  tabItem: { alignItems: "center", justifyContent: "flex-start", flex: 1 },
  activeTab: { opacity: 1 },
  tabLabel: { fontSize: 11, color: "#8E8E93", marginTop: 4 },
  activeTabLabel: { color: "#007AFF" },

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
    marginBottom: 14,
  },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
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
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFF", fontWeight: "600", fontSize: 15 },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionText: { fontSize: 16, color: "#1a1a1a", fontWeight: "500" },

  iconScroll: { marginBottom: 14 },
  iconScrollContent: { gap: 8, paddingVertical: 4 },
  iconOption: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    backgroundColor: "#FAFAFA",
    gap: 4,
    minWidth: 70,
  },
  iconOptionActive: {
    borderColor: "#007AFF",
    backgroundColor: "#EBF4FF",
  },
  iconLabel: { fontSize: 10, color: "#8E8E93", textAlign: "center" },

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
