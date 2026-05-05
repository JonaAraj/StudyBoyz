import React, { createContext, useState, useEffect, useContext } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeType = "light" | "dark" | "auto";

interface ThemeContextData {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>("auto");

  // Cargar preferencia guardada al iniciar la app
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("@theme_preference");
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error("Error al cargar el tema:", error);
      }
    };
    loadTheme();
  }, []);

  // Función para cambiar el tema y guardarlo en el almacenamiento local
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem("@theme_preference", newTheme);
    } catch (error) {
      console.error("Error al guardar el tema:", error);
    }
  };

  // Determinar si el modo oscuro está activo basado en la selección o en el sistema
  const isDark =
    theme === "auto" ? systemColorScheme === "dark" : theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
