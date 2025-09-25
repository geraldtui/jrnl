'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, RefreshCw, Trash2, User, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'

interface UserSidebarProps {
  onRefresh: () => void
  onDeleteAllData: () => void
  isLoading: boolean
}

export function UserSidebar({ onRefresh, onDeleteAllData, isLoading }: UserSidebarProps) {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Profile Picture Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-full ring-2 ring-background hover:ring-primary/50 transition-all duration-200"
      >
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.picture} alt={user.name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user.name?.charAt(0) || <User className="w-5 h-5" />}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-card border-r shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Account</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name?.charAt(0) || <User className="w-6 h-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-6 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onRefresh()
              setIsOpen(false)
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-3" />
                Delete All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all journal data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your journal entries from Google Drive. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDeleteAllData()
                    setIsOpen(false)
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              signOut()
              setIsOpen(false)
            }}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-muted/30">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Data stored securely in your Google Drive
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
