"use client"

import { createContext, useContext, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useColorScheme } from "react-native"


export const lightTheme = {
  background: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  textSecondary: "#64748b",
  border: "#e2e8f0",
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  warningLight: "#fef3c7",
  successLight: "#dcfce7",
  inputBackground: "#ffffff",
  statusBarStyle: "dark-content",
}

export const darkTheme = {
  background: "#0f172a",
  card: "#1e293b",
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  border: "#334155",
  primary: "#3b82f6",
  primaryLight: "#1e3a8a",
  success: "#4ade80",
  warning: "#facc15",
  danger: "#f87171",
  dangerLight: "#7f1d1d",
  warningLight: "#78350f",
  successLight: "#14532d",
  inputBackground: "#1e293b",
  statusBarStyle: "light-content",
}

const ThemeContext = createContext(undefined)

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("themePreference")

        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === "dark")
        } else {
          setIsDarkMode(systemColorScheme === "dark")
        }
      } catch (error) {
        console.error("Error loading theme preference:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadThemePreference()
  }, [systemColorScheme])

  useEffect(() => {
    if (!isLoading) {
      const saveThemePreference = async () => {
        try {
          await AsyncStorage.setItem("themePreference", isDarkMode ? "dark" : "light")
        } catch (error) {
          console.error("Error saving theme preference:", error)
        }
      }

      saveThemePreference()
    }
  }, [isDarkMode, isLoading])

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev)
  }

  const theme = isDarkMode ? darkTheme : lightTheme

  return <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
