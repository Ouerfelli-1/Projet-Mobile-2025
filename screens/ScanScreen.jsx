"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native"
import { useSecurity } from "../context/SecurityContext"
import { useTheme } from "../context/ThemeContext"
import Feather from "react-native-vector-icons/Feather"
import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system"

const ScanScreen = () => {
  const { apiKey, addScanResult } = useSecurity()
  const { theme } = useTheme()
  const [scanTarget, setScanTarget] = useState("")
  const [scanType, setScanType] = useState("file") 
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      })

      console.log("Document picker result:", result)
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0]
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
        })
        setScanTarget(file.name)
        console.log("File selected (new API):", file.name)
      }
      else if (result.type === "success") {
        setSelectedFile(result)
        setScanTarget(result.name)
        console.log("File selected (legacy API):", result.name)
      } else {
        console.log("File selection cancelled or failed")
      }
    } catch (err) {
      console.error("Error picking document:", err)
      Alert.alert("Error", "Failed to select file")
    }
  }

  const scanFile = async (fileUri, fileName) => {
    try {

      const fileInfo = await FileSystem.getInfoAsync(fileUri)
      if (!fileInfo.exists) {
        throw new Error("File not found or inaccessible")
      }

            const urlResponse = await fetch("https://www.virustotal.com/api/v3/files/upload_url", {
        method: "GET",
        headers: {
          "x-apikey": apiKey,
        },
      })

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json()
        throw new Error(errorData.error?.message || `API Error: ${urlResponse.status}`)
      }

      const urlData = await urlResponse.json()
      const uploadUrl = urlData.data

            const formData = new FormData()
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: "application/octet-stream",
      })

            const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "x-apikey": apiKey,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        },
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error?.message || `API Error: ${uploadResponse.status}`)
      }

      const uploadData = await uploadResponse.json()
      const analysisId = uploadData.data.id

            let analysisComplete = false
      let analysisResult
      let attempts = 0

      while (!analysisComplete && attempts < 30) {
        attempts++

                await new Promise((resolve) => setTimeout(resolve, 2000))

        const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
          method: "GET",
          headers: {
            "x-apikey": apiKey,
          },
        })

        if (!analysisResponse.ok) {
          continue
        }

        analysisResult = await analysisResponse.json()

        if (analysisResult.data.attributes.status === "completed") {
          analysisComplete = true

                    const fileHash = analysisResult.meta.file_info.sha256

                    return await scanFileHash(fileHash)
        }
      }

      if (!analysisComplete) {
        throw new Error("Analysis timed out. Please try again later.")
      }

      return analysisResult
    } catch (error) {
      throw new Error(`File scan failed: ${error.message}`)
    }
  }

    const performScan = async () => {
    if (!apiKey) {
      Alert.alert(
        "API Key Required",
        "Please configure your VirusTotal API key in the Settings screen before scanning.",
        [{ text: "OK" }],
      )
      return
    }

    if (scanType === "file" && !selectedFile) {
      Alert.alert("Error", "Please select a file to scan")
      return
    } else if (scanType !== "file" && !scanTarget.trim()) {
      Alert.alert("Error", "Please enter a valid file hash, URL, or IP address")
      return
    }

    setIsScanning(true)
    setScanResults(null)
    setUploadProgress(0)

    try {
      let result

      switch (scanType) {
        case "file":
          result = await scanFile(selectedFile.uri, selectedFile.name)
          break
        case "filehash":
          result = await scanFileHash(scanTarget.trim())
          break
        case "url":
          result = await scanUrl(scanTarget.trim())
          break
        case "ip":
          result = await scanIpAddress(scanTarget.trim())
          break
        default:
          throw new Error("Invalid scan type")
      }

      setScanResults(result)

            const resultStatus =
        result.stats.malicious > 0 ? "malicious" : result.stats.suspicious > 0 ? "suspicious" : "clean"

            await addScanResult({
        target: scanType === "file" ? selectedFile.name : scanTarget,
        type: scanType,
        result: result.stats,
        status: resultStatus,
      })

            await saveResultsToFile(result)
    } catch (error) {
      console.error("Error performing scan:", error)
      Alert.alert("Error", `Failed to perform scan: ${error.message}`)
    } finally {
      setIsScanning(false)
      setUploadProgress(0)
    }
  }

    const scanFileHash = async (hash) => {
        const hashRegex = /^[a-fA-F0-9]{32,64}$/
    if (!hashRegex.test(hash)) {
      throw new Error("Invalid hash format. Please enter a valid MD5, SHA-1, or SHA-256 hash.")
    }

    try {
      const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
        method: "GET",
        headers: {
          "x-apikey": apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      return processFileResponse(data)
    } catch (error) {
      throw new Error(`File hash scan failed: ${error.message}`)
    }
  }

  const scanUrl = async (url) => {
        try {
      new URL(url)     } catch (e) {
      throw new Error("Invalid URL format. Please enter a valid URL including http://    ")}

    try {
            const urlId = btoa(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

            const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
        method: "GET",
        headers: {
          "x-apikey": apiKey,
          "Content-Type": "application/json",
        },
      })

            if (!response.ok) {
                const formData = new URLSearchParams()
        formData.append("url", url)

        const submitResponse = await fetch("https://www.virustotal.com/api/v3/urls", {
          method: "POST",
          headers: {
            "x-apikey": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        })

        if (!submitResponse.ok) {
          const errorData = await submitResponse.json()
          throw new Error(errorData.error?.message || `API Error: ${submitResponse.status}`)
        }

        const submitData = await submitResponse.json()
        const analysisId = submitData.data.id

                let analysisComplete = false
        let analysisResult
        let attempts = 0

        while (!analysisComplete && attempts < 10) {
          attempts++

                    await new Promise((resolve) => setTimeout(resolve, 2000))

          const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
            method: "GET",
            headers: {
              "x-apikey": apiKey,
            },
          })

          if (!analysisResponse.ok) {
            continue
          }

          analysisResult = await analysisResponse.json()

          if (analysisResult.data.attributes.status === "completed") {
            analysisComplete = true
          }
        }

        if (!analysisComplete) {
          throw new Error("Analysis timed out. Please try again later.")
        }

                const finalResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
          method: "GET",
          headers: {
            "x-apikey": apiKey,
          },
        })

        if (!finalResponse.ok) {
          const errorData = await finalResponse.json()
          throw new Error(errorData.error?.message || `API Error: ${finalResponse.status}`)
        }

        const data = await finalResponse.json()
        return processUrlResponse(data)
      } else {
                const data = await response.json()
        return processUrlResponse(data)
      }
    } catch (error) {
      throw new Error(`URL scan failed: ${error.message}`)
    }
  }

  const scanIpAddress = async (ip) => {
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    if (!ipRegex.test(ip)) {
      throw new Error("Invalid IP address format. Please enter a valid IPv4 address.")
    }

    try {
      const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
        method: "GET",
        headers: {
          "x-apikey": apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      return processIpResponse(data)
    } catch (error) {
      throw new Error(`IP address scan failed: ${error.message}`)
    }
  }

    const processFileResponse = (data) => {
    const attributes = data.data.attributes
    const lastAnalysisResults = attributes.last_analysis_results || {}
    const lastAnalysisStats = attributes.last_analysis_stats || {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
    }

        const engines = {}
    Object.entries(lastAnalysisResults).forEach(([engineName, result]) => {
      engines[engineName] = {
        category: result.category,
        result: result.result,
        method: result.method || "unknown",
        engine_name: engineName,
      }
    })

    return {
      scan_id: data.data.id,
      resource: data.data.id,
      scan_date: attributes.last_analysis_date
        ? new Date(attributes.last_analysis_date * 1000).toISOString()
        : new Date().toISOString(),
      stats: lastAnalysisStats,
      engines: engines,
      additional_info: {
        file_type: attributes.type_description,
        file_size: attributes.size,
        md5: attributes.md5,
        sha1: attributes.sha1,
        sha256: attributes.sha256,
      },
    }
  }

  const processUrlResponse = (data) => {
    const attributes = data.data.attributes
    const lastAnalysisResults = attributes.last_analysis_results || {}
    const lastAnalysisStats = attributes.last_analysis_stats || {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
    }

        const engines = {}
    Object.entries(lastAnalysisResults).forEach(([engineName, result]) => {
      engines[engineName] = {
        category: result.category,
        result: result.result,
        method: result.method || "unknown",
        engine_name: engineName,
      }
    })

    return {
      scan_id: data.data.id,
      resource: data.data.id,
      scan_date: attributes.last_analysis_date
        ? new Date(attributes.last_analysis_date * 1000).toISOString()
        : new Date().toISOString(),
      stats: lastAnalysisStats,
      engines: engines,
    }
  }

  const processIpResponse = (data) => {
    const attributes = data.data.attributes
    const lastAnalysisResults = attributes.last_analysis_results || {}
    const lastAnalysisStats = attributes.last_analysis_stats || {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
    }

        const engines = {}
    Object.entries(lastAnalysisResults).forEach(([engineName, result]) => {
      engines[engineName] = {
        category: result.category,
        result: result.result,
        method: result.method || "unknown",
        engine_name: engineName,
      }
    })

    return {
      scan_id: data.data.id,
      resource: data.data.id,
      scan_date: attributes.last_analysis_date
        ? new Date(attributes.last_analysis_date * 1000).toISOString()
        : new Date().toISOString(),
      stats: lastAnalysisStats,
      engines: engines,
    }
  }

  const saveResultsToFile = async (results) => {
    try {
      const filename = `scan_results_${new Date().toISOString()}.json`
      const fileUri = FileSystem.documentDirectory + filename
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(results, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      })
      console.log(`Scan results saved to ${fileUri}`)
      Alert.alert("Scan Results Saved", `Scan results saved to ${filename}`)
    } catch (error) {
      console.error("Error saving scan results:", error)
      Alert.alert("Error", "Failed to save scan results to file")
    }
  }

    const getPlaceholderText = () => {
    switch (scanType) {
      case "filehash":
        return "Enter file hash (MD5, SHA-1, SHA-256)"
      case "url":
        return "Enter URL to scan"
      case "ip":
        return "Enter IP address to scan"
      default:
        return "Enter scan target"
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Scan Target</Text>

      <View style={styles.scanTypeContainer}>
        <TouchableOpacity
          style={[
            styles.scanTypeButton,
            {
              backgroundColor: scanType === "file" ? theme.primary : theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setScanType("file")}
        >
          <Text style={[styles.scanTypeButtonText, { color: scanType === "file" ? "#ffffff" : theme.text }]}>File</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.scanTypeButton,
            {
              backgroundColor: scanType === "filehash" ? theme.primary : theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setScanType("filehash")}
        >
          <Text style={[styles.scanTypeButtonText, { color: scanType === "filehash" ? "#ffffff" : theme.text }]}>
            File Hash
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.scanTypeButton,
            {
              backgroundColor: scanType === "url" ? theme.primary : theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setScanType("url")}
        >
          <Text style={[styles.scanTypeButtonText, { color: scanType === "url" ? "#ffffff" : theme.text }]}>URL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.scanTypeButton,
            {
              backgroundColor: scanType === "ip" ? theme.primary : theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setScanType("ip")}
        >
          <Text style={[styles.scanTypeButtonText, { color: scanType === "ip" ? "#ffffff" : theme.text }]}>
            IP Address
          </Text>
        </TouchableOpacity>
      </View>

      {scanType === "file" ? (
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Select File</Text>
          <TouchableOpacity
            style={[styles.filePickerButton, { borderColor: theme.primary, borderWidth: 2 }]}
            onPress={pickFile}
          >
            <Feather name="search" size={20} color={theme.primary} />
            <Text style={[styles.filePickerText, { color: theme.primary }]}>
              {selectedFile ? "Change File" : "Choose a file"}
            </Text>
          </TouchableOpacity>
          {selectedFile && (
            <View
              style={[
                styles.selectedFileContainer,
                {
                  marginTop: 10,
                  backgroundColor: theme.primaryLight,
                  borderColor: theme.primary,
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.fileIconContainer}>
                <Feather name="search" size={20} color={theme.primary} />
              </View>
              <View style={styles.fileDetails}>
                <Text style={[styles.fileName, { color: theme.text }]}>{selectedFile.name}</Text>
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                  {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Size unknown"}
                </Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            {scanType === "filehash" ? "File Hash" : scanType === "url" ? "URL" : "IP Address"}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.border,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
            placeholder={getPlaceholderText()}
            placeholderTextColor={theme.textSecondary}
            value={scanTarget}
            onChangeText={setScanTarget}
          />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.scanButton,
          { backgroundColor: isScanning ? theme.textSecondary : theme.success },
          isScanning && styles.scanButtonDisabled,
        ]}
        onPress={performScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.scanButtonText}>Start Scan</Text>
        )}
      </TouchableOpacity>

      {uploadProgress > 0 && scanType === "file" && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${uploadProgress}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>Uploading {uploadProgress}%</Text>
        </View>
      )}

      {scanResults && (
        <View style={[styles.resultsContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.resultsTitle, { color: theme.text }]}>Scan Results</Text>
          <Text style={[styles.resultItem, { color: theme.danger }]}>Malicious: {scanResults.stats.malicious}</Text>
          <Text style={[styles.resultItem, { color: theme.warning }]}>Suspicious: {scanResults.stats.suspicious}</Text>
          <Text style={[styles.resultItem, { color: theme.success }]}>Harmless: {scanResults.stats.harmless}</Text>
          <Text style={[styles.resultItem, { color: theme.textSecondary }]}>
            Undetected: {scanResults.stats.undetected}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
  },
  scanTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  scanTypeButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  scanTypeButtonText: {
    fontSize: 14,
  },
  scanButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 5,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  filePickerButton: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  filePickerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  selectedFileContainer: {
    minHeight: 60,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  fileIconContainer: {
    marginRight: 8,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
})

export default ScanScreen
