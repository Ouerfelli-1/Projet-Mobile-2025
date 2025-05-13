"use client"

import { useEffect, useState } from "react"
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Feather from "react-native-vector-icons/Feather"

import SplashScreen from "./screens/SplashScreen"
import HomeScreen from "./screens/HomeScreen"
import SettingsScreen from "./screens/SettingsScreen"
import ShredScreen from "./screens/ShredScreen"
import ScanScreen from "./screens/ScanScreen"

import { SecurityProvider } from "./context/SecurityContext"
import { ThemeProvider, useTheme } from "./context/ThemeContext"

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <ThemeProvider>
      <SecurityProvider>
        <AppContent />
      </SecurityProvider>
    </ThemeProvider>
  )
}

function AppContent() {
  const { theme, isDarkMode } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [hasApiKey, setHasApiKey] = useState(false)

  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  }

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const apiKey = await AsyncStorage.getItem("virusTotalApiKey")
        setHasApiKey(!!apiKey)

        setTimeout(() => {
          setIsLoading(false)
        }, 2000)
      } catch (error) {
        setIsLoading(false)
      }
    }

    checkApiKey()
  }, [])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.card} />
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.textSecondary,
            tabBarStyle: {
              height: 60,
              paddingBottom: 10,
              paddingTop: 5,
              backgroundColor: theme.card,
              borderTopColor: theme.border,
            },
            headerStyle: {
              backgroundColor: theme.card,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            },
            headerTitleStyle: {
              fontWeight: "600",
              fontSize: 18,
              color: theme.text,
            },
          }}
          initialRouteName={hasApiKey ? "Home" : "Settings"}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Scan"
            component={ScanScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Feather name="search" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Shred"
            component={ShredScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Feather name="trash-2" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Feather name="settings" color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
