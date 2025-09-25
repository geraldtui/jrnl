'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignIn() {
  const { isAuthenticated, loading, googleLoaded, signIn } = useAuth()
  const router = useRouter()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    // Check if environment variable is set
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setError('Google Client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.')
      return
    }

    if (!loading && !isAuthenticated && googleLoaded && typeof window !== 'undefined') {
      // Try to render Google's button
      const loadGoogleButton = () => {
        if (window.google?.accounts?.id && googleButtonRef.current) {
          try {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
            })
            console.log('Google button rendered successfully')
          } catch (error) {
            console.error('Error rendering Google button:', error)
            setShowFallback(true)
          }
        } else {
          // Show fallback after a delay
          setTimeout(() => setShowFallback(true), 2000)
        }
      }

      loadGoogleButton()
    }
  }, [loading, isAuthenticated, googleLoaded])

  const handleFallbackSignIn = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setError('Google Client ID is not configured.')
      return
    }

    try {
      signIn()
    } catch (error) {
      console.error('Sign in error:', error)
      setError('Failed to initiate sign-in. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
            jrnl
          </CardTitle>
          <CardDescription>
            Sign in with Google to sync your journal entries to your Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && (
            <>
              <div ref={googleButtonRef} className="w-full mb-4" />

              {(showFallback || !googleLoaded) && (
                <Button
                  onClick={handleFallbackSignIn}
                  className="w-full"
                  size="lg"
                  disabled={!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                >
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
              )}
            </>
          )}

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Your journal data will be stored securely in your own Google Drive.</p>
            <p className="mt-2">We only access files created by this app.</p>
            <p className="mt-2 text-xs">No server-side secrets required - authentication happens entirely in your browser.</p>
          </div>

          {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Setup Required:</strong> Please add your Google Client ID to the environment variables.
                See the SETUP.md file for instructions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
