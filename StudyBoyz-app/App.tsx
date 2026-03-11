import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Login from "./Front-end/src/screens/Login";
import { Subjects } from "./Front-end/src/screens/Subjects";
import RecordingPage from "./Front-end/src/screens/RecordingPage";
import Configuracion from "./Front-end/src/screens/Configuracion";
import Recientes from "./Front-end/src/screens/Recientes";
import SubjectDetail from "./Front-end/src/screens/SubjectDetail";
import type { Subject as SubjectType } from "./Front-end/services/subjectService";

type Screen =
  | "login"
  | "recording"
  | "subjects"
  | "configuracion"
  | "recientes"
  | "subjectDetail";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");

  // Estado para SubjectDetail
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | null>(
    null,
  );
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState<number>(0);

  // ── Navegación ───────────────────────────────────────────
  const navigateTo = (screen: Screen) => setCurrentScreen(screen);

  const navigateToSubjectDetail = (subject: SubjectType, index: number) => {
    setSelectedSubject(subject);
    setSelectedSubjectIndex(index);
    setCurrentScreen("subjectDetail");
  };

  return (
    <View style={styles.container}>
      {currentScreen === "login" && (
        <Login onLogin={() => navigateTo("recording")} />
      )}

      {currentScreen === "recording" && (
        <RecordingPage
          onNavigateToSubjects={() => navigateTo("subjects")}
          onNavigateToRecientes={() => navigateTo("recientes")}
        />
      )}

      {currentScreen === "recientes" && (
        <Recientes onNavigateToRecording={() => navigateTo("recording")} />
      )}

      {currentScreen === "subjects" && (
        <Subjects
          onNavigateToRecording={() => navigateTo("recording")}
          onNavigateToConfiguracion={() => navigateTo("configuracion")}
          onNavigateToRecientes={() => navigateTo("recientes")}
          onNavigateToSubjectDetail={navigateToSubjectDetail}
        />
      )}

      {currentScreen === "subjectDetail" && selectedSubject && (
        <SubjectDetail
          subject={selectedSubject}
          subjectIndex={selectedSubjectIndex}
          onBack={() => navigateTo("subjects")}
          onNavigateToRecording={() => navigateTo("recording")}
        />
      )}

      {currentScreen === "configuracion" && (
        <Configuracion onNavigateBack={() => navigateTo("subjects")} />
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
