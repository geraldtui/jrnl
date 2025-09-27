import type { Entry } from '@/app/page'

// Interface for pre-computed insights data
export interface InsightsData {
  lastUpdated: string
  totalEntries: number
  averageRating: number
  ratingDistribution: Array<{ rating: number; count: number }>
  monthlyTrends: Array<{ month: string; count: number; averageRating: number }>
  tagCounts: Array<{ tag: string; count: number }>
  writingStreak: number
  mostProductiveHour: number
  recentImprovements: string[]
  // Additional properties for backward compatibility
  topTags?: Array<{ tag: string; count: number }>
  writingStats?: {
    totalWritingDays: number
    currentStreak: number
    mostProductiveTime: string | null
    averagePerDay: number
  }
}

// Declare global types for GAPI
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void
      client: {
        init: (config: any) => Promise<void>
        request: (config: any) => Promise<any>
        drive: {
          files: {
            list: (config: any) => Promise<any>
            get: (config: any) => Promise<any>
            create: (config: any) => Promise<any>
            update: (config: any) => Promise<any>
            delete: (config: any) => Promise<any>
          }
        }
      }
      auth2: {
        getAuthInstance: () => {
          currentUser: {
            get: () => {
              getAuthResponse: () => { access_token: string }
            }
          }
        }
      }
    }
  }
}

export class GoogleDriveService {
  private accessToken: string
  private folderName: string
  private gapiLoaded: boolean = false

  constructor(accessToken: string) {
    this.accessToken = accessToken
    this.folderName = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_NAME || 'jrnl-data'
    this.initializeGapi()
  }

  private async initializeGapi(): Promise<void> {
    if (typeof window === 'undefined') return

    return new Promise((resolve) => {
      if (window.gapi && this.gapiLoaded) {
        resolve()
        return
      }

      const checkGapi = () => {
        if (window.gapi) {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            })
            this.gapiLoaded = true
            resolve()
          })
        } else {
          setTimeout(checkGapi, 100)
        }
      }
      checkGapi()
    })
  }

  private async makeRequest(config: any): Promise<any> {
    await this.initializeGapi()

    const requestConfig = {
      ...config,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...config.headers,
      },
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3${config.path}`, {
      method: config.method || 'GET',
      headers: requestConfig.headers,
      body: config.body,
    })

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`)
    }

    return response.json()
  }

  private async findOrCreateFolder(): Promise<string> {
    try {
      // Search for existing folder
      const response = await this.makeRequest({
        path: '/files',
        method: 'GET',
        headers: {},
      })

      const searchParams = new URLSearchParams({
        q: `name='${this.folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      })

      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?${searchParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      const searchData = await searchResponse.json()

      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id
      }

      // Create folder if it doesn't exist
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.folderName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      })

      const createData = await createResponse.json()
      return createData.id
    } catch (error) {
      console.error('Error creating/finding folder:', error)
      throw new Error('Failed to access Google Drive folder')
    }
  }

  private async findJournalFiles(folderId: string, monthKey?: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const pattern = monthKey ? `entries-${monthKey}.json` : 'entries-';
      const searchParams = new URLSearchParams({
        q: `name contains '${pattern}' and parents in '${folderId}' and trashed=false`,
        fields: 'files(id, name)',
      })

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${searchParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.error('Error finding journal files:', error)
      return []
    }
  }

  private async findLegacyJournalFile(folderId: string): Promise<string | null> {
    try {
      const searchParams = new URLSearchParams({
        q: `name='journal-entries.json' and parents in '${folderId}' and trashed=false`,
        fields: 'files(id, name)',
      })

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${searchParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      const data = await response.json()
      return data.files && data.files.length > 0 ? data.files[0].id : null
    } catch (error) {
      console.error('Error finding legacy journal file:', error)
      return null
    }
  }

  private async findInsightsFile(folderId: string): Promise<string | null> {
    try {
      const searchParams = new URLSearchParams({
        q: `name='journal-insights.json' and parents in '${folderId}' and trashed=false`,
        fields: 'files(id, name)',
      })

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${searchParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      const data = await response.json()
      return data.files && data.files.length > 0 ? data.files[0].id : null
    } catch (error) {
      console.error('Error finding insights file:', error)
      return null
    }
  }

  private getMonthKey(date: string): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  async saveEntries(entries: Entry[]): Promise<void> {
    try {
      const folderId = await this.findOrCreateFolder()

      // Group entries by month
      const entriesByMonth = new Map<string, Entry[]>()
      entries.forEach(entry => {
        const monthKey = this.getMonthKey(entry.date)
        if (!entriesByMonth.has(monthKey)) {
          entriesByMonth.set(monthKey, [])
        }
        entriesByMonth.get(monthKey)!.push(entry)
      })

      // Save each month's entries to separate files
      for (const [monthKey, monthEntries] of entriesByMonth) {
        await this.saveMonthEntries(folderId, monthKey, monthEntries)
      }

      // Update insights after saving entries
      await this.updateInsights(entries)
    } catch (error) {
      console.error('Error saving entries to Google Drive:', error)
      throw new Error('Failed to save entries to Google Drive')
    }
  }

  private async saveMonthEntries(folderId: string, monthKey: string, entries: Entry[]): Promise<void> {
    const fileName = `entries-${monthKey}.json`
    const fileContent = JSON.stringify(entries, null, 2)

    // Check if file already exists
    const existingFiles = await this.findJournalFiles(folderId, monthKey)
    const existingFile = existingFiles.find(f => f.name === fileName)

    if (existingFile) {
      // Update existing file
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      })
    } else {
      // Create new file
      const metadata = {
        name: fileName,
        parents: [folderId],
      }

      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', new Blob([fileContent], { type: 'application/json' }))

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form,
      })
    }
  }

  async loadEntries(): Promise<Entry[]> {
    try {
      const folderId = await this.findOrCreateFolder()

      // Check for legacy file first and migrate if needed
      // TEMPORARILY DISABLED: await this.migrateLegacyFile(folderId)
      console.log('⚠️  Legacy migration temporarily disabled for testing')

      // Load recent months (last 12 months for stress testing) by default
      const now = new Date()
      const recentMonths: string[] = []

      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        recentMonths.push(this.getMonthKey(date.toISOString()))
      }

      const allEntries: Entry[] = []

      console.log('🔍 Loading entries from months:', recentMonths)

      for (const monthKey of recentMonths) {
        const monthEntries = await this.loadEntriesForMonth(monthKey)
        console.log(`📅 ${monthKey}: loaded ${monthEntries.length} entries`)
        allEntries.push(...monthEntries)
      }

      console.log(`📊 Total entries loaded: ${allEntries.length}`)

      // Sort by date (newest first)
      return allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Error loading entries from Google Drive:', error)
      throw new Error('Failed to load entries from Google Drive')
    }
  }

  async loadEntriesForMonth(monthKey: string): Promise<Entry[]> {
    try {
      const folderId = await this.findOrCreateFolder()
      const files = await this.findJournalFiles(folderId, monthKey)
      console.log(`🔍 Looking for entries-${monthKey}.json, found files:`, files.map(f => f.name))
      const targetFile = files.find(f => f.name === `entries-${monthKey}.json`)

      if (!targetFile) {
        console.log(`❌ No file found for month ${monthKey}`)
        return [] // No entries for this month
      }

      console.log(`✅ Found file for ${monthKey}: ${targetFile.name}`)

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${targetFile.id}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        console.error(`❌ Failed to download ${targetFile.name}: ${response.status}`)
        throw new Error('Failed to download monthly file')
      }

      const content = await response.text()
      const entries = JSON.parse(content) as Entry[]
      console.log(`✅ Parsed ${entries.length} entries from ${targetFile.name}`)
      return entries
    } catch (error) {
      console.error(`Error loading entries for month ${monthKey}:`, error)
      return []
    }
  }

  async getAvailableMonths(): Promise<string[]> {
    try {
      const folderId = await this.findOrCreateFolder()
      const files = await this.findJournalFiles(folderId)

      const months = files
        .map(f => f.name.match(/entries-(.+)\.json/)?.[1])
        .filter(Boolean)
        .sort()
        .reverse() // Most recent first

      return months as string[]
    } catch (error) {
      console.error('Error getting available months:', error)
      return []
    }
  }

  private async migrateLegacyFile(folderId: string): Promise<void> {
    try {
      const legacyFileId = await this.findLegacyJournalFile(folderId)

      if (!legacyFileId) {
        return // No legacy file to migrate
      }

      console.log('Found legacy journal file, migrating to monthly files...')

      // Download legacy file
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${legacyFileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to download legacy file')
      }

      const content = await response.text()
      const entries = JSON.parse(content) as Entry[]

      if (entries.length > 0) {
        // Save entries using new monthly format
        await this.saveEntries(entries)
        console.log(`Migrated ${entries.length} entries to monthly files`)
      }

      // Keep legacy file as backup (don't delete automatically)
    } catch (error) {
      console.error('Error migrating legacy file:', error)
      // Don't throw error, allow app to continue
    }
  }

  async saveInsights(insights: InsightsData): Promise<void> {
    try {
      const folderId = await this.findOrCreateFolder()
      const existingFileId = await this.findInsightsFile(folderId)

      const fileContent = JSON.stringify(insights, null, 2)

      if (existingFileId) {
        // Update existing insights file
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        })
      } else {
        // Create new insights file
        const metadata = {
          name: 'journal-insights.json',
          parents: [folderId],
        }

        const form = new FormData()
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        form.append('file', new Blob([fileContent], { type: 'application/json' }))

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: form,
        })
      }
    } catch (error) {
      console.error('Error saving insights to Google Drive:', error)
      throw new Error('Failed to save insights to Google Drive')
    }
  }

  async loadInsights(): Promise<InsightsData | null> {
    try {
      const folderId = await this.findOrCreateFolder()
      const fileId = await this.findInsightsFile(folderId)

      if (!fileId) {
        return null // No insights file exists yet
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to download insights file')
      }

      const content = await response.text()
      const insights = JSON.parse(content) as InsightsData
      return insights
    } catch (error) {
      console.error('Error loading insights from Google Drive:', error)
      return null // Return null instead of throwing to allow fallback
    }
  }

  async updateInsights(entries: Entry[]): Promise<void> {
    try {
      const insights = this.calculateInsights(entries)
      await this.saveInsights(insights)
    } catch (error) {
      console.error('Error updating insights:', error)
      // Don't throw error to avoid breaking entry saves
    }
  }

  private calculateInsights(entries: Entry[]): InsightsData {
    const totalEntries = entries.length
    const averageRating = totalEntries > 0
      ? entries.reduce((sum, entry) => sum + entry.rating, 0) / totalEntries
      : 0

    // Rating distribution
    const ratingDistribution = Array.from({ length: 5 }, (_, i) => ({
      rating: i + 1,
      count: entries.filter((entry) => entry.rating === i + 1).length,
    }))

    // Monthly trends
    const monthlyData = entries.reduce(
      (acc, entry) => {
        const month = new Date(entry.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
        if (!acc[month]) {
          acc[month] = { month, count: 0, totalRating: 0 }
        }
        acc[month].count++
        acc[month].totalRating += entry.rating
        return acc
      },
      {} as Record<string, { month: string; count: number; totalRating: number }>,
    )

    const monthlyTrends = Object.values(monthlyData)
      .map((data) => ({
        ...data,
        averageRating: data.totalRating / data.count,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Tag counts
    const tagCounts = entries.reduce(
      (acc, entry) => {
        entry.tags.forEach((tag) => {
          const normalizedTag = tag.trim().toLowerCase()
          acc[normalizedTag] = (acc[normalizedTag] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>,
    )

    const sortedTagCounts = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag: tag.charAt(0).toUpperCase() + tag.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Writing streak calculation
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const writingDays = new Set(sortedEntries.map(entry => new Date(entry.date).toDateString()))

    let currentStreak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      if (writingDays.has(checkDate.toDateString())) {
        currentStreak++
      } else {
        break
      }
    }

    // Most productive hour
    const hourCounts = entries.reduce((acc, entry) => {
      const hour = new Date(entry.date).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0]
      ? parseInt(Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0][0])
      : 12

    // Recent improvement areas
    const recentImprovements = entries
      .slice(0, 10)
      .filter((entry) => entry.reflection.couldImprove)
      .map((entry) => entry.reflection.couldImprove)
      .slice(0, 5)

    return {
      lastUpdated: new Date().toISOString(),
      totalEntries,
      averageRating,
      ratingDistribution,
      monthlyTrends,
      tagCounts: sortedTagCounts,
      writingStreak: currentStreak,
      mostProductiveHour,
      recentImprovements,
    }
  }

  async deleteAllData(): Promise<void> {
    try {
      const folderId = await this.findOrCreateFolder()

      // Delete all monthly entry files
      const monthlyFiles = await this.findJournalFiles(folderId)
      for (const file of monthlyFiles) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        })
      }

      // Delete insights file
      const insightsFileId = await this.findInsightsFile(folderId)
      if (insightsFileId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${insightsFileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        })
      }

      // Delete legacy file if it exists
      const legacyFileId = await this.findLegacyJournalFile(folderId)
      if (legacyFileId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${legacyFileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        })
      }
    } catch (error) {
      console.error('Error deleting journal data:', error)
      throw new Error('Failed to delete journal data')
    }
  }
}
