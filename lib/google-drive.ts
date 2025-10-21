import type { Entry } from '@/app/page'

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

  private async findFolder(): Promise<string | null> {
    try {
      // Search for existing folder
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

      return null // No folder found
    } catch (error) {
      console.error('Error finding folder:', error)
      return null
    }
  }

  private async findOrCreateFolder(): Promise<string> {
    try {
      // First try to find existing folder
      const existingFolderId = await this.findFolder()
      if (existingFolderId) {
        return existingFolderId
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

      if (!createResponse.ok) {
        throw new Error(`Failed to create folder: ${createResponse.status}`)
      }

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
      const folderId = await this.findFolder()

      // If no folder exists, return empty array (don't create folder just for loading)
      if (!folderId) {
        console.log('📭 No jrnl folder found, returning empty entries')
        return []
      }

      // Check for legacy file first and migrate if needed
      // TEMPORARILY DISABLED: await this.migrateLegacyFile(folderId)
      console.log('⚠️  Legacy migration temporarily disabled for testing')

      // Load only current month by default for fastest loading
      const now = new Date()
      const currentMonthKey = this.getMonthKey(now.toISOString())

      console.log(`🔍 Loading entries from current month: ${currentMonthKey}`)

      const monthEntries = await this.loadEntriesForMonth(currentMonthKey)
      console.log(`📅 ${currentMonthKey}: loaded ${monthEntries.length} entries`)
      console.log(`📊 Total entries loaded: ${monthEntries.length}`)

      // Sort by date (newest first)
      return monthEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Error loading entries from Google Drive:', error)
      throw new Error('Failed to load entries from Google Drive')
    }
  }

  async loadEntriesForMonth(monthKey: string): Promise<Entry[]> {
    try {
      const folderId = await this.findFolder()

      // If no folder exists, return empty array
      if (!folderId) {
        console.log(`📭 No jrnl folder found for ${monthKey}`)
        return []
      }

      const files = await this.findJournalFiles(folderId, monthKey)
      const targetFile = files.find(f => f.name === `entries-${monthKey}.json`)

      if (!targetFile) {
        console.log(`📭 No entries found for ${monthKey}`)
        return [] // No entries for this month
      }

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
      return entries
    } catch (error) {
      console.error(`Error loading entries for month ${monthKey}:`, error)
      return []
    }
  }

  async getAvailableMonths(): Promise<string[]> {
    try {
      const folderId = await this.findFolder()

      // If no folder exists, return empty array
      if (!folderId) {
        console.log('📭 No jrnl folder found for available months')
        return []
      }

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

  async deleteAllData(): Promise<void> {
    try {
      const folderId = await this.findFolder()

      // If no folder exists, there's nothing to delete
      if (!folderId) {
        console.log('📭 No jrnl folder found, nothing to delete')
        return
      }

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
