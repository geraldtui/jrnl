'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { GoogleDriveService } from '@/lib/google-drive'
import type { Entry } from '@/app/page'

interface User {
  id: string
  name: string
  email: string
  picture: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  googleLoaded: boolean
  signIn: () => void
  signOut: () => void
  saveEntries: (entries: Entry[]) => Promise<void>
  loadEntries: () => Promise<Entry[]>
  deleteAllData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Declare global types for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void
          prompt: () => void
          renderButton: (element: HTMLElement, options: any) => void
          disableAutoSelect: () => void
        }
        oauth2?: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void
          }
        }
      }
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [driveService, setDriveService] = useState<GoogleDriveService | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [googleLoaded, setGoogleLoaded] = useState(false)

  useEffect(() => {
    // Check if environment variable is set
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set!')
      setLoading(false)
      return
    }

    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (typeof window !== 'undefined' && !window.google) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initializeGoogle
        script.onerror = () => {
          console.error('Failed to load Google Identity Services')
          setLoading(false)
        }
        document.head.appendChild(script)

        // Also load GAPI for Drive API
        const gapiScript = document.createElement('script')
        gapiScript.src = 'https://apis.google.com/js/api.js'
        gapiScript.async = true
        gapiScript.defer = true
        document.head.appendChild(gapiScript)
      } else if (window.google) {
        initializeGoogle()
      }
    }

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && window.google?.accounts?.oauth2) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          })
          setGoogleLoaded(true)
        } catch (error) {
          console.error('Error initializing Google Identity Services:', error)
        }
        setLoading(false)
      } else {
        setTimeout(initializeGoogle, 500)
      }
    }

    loadGoogleScript()

    // Check for stored session
    const storedUser = localStorage.getItem('jrnl-user')
    const storedToken = localStorage.getItem('jrnl-token')
    const storedExpiration = localStorage.getItem('jrnl-token-expires')

    // Check if token is still valid
    const isTokenValid = storedExpiration && Date.now() < parseInt(storedExpiration)

    if (storedUser && storedToken && isTokenValid) {
      setUser(JSON.parse(storedUser))
      setAccessToken(storedToken)
      setDriveService(new GoogleDriveService(storedToken))
    } else if (storedUser || storedToken) {
      // Clear expired or invalid session
      localStorage.removeItem('jrnl-user')
      localStorage.removeItem('jrnl-token')
      localStorage.removeItem('jrnl-token-expires')
    }

    setLoading(false) // Set loading to false since we're not using popup flow anymore
  }, [])

  // Periodic token validation
  useEffect(() => {
    if (!user || !accessToken) return

    const checkTokenExpiration = () => {
      const storedExpiration = localStorage.getItem('jrnl-token-expires')
      if (!storedExpiration || Date.now() >= parseInt(storedExpiration)) {
        // Token has expired, sign out user
        handleSignOut()
      }
    }

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user, accessToken])

  const handleSignIn = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('No Google Client ID configured!')
      alert('Google Client ID is not configured. Please check your .env.local file.')
      return
    }

    // Use Google Identity Services with implicit flow for client-side auth
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
        callback: handleTokenResponse,
        error_callback: (error: any) => {
          console.error('OAuth error:', error)
          alert('Authentication failed: ' + (error.message || 'Unknown error'))
        }
      })

      client.requestAccessToken()
    } else {
      console.error('Google OAuth2 not available!')
      alert('Google authentication services not loaded. Please refresh and try again.')
    }
  }

  const handleTokenResponse = async (response: any) => {
    try {
      if (response.access_token) {
        // Get user info using the access token
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${response.access_token}`,
          },
        })

        const userData = await userResponse.json()

        if (!userResponse.ok) {
          throw new Error('Failed to get user information')
        }

        // Store the user data and token
        const user = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        }

        setUser(user)
        setAccessToken(response.access_token)
        setDriveService(new GoogleDriveService(response.access_token))

        localStorage.setItem('jrnl-user', JSON.stringify(user))
        localStorage.setItem('jrnl-token', response.access_token)

        // Store token expiration time (Google tokens typically expire in 1 hour)
        const expirationTime = Date.now() + (55 * 60 * 1000) // 55 minutes to be safe
        localStorage.setItem('jrnl-token-expires', expirationTime.toString())
      } else {
        throw new Error('No access token received')
      }
    } catch (error) {
      console.error('Error processing token response:', error)
      alert('Failed to complete authentication: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleSignOut = () => {
    setUser(null)
    setAccessToken(null)
    setDriveService(null)
    localStorage.removeItem('jrnl-user')
    localStorage.removeItem('jrnl-token')
    localStorage.removeItem('jrnl-token-expires')

    // Clear Google's session
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }
  }

  const saveEntries = async (entries: Entry[]): Promise<void> => {
    if (!driveService) {
      throw new Error('Not authenticated with Google Drive')
    }
    await driveService.saveEntries(entries)
  }

  const loadEntries = async (): Promise<Entry[]> => {
    if (!driveService) {
      throw new Error('Not authenticated with Google Drive')
    }
    return await driveService.loadEntries()
  }

  const deleteAllData = async (): Promise<void> => {
    if (!driveService) {
      throw new Error('Not authenticated with Google Drive')
    }
    await driveService.deleteAllData()
  }

  const value: AuthContextType = {
    isAuthenticated: !!user && !!accessToken,
    user,
    loading,
    googleLoaded,
    signIn: handleSignIn,
    signOut: handleSignOut,
    saveEntries,
    loadEntries,
    deleteAllData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
