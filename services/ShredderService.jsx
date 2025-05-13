import { NativeModules, Platform } from "react-native"

const { Shredder } = NativeModules

export const isShredderAvailable = async () => {
  if (Platform.OS === "android" && Shredder) {
    try {
      return await Shredder.isAvailable()
    } catch (error) {
      return false
    }
  }
  return false
}

export const securelyDeleteFile = async (filePath, passes = 3) => {
  if (Platform.OS === "android" && Shredder) {
    return await Shredder.securelyDeleteFile(filePath, passes)
  } else {
    throw new Error("Shredder module not available on this platform")
  }
}
