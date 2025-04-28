"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

type TabContextType = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("step1")

  return <TabContext.Provider value={{ activeTab, setActiveTab }}>{children}</TabContext.Provider>
}

export function useTab() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error("useTab must be used within a TabProvider")
  }
  return context
}
