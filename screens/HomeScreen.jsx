"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { useSecurity } from "../context/SecurityContext"
import { useTheme } from "../context/ThemeContext"
import { LineChart } from "react-native-chart-kit"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

const HomeScreen = ({ navigation }) => {
  const { scanHistory, deviceStatus } = useSecurity()
  const { theme, isDarkMode } = useTheme()
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [0], 
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [0], 
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Clean", "Malicious"],
  })

  useEffect(() => {
    if (scanHistory.length > 0) {
      const last7Scans = scanHistory.slice(0, 7).reverse()
      const labels = last7Scans.map((scan) => {
        const date = new Date(scan.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      })

      const cleanData = last7Scans.map((scan) => {
        const value = scan.result.harmless + scan.result.undetected
        return isNaN(value) || !isFinite(value) ? 0 : value
      })

      const maliciousData = last7Scans.map((scan) => {
        const value = scan.result.malicious + scan.result.suspicious
        return isNaN(value) || !isFinite(value) ? 0 : value
      })

      if (cleanData.every((val) => val === 0) && maliciousData.every((val) => val === 0)) {
        cleanData[0] = 1 
      }

      setChartData({
        labels,
        datasets: [
          {
            data: cleanData,
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 2,
          },
          {
            data: maliciousData,
            color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ["Clean", "Malicious"],
      })
    }
  }, [scanHistory])

  const renderStatusIcon = () => {
    switch (deviceStatus) {
      case "green":
        return <MaterialCommunityIcons name="shield-check" size={50} color={theme.success} />
      case "yellow":
        return <Feather name="alert-triangle" size={50} color={theme.warning} />
      case "red":
        return <Feather name="alert-octagon" size={50} color={theme.danger} />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (deviceStatus) {
      case "green":
        return "Your device is secure"
      case "yellow":
        return "Consider scanning your device"
      case "red":
        return "Your device needs a scan"
      default:
        return ""
    }
  }

  const getStatusDescription = () => {
    switch (deviceStatus) {
      case "green":
        return "Recent scan shows no threats"
      case "yellow":
        return "Last scan was within a week"
      case "red":
        return "No scan in over a week"
      default:
        return ""
    }
  }

  const chartConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => (isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`),
    labelColor: (opacity = 1) => (isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
    },
    formatYLabel: (value) => {
      const num = Number.parseFloat(value)
      return isNaN(num) || !isFinite(num) ? "0" : Math.round(num).toString()
    },
    formatXLabel: (value) => {
      return value || ""
    },
  }

  const renderChart = () => {
    try {
      return (
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero={true}
        />
      )
    } catch (error) {
      console.error("Chart rendering error:", error)
      return (
        <View style={[styles.chartErrorContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.chartErrorText, { color: theme.textSecondary }]}>Unable to display chart</Text>
          <Text style={[styles.chartErrorSubtext, { color: theme.textSecondary }]}>Please try again later</Text>
        </View>
      )
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.statusIconContainer}>{renderStatusIcon()}</View>
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusTitle, { color: theme.text }]}>{getStatusText()}</Text>
          <Text style={[styles.statusDescription, { color: theme.textSecondary }]}>{getStatusDescription()}</Text>
        </View>
      </View>
      {scanHistory.length > 0 ? (
        <View style={[styles.chartContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Malicious vs. Clean Ratio</Text>
          {renderChart()}
        </View>
      ) : (
        <View style={[styles.emptyChartContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No scan data available</Text>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("Scan")}
          >
            <Text style={styles.scanButtonText}>Perform a Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.historyContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Scan History</Text>
        {scanHistory.length > 0 ? (
          scanHistory.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              style={[styles.historyItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                console.log("View scan details:", scan.id)
              }}
            >
              <View style={styles.historyItemContent}>
                <View>
                  <Text style={[styles.historyItemTarget, { color: theme.text }]}>{scan.target}</Text>
                  <Text style={[styles.historyItemDate, { color: theme.textSecondary }]}>
                    {new Date(scan.date).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.historyItemRight}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor:
                          scan.status === "clean"
                            ? theme.success
                            : scan.status === "suspicious"
                              ? theme.warning
                              : theme.danger,
                      },
                    ]}
                  />
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyHistory}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No scan history available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusCard: {
    borderRadius: 12,
    padding: 20,
    margin: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusIconContainer: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyChartContainer: {
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 0,
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    paddingRight: 16,
  },
  chartErrorContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  chartErrorText: {
    fontSize: 16,
    fontWeight: "500",
  },
  chartErrorSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  historyContainer: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyItemTarget: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 13,
  },
  historyItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  emptyHistory: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  scanButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  scanButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
})

export default HomeScreen
