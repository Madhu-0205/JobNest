"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setModeCookie } from "./server-actions";

export type AppMode = "LOCAL" | "PRO";

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

interface ModeProviderProps {
  children: ReactNode;
  initialMode?: AppMode;
}

export function ModeProvider({ children, initialMode = "LOCAL" }: ModeProviderProps) {
  const [mode, setModeState] = useState<AppMode>(initialMode);
  
  // Optional: Sync with local storage just in case cookie reading fails client-side
  useEffect(() => {
    const savedMode = localStorage.getItem("jobnest-app-mode") as AppMode;
    if (savedMode && (savedMode === "LOCAL" || savedMode === "PRO")) {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem("jobnest-app-mode", newMode);
    // Sync to cookie via server action for SSR rendering
    setModeCookie(newMode).catch(console.error);
  };

  const toggleMode = () => {
    setMode(mode === "LOCAL" ? "PRO" : "LOCAL");
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
