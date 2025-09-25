"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Home, BarChart3 } from "lucide-react"
import { EntryList } from "@/components/entry-list"
import { InsightsDashboard } from "@/components/insights-dashboard"

export interface Entry {
  id: string
  title: string
  participant: string
  date: string
  context: string
  rating: number
  reflection: {
    didWell: string
    couldImprove: string
    learned: string
  }
  tags: string[]
  contentHtml?: string
}

// Backwards-compatible alias for components that may still import Conversation
export type Conversation = Entry

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [activeTab, setActiveTab] = useState<"home" | "insights">("home")
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const STORAGE_KEY = "jrnl-entries"
    const storedNew = localStorage.getItem(STORAGE_KEY)
    if (storedNew) {
      setEntries(JSON.parse(storedNew))
      return
    }
    // Migrate from previous key if present
    const legacy = localStorage.getItem("retro-interactions")
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy)
        setEntries(parsed)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      } catch {
        // ignore
      }
    }
  }, [])

  const saveEntry = (entry: Omit<Entry, "id">) => {
    const newEntry: Entry = {
      ...entry,
      id: Date.now().toString(),
    }
    const updated = [newEntry, ...entries]
    setEntries(updated)
    localStorage.setItem("jrnl-entries", JSON.stringify(updated))
    setShowForm(false)
  }

  // Entries are immutable: no update or delete operations

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              jrnl
            </h1>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex bg-muted/30 rounded-full p-1">
            <Button
              variant={activeTab === "home" && !showForm ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("home")
                setShowForm(false)
              }}
              className="rounded-full px-6"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant={activeTab === "insights" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("insights")
                setShowForm(false)
              }}
              className="rounded-full px-6"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Insights
            </Button>
          </div>
        </div>

        {activeTab === "home" && (
          <EntryList
            entries={entries}
            onSave={saveEntry}
          />
        )}

        {activeTab === "insights" && <InsightsDashboard entries={entries} />}
      </div>
    </div>
  )
}
