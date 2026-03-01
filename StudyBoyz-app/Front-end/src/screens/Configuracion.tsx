import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type ConfiguracionProps = {
  onNavigateBack?: () => void;
};

const Configuracion = ({ onNavigateBack }: ConfiguracionProps) => {
  const handleBackPress = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  const handleDeleteData = () => {
    // Implementar eliminación de datos
    console.log("Eliminar todos los datos");
  };

  const handleSettingPress = (setting: string) => {
    console.log(`Presionado: ${setting}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color="#007AFF"
            style={styles.backIcon}
          />
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Configuración</Text>

        <View style={styles.spacer} />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View style={styles.appIcon}>
            <MaterialCommunityIcons name="equalizer" size={36} color="white" />
          </View>
          <Text style={styles.appName}>StudyBoys</Text>
          <Text style={styles.appVersion}>v1.2.0 (Build 45)</Text>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSettingPress("Calidad de Audio")}
            >
              <MaterialCommunityIcons
                name="microphone"
                size={24}
                color="#000000"
                style={styles.itemIcon}
              />
              <Text style={styles.itemText}>Calidad de Audio</Text>
              <Text style={styles.itemRight}>Alta ▸</Text>
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSettingPress("Notificaciones")}
            >
              <MaterialCommunityIcons
                name="bell"
                size={24}
                color="#000000"
                style={styles.itemIcon}
              />
              <Text style={styles.itemText}>Notificaciones</Text>
              <Text style={styles.itemRight}>▸</Text>
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSettingPress("Apariencia")}
            >
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={24}
                color="#000000"
                style={styles.itemIcon}
              />
              <Text style={styles.itemText}>Apariencia</Text>
              <Text style={styles.itemRight}>Automático ▸</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSettingPress("Acerca de StudyBoys")}
            >
              <MaterialCommunityIcons
                name="information"
                size={24}
                color="#000000"
                style={styles.itemIcon}
              />
              <Text style={styles.itemText}>Acerca de StudyBoys</Text>
              <Text style={styles.itemRight}>▸</Text>
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSettingPress("Términos y Privacidad")}
            >
              <MaterialCommunityIcons
                name="lock"
                size={24}
                color="#000000"
                style={styles.itemIcon}
              />
              <Text style={styles.itemText}>Términos y Privacidad</Text>
              <Text style={styles.itemRight}>▸</Text>
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSettingPress("Soporte")}
            >
              <MaterialCommunityIcons
                name="lifebuoy"
                size={24}
                color="#000000"
                style={styles.itemIcon}
              />
              <Text style={styles.itemText}>Soporte</Text>
              <Text style={styles.itemRight}>▸</Text>
            </TouchableOpacity>
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
});

export default Configuracion;
