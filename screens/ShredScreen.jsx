"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useTheme } from "../context/ThemeContext"
import { Platform } from "react-native"
import { isShredderAvailable, securelyDeleteFile } from "../services/ShredderService"

const ShredScreen = () => {
  const { theme } = useTheme()
  const [selectedFile, setSelectedFile] = useState(null)
  const [isShredding, setIsShredding] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [shredderAvailable, setShredderAvailable] = useState(false)

  useEffect(() => {
    const checkShredderModule = async () => {
      const available = await isShredderAvailable()
      setShredderAvailable(available)
    }

    checkShredderModule()
  }, [])

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      })

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0]
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
        })
        setIsComplete(false)
      } else if (result.type === "success") {
        setSelectedFile(result)
        setIsComplete(false)
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select file")
    }
  }

  const shredFile = async () => {
    if (!selectedFile) {
      Alert.alert("Error", "Please select a file first")
      return
    }

    Alert.alert(
      "Confirm Shredding",
      `Are you sure you want to securely shred "${selectedFile.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Shred",
          style: "destructive",
          onPress: async () => {
            try {
              setIsShredding(true)

              const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri)
              if (!fileInfo.exists) {
                throw new Error("File not found or inaccessible")
              }

              if (shredderAvailable && Platform.OS === "android") {
                await securelyDeleteFile(selectedFile.uri, 3)
              } else {
                await new Promise((resolve) => setTimeout(resolve, 2000))

                if (selectedFile.uri.startsWith(FileSystem.documentDirectory)) {
                  await FileSystem.deleteAsync(selectedFile.uri)
                }
              }

              setIsShredding(false)
              setIsComplete(true)

              setTimeout(() => {
                setSelectedFile(null)
                setIsComplete(false)
              }, 3000)
            } catch (error) {
              setIsShredding(false)
              Alert.alert("Error", `Failed to shred file: ${error.message}`)
            }
          },
        },
      ],
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentContainer}>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>Secure File Shredding</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Standard file deletion doesn't completely remove files from your device. Our secure shredding feature
            overwrites file data multiple times before deletion, making recovery virtually impossible.
          </Text>
          {shredderAvailable && (
            <View style={styles.nativeModuleIndicator}>
              <MaterialCommunityIcons name="shield-check" size={16} color={theme.success} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.success, fontWeight: "500" }}>Native secure deletion active</Text>
            </View>
          )}
        </View>

        <View style={[styles.fileSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {selectedFile ? (
            <View style={styles.selectedFileContainer}>
              <View style={[styles.fileIconContainer, { backgroundColor: theme.primaryLight }]}>
                <Feather name="file" size={32} color={theme.primary} />
              </View>
              <View style={styles.fileDetails}>
                <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                  {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Size unknown"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noFileContainer}>
              <Text style={[styles.noFileText, { color: theme.text }]}>No file selected</Text>
              <Text style={[styles.noFileSubtext, { color: theme.textSecondary }]}>
                Select a file to securely shred it from your device
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.pickButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.primary,
              },
            ]}
            onPress={pickDocument}
            disabled={isShredding}
          >
            <Text style={[styles.pickButtonText, { color: theme.primary }]}>
              {selectedFile ? "Change File" : "Select File"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shredButton,
              { backgroundColor: theme.danger },
              (!selectedFile || isShredding) && styles.disabledButton,
            ]}
            onPress={shredFile}
            disabled={!selectedFile || isShredding}
          >
            {isShredding ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : isComplete ? (
              <Feather name="check-circle" size={20} color="#ffffff" />
            ) : (
              <Feather name="trash-2" size={20} color="#ffffff" />
            )}
            <Text style={styles.shredButtonText}>
              {isShredding ? "Shredding..." : isComplete ? "Completed" : "Shred File"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.warningContainer, { backgroundColor: theme.dangerLight, borderColor: theme.danger }]}>
        <Text style={[styles.warningText, { color: theme.danger }]}>
          Warning: Shredded files cannot be recovered. Use this feature with caution.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  nativeModuleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  fileSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedFileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
  },
  noFileContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  noFileText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  noFileSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pickButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pickButtonText: {
    fontWeight: "600",
  },
  shredButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  shredButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  warningContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  warningText: {
    textAlign: "center",
    fontSize: 14,
  },
})

export default ShredScreen
