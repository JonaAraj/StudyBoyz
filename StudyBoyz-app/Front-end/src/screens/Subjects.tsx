import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Card } from "../../components/Card";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type SubjectsProps = {
  onNavigateToRecording?: () => void;
  onNavigateToConfiguracion?: () => void;
};

export const Subject = ({
  onNavigateToRecording,
  onNavigateToConfiguracion,
}: SubjectsProps) => {
  interface Subject {
    title: string;
    icon: ComponentProps<typeof Ionicons>["name"];
    notes: string;
    color: "blue" | "red" | "green" | "yellow" | "purple";
  }

  const subjects: Subject[] = [
    {
      title: "Matemáticas",
      icon: "calculator",
      notes: "12 notas",
      color: "blue",
    },
    { title: "Historia", icon: "book", notes: "8 notas", color: "yellow" },
    { title: "Biología", icon: "leaf", notes: "24 notas", color: "green" },
    { title: "Literatura", icon: "library", notes: "5 notas", color: "purple" },
    { title: "Física", icon: "flask", notes: "15 notas", color: "blue" },
    { title: "Química", icon: "beaker", notes: "9 notas", color: "green" },
  ];

  //  El componente del título y la lupa
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
      <FlatList
        data={subjects}
        numColumns={2}
        keyExtractor={(item) => item.title}
        ListHeaderComponent={Header}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <Card
              title={item.title}
              icon={item.icon}
              notes={item.notes}
              color={item.color}
            />
          </View>
        )}
      />

      {}
      <TouchableOpacity style={styles.fab} activeOpacity={0.7}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Navigation Tab Bar */}
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

        <TouchableOpacity style={styles.tabItem}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 40,
    marginBottom: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A2130",
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  searchButton: {
    padding: 8,
  },
  row: {
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 15,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    backgroundColor: "#4285F4",
    width: 65,
    height: 65,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    // Sombras
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
