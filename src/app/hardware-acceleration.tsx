"use client"

import { useEffect } from "react"

export function HardwareAcceleration() {
  useEffect(() => {
    // Make sure we're in the browser environment
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Remove hardware acceleration class from body if it exists
      document.body.classList.remove("hw-accel")

      // Add a class to explicitly disable hardware acceleration
      document.body.classList.add("no-hw-accel")
    }

    // Cleanup when component unmounts
    return () => {
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        document.body.classList.remove("no-hw-accel")
      }
    }
  }, []) // Empty dependency array means this runs once on mount

  // This component doesn't render anything
  return null
}
