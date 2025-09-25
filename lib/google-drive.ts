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

  private async findJournalFile(folderId: string): Promise<string | null> {
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
      console.error('Error finding journal file:', error)
      return null
    }
  }

  async saveEntries(entries: Entry[]): Promise<void> {
    try {
      const folderId = await this.findOrCreateFolder()
      const existingFileId = await this.findJournalFile(folderId)

      const fileContent = JSON.stringify(entries, null, 2)

      if (existingFileId) {
        // Update existing file
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}`, {
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
          name: 'journal-entries.json',
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
      console.error('Error saving entries to Google Drive:', error)
      throw new Error('Failed to save entries to Google Drive')
    }
  }

  async loadEntries(): Promise<Entry[]> {
    try {
      const folderId = await this.findOrCreateFolder()
      const fileId = await this.findJournalFile(folderId)

      if (!fileId) {
        return [] // No journal file exists yet
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
        throw new Error('Failed to download file')
      }

      const content = await response.text()
      const entries = JSON.parse(content) as Entry[]
      return entries
    } catch (error) {
      console.error('Error loading entries from Google Drive:', error)
      throw new Error('Failed to load entries from Google Drive')
    }
  }

  async deleteAllData(): Promise<void> {
    try {
      const folderId = await this.findOrCreateFolder()
      const fileId = await this.findJournalFile(folderId)

      if (fileId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
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
