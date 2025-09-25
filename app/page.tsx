"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Home, BarChart3, RefreshCw } from "lucide-react"
import { EntryList } from "@/components/entry-list"
import { InsightsDashboard } from "@/components/insights-dashboard"
import { UserSidebar } from "@/components/user-sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const { isAuthenticated, user, loading, signIn, signOut, saveEntries, loadEntries, deleteAllData } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [activeTab, setActiveTab] = useState<"home" | "insights">("home")
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load entries from Google Drive when authenticated
  useEffect(() => {
    const loadEntriesFromDrive = async () => {
      if (!isAuthenticated) return

      setIsLoading(true)
      setError(null)

      try {
        const driveEntries = await loadEntries()
        setEntries(driveEntries)
      } catch (err) {
        console.error('Error loading entries:', err)
        setError(err instanceof Error ? err.message : 'Failed to load entries')

        // Fallback to localStorage for migration
        const STORAGE_KEY = "jrnl-entries"
        const storedNew = localStorage.getItem(STORAGE_KEY)
        if (storedNew) {
          const localEntries = JSON.parse(storedNew)
          setEntries(localEntries)

          // Try to migrate to Google Drive
          try {
            await saveEntries(localEntries)
            localStorage.removeItem(STORAGE_KEY) // Clear local storage after successful migration
            setError(null)
          } catch (migrateErr) {
            console.error('Migration failed:', migrateErr)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadEntriesFromDrive()
  }, [isAuthenticated, loadEntries, saveEntries])

  const saveEntry = async (entry: Omit<Entry, "id">) => {
    const newEntry: Entry = {
      ...entry,
      id: Date.now().toString(),
    }

    const updatedEntries = [newEntry, ...entries]
    setEntries(updatedEntries)

    if (isAuthenticated) {
      try {
        await saveEntries(updatedEntries)
        setError(null)
      } catch (err) {
        console.error('Error saving entry:', err)
        setError(err instanceof Error ? err.message : 'Failed to save entry')
      }
    }

    setShowForm(false)
  }

  const handleDeleteAllData = async () => {
    try {
      setIsLoading(true)
      await deleteAllData()
      setEntries([])
      setError(null)
    } catch (err) {
      console.error('Error deleting data:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete data')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      setError(null)
      const driveEntries = await loadEntries()
      setEntries(driveEntries)
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-4">
            jrnl
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in with Google to access your personal journal stored securely in your Google Drive.
          </p>
          <Button onClick={signIn} size="lg">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* User Sidebar */}
      <UserSidebar
        onRefresh={refreshData}
        onDeleteAllData={handleDeleteAllData}
        isLoading={isLoading}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              jrnl
            </h1>
          </div>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
