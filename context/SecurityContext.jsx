"use client"

import { createContext, useState, useEffect, useContext } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const SecurityContext = createContext(undefined)

export const SecurityProvider = ({ children }) => {
  const [apiKey, setApiKeyState] = useState(null)
  const [scanHistory, setScanHistory] = useState([])
  const [deviceStatus, setDeviceStatus] = useState("red")

  
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedApiKey = await AsyncStorage.getItem("virusTotalApiKey")
        const storedHistory = await AsyncStorage.getItem("scanHistory")

        if (storedApiKey) {
          setApiKeyState(storedApiKey)
        }

        if (storedHistory) {
          setScanHistory(JSON.parse(storedHistory))
        }
      } catch (error) {
        console.error("Error loading data from AsyncStorage:", error)
      }
    }

    loadData()
  }, [])


  useEffect(() => {
    if (scanHistory.length === 0) {
      setDeviceStatus("red")
      return
    }

    const lastScanDate = new Date(scanHistory[0].date)
    const currentDate = new Date()
    const daysDifference = Math.floor((currentDate.getTime() - lastScanDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDifference <= 1) {
      setDeviceStatus("green")
    } else if (daysDifference <= 7) {
      setDeviceStatus("yellow")
    } else {
      setDeviceStatus("red")
    }
  }, [scanHistory])

  const setApiKey = async (key) => {
    try {
      await AsyncStorage.setItem("virusTotalApiKey", key)
      setApiKeyState(key)
    } catch (error) {
      console.error("Error saving API key:", error)
      throw error
    }
  }

  const addScanResult = async (result) => {
    try {
      const newResult = {
        ...result,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      }

      const updatedHistory = [newResult, ...scanHistory]
      await AsyncStorage.setItem("scanHistory", JSON.stringify(updatedHistory))
      setScanHistory(updatedHistory)
    } catch (error) {
      console.error("Error adding scan result:", error)
      throw error
    }
  }

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem("scanHistory")
      setScanHistory([])
    } catch (error) {
      console.error("Error clearing history:", error)
      throw error
    }
  }

  return (
    <SecurityContext.Provider
      value={{
        apiKey,
        setApiKey,
        scanHistory,
        addScanResult,
        deviceStatus,
        clearHistory,
      }}
    >
      {children}
    </SecurityContext.Provider>
  )
}

export const useSecurity = () => {
  const context = useContext(SecurityContext)
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider")
  }
  return context
}
