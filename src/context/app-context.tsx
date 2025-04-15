"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useTheme } from "next-themes"

type AppContextType = {
  // Watchlist
  watchlist: string[]
  addToWatchlist: (symbols: string[]) => void
  removeFromWatchlist: (symbol: string) => void
  clearWatchlist: () => void
  isInWatchlist: (symbol: string) => boolean
  reorderWatchlist: (newOrder: string[]) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Safe localStorage getter
const getStorageItem = (key: string): any => {
  if (typeof window === "undefined") return null;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage:`, error);
    return null;
  }
};

// Safe localStorage setter
const setStorageItem = (key: string, value: any): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { setTheme, theme } = useTheme()

  // Initialize states with empty arrays (we'll load from localStorage in useEffect)
  const [watchlist, setWatchlist] = useState<string[]>([])

  // Flag to prevent re-running the initial load effect
  const [isInitialized, setIsInitialized] = useState(false)

  // Load saved data from localStorage on initial load (only once)
  useEffect(() => {
    if (isInitialized || typeof window === "undefined") return;

    // Load watchlist
    const savedWatchlist = getStorageItem("symbolWatchlist");
    if (savedWatchlist) {
      setWatchlist(savedWatchlist);
    }

    // Load and apply theme preference
    const savedTheme = localStorage.getItem("preferredTheme");
    if (savedTheme && setTheme) {
      setTheme(savedTheme);
    }

    // Mark as initialized to prevent re-runs
    setIsInitialized(true);
  }, [isInitialized, setTheme]);

  // Save theme preference whenever it changes
  useEffect(() => {
    if (typeof window === "undefined" || !theme) return;
    localStorage.setItem("preferredTheme", theme);
  }, [theme]);

  // Watchlist functions with useCallback
  const addToWatchlist = useCallback((symbols: string[]) => {
    setWatchlist(prev => {
      // Create a new Set to remove duplicates
      const uniqueSymbols = new Set([...prev, ...symbols]);
      const updated = Array.from(uniqueSymbols);
      // Save to localStorage
      setStorageItem("symbolWatchlist", updated);
      return updated;
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const updated = prev.filter(s => s !== symbol);
      // Save to localStorage
      setStorageItem("symbolWatchlist", updated);
      return updated;
    });
  }, []);

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("symbolWatchlist");
    }
  }, []);

  const isInWatchlist = useCallback((symbol: string) => {
    return watchlist.includes(symbol);
  }, [watchlist]);

  // Reorder watchlist with useCallback
  const reorderWatchlist = useCallback((newOrder: string[]) => {
    setWatchlist(newOrder);
    setStorageItem("symbolWatchlist", newOrder);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    isInWatchlist,
    reorderWatchlist
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
