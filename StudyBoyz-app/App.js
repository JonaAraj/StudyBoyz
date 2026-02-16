
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Login from "./Front-end/src/screens/Login";
import RecordingPage from "./Front-end/src/screens/RecordingPage";
import { Subject } from "./Front-end/src/screens/Subjects";


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (

    <View style={styles.container}>
      {/*<Subject />}*/}
      {isLoggedIn ? (
        <RecordingPage />
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
