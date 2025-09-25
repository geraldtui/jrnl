"use client"

export default function DebugPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Environment Variables</h2>
          <p><strong>NEXT_PUBLIC_GOOGLE_CLIENT_ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'NOT SET'}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Client Info</h2>
          <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'}</p>
          <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Google APIs</h2>
          <p><strong>window.google:</strong> {typeof window !== 'undefined' ? (window.google ? 'Available' : 'Not Available') : 'Server'}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Console Test</h2>
          <button 
            onClick={() => {
              console.log('Environment Variables:', {
                NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
              })
              console.log('Window object:', typeof window)
              console.log('Google APIs:', typeof window !== 'undefined' ? window.google : 'N/A')
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Log Debug Info to Console
          </button>
        </div>
      </div>
    </div>
  )
}