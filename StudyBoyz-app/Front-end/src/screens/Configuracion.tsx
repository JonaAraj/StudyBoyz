import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";

type ConfiguracionProps = {
  onNavigateBack?: () => void;
};

const Configuracion = ({ onNavigateBack }: ConfiguracionProps) => {
  // Obtenemos los valores del contexto global
  const { theme, isDark, setTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleBackPress = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  const handleDeleteData = () => {
    // Implementar eliminación de datos
    console.log("Eliminar todos los datos");
  };

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Estilos dinámicos para modo oscuro
  const containerStyle = [styles.container, isDark && styles.containerDark];
  const headerStyle = [styles.stickyHeader, isDark && styles.stickyHeaderDark];
  const titleStyle = [styles.headerTitle, isDark && styles.textDark];
  const appNameStyle = [styles.appName, isDark && styles.textDark];
  const sectionTitleStyle = [styles.sectionTitle, isDark && styles.textDark];
  const cardStyle = [styles.card, isDark && styles.cardDark];
  const itemTextStyle = [styles.itemText, isDark && styles.textDark];
  const dividerStyle = [styles.itemDivider, isDark && styles.itemDividerDark];
  const radioDividerStyle = [
    styles.radioDivider,
    isDark && styles.itemDividerDark,
  ];

  return (
    <SafeAreaView style={containerStyle}>
      {/* Header */}
      <View style={headerStyle}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color="#007AFF"
            style={styles.backIcon}
          />
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>

        <Text style={titleStyle}>Configuración</Text>

        <View style={styles.spacer} />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View style={styles.appIcon}>
            <MaterialCommunityIcons name="equalizer" size={36} color="white" />
          </View>
          <Text style={appNameStyle}>StudyBoys</Text>
          <Text style={styles.appVersion}>v1.2.0 (Build 45)</Text>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={sectionTitleStyle}>General</Text>
          <View style={cardStyle}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => toggleSection("Notificaciones")}
            >
              <MaterialCommunityIcons
                name="bell"
                size={24}
                color={isDark ? "#FFFFFF" : "#000000"}
                style={styles.itemIcon}
              />
              <Text style={itemTextStyle}>Notificaciones</Text>
              <Text style={styles.itemRight}>
                {expandedSection === "Notificaciones" ? "▾" : "▸"}
              </Text>
            </TouchableOpacity>
            {expandedSection === "Notificaciones" && (
              <View
                style={[
                  styles.expandedContent,
                  isDark && styles.expandedContentDark,
                ]}
              >
                <View style={styles.switchRow}>
                  <Text
                    style={[styles.expandedText, isDark && styles.textDark]}
                  >
                    Permitir notificaciones
                  </Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: "#767577", true: "#34C759" }}
                  />
                </View>
                <Text style={styles.expandedSubText}>
                  Recibe alertas sobre el estado de tus transcripciones y
                  resúmenes.
                </Text>
              </View>
            )}

            <View style={dividerStyle} />

            <TouchableOpacity
              style={styles.item}
              onPress={() => toggleSection("Apariencia")}
            >
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={24}
                color={isDark ? "#FFFFFF" : "#000000"}
                style={styles.itemIcon}
              />
              <Text style={itemTextStyle}>Apariencia</Text>
              <Text style={styles.itemRight}>
                {theme === "light"
                  ? "Claro "
                  : theme === "dark"
                    ? "Oscuro "
                    : "Auto "}
                {expandedSection === "Apariencia" ? "▾" : "▸"}
              </Text>
            </TouchableOpacity>
            {expandedSection === "Apariencia" && (
              <View
                style={[
                  styles.expandedContent,
                  isDark && styles.expandedContentDark,
                ]}
              >
                <TouchableOpacity
                  style={styles.radioRow}
                  onPress={() => setTheme("light")}
                >
                  <Text
                    style={[styles.expandedText, isDark && styles.textDark]}
                  >
                    Claro
                  </Text>
                  {theme === "light" && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="#007AFF"
                    />
                  )}
                </TouchableOpacity>
                <View style={radioDividerStyle} />
                <TouchableOpacity
                  style={styles.radioRow}
                  onPress={() => setTheme("dark")}
                >
                  <Text
                    style={[styles.expandedText, isDark && styles.textDark]}
                  >
                    Oscuro
                  </Text>
                  {theme === "dark" && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="#007AFF"
                    />
                  )}
                </TouchableOpacity>
                <View style={radioDividerStyle} />
                <TouchableOpacity
                  style={styles.radioRow}
                  onPress={() => setTheme("auto")}
                >
                  <Text
                    style={[styles.expandedText, isDark && styles.textDark]}
                  >
                    Automático
                  </Text>
                  {theme === "auto" && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="#007AFF"
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <Text style={sectionTitleStyle}>Información</Text>
          <View style={cardStyle}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => toggleSection("Acerca")}
            >
              <MaterialCommunityIcons
                name="information"
                size={24}
                color={isDark ? "#FFFFFF" : "#000000"}
                style={styles.itemIcon}
              />
              <Text style={itemTextStyle}>Acerca de StudyBoys</Text>
              <Text style={styles.itemRight}>
                {expandedSection === "Acerca" ? "▾" : "▸"}
              </Text>
            </TouchableOpacity>
            {expandedSection === "Acerca" && (
              <View
                style={[
                  styles.expandedContent,
                  isDark && styles.expandedContentDark,
                ]}
              >
                <Text style={[styles.expandedText, isDark && styles.textDark]}>
                  StudyBoys es un asistente de estudio diseñado para optimizar
                  el aprendizaje mediante la grabación, transcripción y resumen
                  de clases utilizando IA.
                </Text>
                <Text
                  style={[
                    styles.expandedText,
                    { marginTop: 8 },
                    isDark && styles.textDark,
                  ]}
                >
                  Versión: 1.2.0 (Build 45)
                </Text>
              </View>
            )}

            <View style={dividerStyle} />

            <TouchableOpacity
              style={styles.item}
              onPress={() => toggleSection("Terminos")}
            >
              <MaterialCommunityIcons
                name="file-document-outline"
                size={24}
                color={isDark ? "#FFFFFF" : "#000000"}
                style={styles.itemIcon}
              />
              <Text style={itemTextStyle}>Términos y Privacidad</Text>
              <Text style={styles.itemRight}>
                {expandedSection === "Terminos" ? "▾" : "▸"}
              </Text>
            </TouchableOpacity>
            {expandedSection === "Terminos" && (
              <View
                style={[
                  styles.expandedContent,
                  isDark && styles.expandedContentDark,
                ]}
              >
                <Text style={[styles.expandedText, isDark && styles.textDark]}>
                  Al usar StudyBoys, aceptas que procesemos tus grabaciones de
                  audio mediante servicios de terceros con el único fin de
                  generar transcripciones y resúmenes. Tus datos no se comparten
                  con anunciantes.
                </Text>
              </View>
            )}

            <View style={dividerStyle} />

            <TouchableOpacity
              style={styles.item}
              onPress={() => toggleSection("Soporte")}
            >
              <MaterialCommunityIcons
                name="lifebuoy"
                size={24}
                color={isDark ? "#FFFFFF" : "#000000"}
                style={styles.itemIcon}
              />
              <Text style={itemTextStyle}>Soporte</Text>
              <Text style={styles.itemRight}>
                {expandedSection === "Soporte" ? "▾" : "▸"}
              </Text>
            </TouchableOpacity>
            {expandedSection === "Soporte" && (
              <View
                style={[
                  styles.expandedContent,
                  isDark && styles.expandedContentDark,
                ]}
              >
                <Text
                  style={[
                    styles.expandedText,
                    { marginBottom: 12 },
                    isDark && styles.textDark,
                  ]}
                >
                  ¿Tienes problemas o sugerencias? Contáctanos por los
                  siguientes medios:
                </Text>
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() =>
                    Linking.openURL("mailto:soporte@studyboyz.com")
                  }
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.linkText}>soporte@studyboyz.com</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL("tel:+12345678900")}
                >
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.linkText}>+1 234 567 8900</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteData}>
            <MaterialCommunityIcons
              name="delete"
              size={24}
              color="white"
              style={styles.deleteBtnIcon}
            />
            <Text style={styles.deleteBtnText}>Eliminar todos los datos</Text>
          </TouchableOpacity>
          <Text style={styles.warningText}>
            Esta acción eliminará permanentemente todas tus grabaciones y
            transcripciones. No se puede deshacer.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    height: 50,
    paddingHorizontal: 12,
    zIndex: 1000,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backIcon: {
    marginRight: 4,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 17,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    color: "#000000",
  },
  spacer: {
    width: 60,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 70,
  },
  appHeader: {
    alignItems: "center",
    marginVertical: 30,
  },
  appIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(59, 130, 246, 0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    color: "#000000",
  },
  appVersion: {
    fontSize: 14,
    color: "#3C3C43",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  itemIcon: {
    marginRight: 12,
    width: 24,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  itemRight: {
    fontSize: 16,
    color: "#8E8E93",
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginLeft: 52,
  },
  dangerZone: {
    marginBottom: 30,
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "100%",
    marginBottom: 12,
  },
  deleteBtnIcon: {
    marginRight: 8,
  },
  deleteBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 18,
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
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
  },
  activeTab: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 4,
  },
  activeTabLabel: {
    color: "#007AFF",
  },
  // Estilos añadidos para las secciones desplegables y modo oscuro
  containerDark: {
    backgroundColor: "#000000",
  },
  stickyHeaderDark: {
    backgroundColor: "#1C1C1E",
    borderBottomColor: "#38383A",
  },
  textDark: {
    color: "#FFFFFF",
  },
  cardDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#38383A",
  },
  itemDividerDark: {
    backgroundColor: "#38383A",
  },
  expandedContent: {
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  expandedContentDark: {
    backgroundColor: "#2C2C2E",
    borderTopColor: "#38383A",
  },
  expandedText: {
    fontSize: 15,
    color: "#333333",
    lineHeight: 22,
  },
  expandedSubText: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 6,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  radioDivider: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: "#007AFF",
    marginLeft: 12,
  },
});

export default Configuracion;
