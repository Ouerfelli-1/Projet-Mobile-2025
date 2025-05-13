"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Switch, Image } from "react-native"
import { useSecurity } from "../context/SecurityContext"
import { useTheme } from "../context/ThemeContext"
import Feather from "react-native-vector-icons/Feather"

const SettingsScreen = () => {
  const { apiKey, setApiKey, clearHistory } = useSecurity()
  const { theme, isDarkMode, toggleTheme } = useTheme()
  const [newApiKey, setNewApiKey] = useState(apiKey || "")
  const [showApiKey, setShowApiKey] = useState(false)
  const [autoScan, setAutoScan] = useState(false)
  const [notifications, setNotifications] = useState(true)

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) {
      Alert.alert("Error", "Please enter a valid API key")
      return
    }

    try {
      await setApiKey(newApiKey.trim())
      Alert.alert("Success", "API key saved successfully")
    } catch (error) {
      Alert.alert("Error", "Failed to save API key")
    }
  }

  const handleClearHistory = () => {
    Alert.alert("Clear History", "Are you sure you want to clear all scan history? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await clearHistory()
            Alert.alert("Success", "Scan history cleared successfully")
          } catch (error) {
            Alert.alert("Error", "Failed to clear scan history")
          }
        },
      },
    ])
  }

  const showApiKeyHelp = () => {
    Alert.alert(
      "VirusTotal API Key",
      "To use the scanning features, you need a VirusTotal API key. You can get one by signing up for a free account at virustotal.com and accessing your API key from your profile settings.",
      [{ text: "OK" }],
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>API Configuration</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>VirusTotal API Key</Text>
          <View
            style={[styles.apiKeyInputContainer, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
          >
            <Feather name="key" size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={newApiKey}
              onChangeText={setNewApiKey}
              placeholder="Enter your VirusTotal API key"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.apiKeyActions}>
            <TouchableOpacity style={styles.helpButton} onPress={showApiKeyHelp}>
              <Feather name="help-circle" size={20} color={theme.primary} />
              <Text style={[styles.helpButtonText, { color: theme.primary }]}>How to get an API key</Text>
            </TouchableOpacity>

            <View style={styles.showKeyContainer}>
              <Text style={[styles.showKeyText, { color: theme.textSecondary }]}>Show key</Text>
              <Switch
                value={showApiKey}
                onValueChange={setShowApiKey}
                trackColor={{ false: theme.border, true: `${theme.primary}80` }}
                thumbColor={showApiKey ? theme.primary : theme.card}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSaveApiKey}>
            <Feather name="save" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save API Key</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
        </View>

        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingLabelContainer}>
            {isDarkMode ? (
              <Feather name="moon" size={20} color={theme.textSecondary} style={styles.settingIcon} />
            ) : (
              <Feather name="sun" size={20} color={theme.textSecondary} style={styles.settingIcon} />
            )}
            <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: `${theme.primary}80` }}
            thumbColor={isDarkMode ? theme.primary : theme.card}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Auto-Scan</Text>
          <Switch
            value={autoScan}
            onValueChange={setAutoScan}
            trackColor={{ false: theme.border, true: `${theme.primary}80` }}
            thumbColor={autoScan ? theme.primary : theme.card}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: theme.border, true: `${theme.primary}80` }}
            thumbColor={notifications ? theme.primary : theme.card}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>
        </View>

        <TouchableOpacity style={[styles.dangerButton, { backgroundColor: theme.danger }]} onPress={handleClearHistory}>
          <Feather name="trash-2" size={20} color="#ffffff" />
          <Text style={styles.dangerButtonText}>Clear Scan History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.aboutSection}>
        <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Safe Companion v1.0.0</Text>
        <Text style={[styles.copyright, { color: theme.textSecondary }]}>© 2025 Safe Companion</Text>
        <Text style={[styles.developers, { color: theme.textSecondary }]}>Developed by Amine & Louay</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  section: {
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  apiKeyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  apiKeyActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  showKeyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  showKeyText: {
    marginRight: 8,
    fontSize: 14,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  dangerButton: {
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
  aboutSection: {
    margin: 16,
    alignItems: "center",
    paddingVertical: 16,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    marginBottom: 4,
  },
  developers: {
    fontSize: 12,
  },
})

export default SettingsScreen
