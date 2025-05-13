"use client"

import { useEffect } from "react"
import { View, StyleSheet, Animated, Easing, Image } from "react-native"
import { useTheme } from "../context/ThemeContext"

const SplashScreen = () => {
  const { theme } = useTheme()
  const scaleAnim = new Animated.Value(0.5)
  const opacityAnim = new Animated.Value(0)

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image source={require("../assets/logo.png")} style={styles.logo} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  appName: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "bold",
  },
})

export default SplashScreen
