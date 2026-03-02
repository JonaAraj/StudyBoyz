import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Login from "./Front-end/src/screens/Login";
import { Subject } from "./Front-end/src/screens/Subjects";
import RecordingPage from "./Front-end/src/screens/RecordingPage";
import Configuracion from "./Front-end/src/screens/Configuracion";
import Recientes from "./Front-end/src/screens/Recientes";

type Screen =
  | "login"
  | "recording"
  | "subjects"
  | "configuracion"
  | "recientes";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");

  const handleLogin = () => {
    setCurrentScreen("recording");
  };

  const navigateToSubjects = () => {
    setCurrentScreen("subjects");
  };

  const navigateToRecording = () => {
    setCurrentScreen("recording");
  };

  const navigateToConfiguracion = () => {
    setCurrentScreen("configuracion");
  };

  const navigateToRecientes = () => setCurrentScreen("recientes");

  return (
    <View style={styles.container}>
      {currentScreen === "login" && <Login onLogin={handleLogin} />}
      {currentScreen === "recording" && (
        <RecordingPage onNavigateToSubjects={navigateToSubjects} />
      )}
      {currentScreen === "recientes" && (
        <Recientes onNavigateToRecording={navigateToRecording} />
      )}
      {currentScreen === "subjects" && (
        <Subject
          onNavigateToRecording={navigateToRecording}
          onNavigateToConfiguracion={navigateToConfiguracion}
          onNavigateToRecientes={navigateToRecientes}
        />
      )}
      {currentScreen === "configuracion" && (
        <Configuracion onNavigateBack={navigateToSubjects} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
