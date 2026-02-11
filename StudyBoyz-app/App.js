
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Login from "./Front-end/src/screens/Login";
import RecordingPage from "./Front-end/src/screens/RecordingPage";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  return (
    <View style={styles.container}>
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
