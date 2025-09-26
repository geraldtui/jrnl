"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Calendar, Search, Trash2 } from "lucide-react"
import { RichTextEditor } from "@/components/simple-text-editor"
import type { Entry } from "@/app/page"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface EntryListProps {
    entries: Entry[]
    onSave: (entry: Omit<Entry, "id">) => void
    onDelete?: (entryId: string) => Promise<void>
    isLoading?: boolean
}

export function EntryList({ entries, onSave, onDelete, isLoading }: EntryListProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [filterRating, setFilterRating] = useState<string>("all")
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    // Editor is always visible on top; no toggle needed
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        // If we have a proper onDelete function, don't load local deleted IDs
        if (onDelete) {
            return
        }

        // Legacy support for local deletion (fallback)
        try {
            const raw = localStorage.getItem("jrnl-deleted-ids")
            if (raw) {
                const arr = JSON.parse(raw) as string[]
                setDeletedIds(new Set(arr))
            }
        } catch {
            // ignore
        }
    }, [onDelete])

    const persistDeleted = (ids: Set<string>) => {
        localStorage.setItem("jrnl-deleted-ids", JSON.stringify(Array.from(ids)))
    }

    const handleDeleteEntry = async (id: string) => {
        if (onDelete) {
            // Use proper delete function that syncs with Google Drive
            await onDelete(id)
        } else {
            // Fallback to local deletion (legacy)
            const next = new Set(deletedIds)
            next.add(id)
            setDeletedIds(next)
            persistDeleted(next)
        }
    }

    // Get the raw text content from entry (plaintext only now)
    const getEntryText = (entry: Entry): string => {
        return (entry.context || entry.title || "").trim()
    }

    const getEntryTitle = (entry: Entry): string => {
        // Use the actual title field if it exists, otherwise fallback to "Untitled"
        return entry.title?.trim() || "Untitled"
    }

    const getEntryExcerpt = (entry: Entry): string => {
        const text = entry.context?.trim() || ""
        if (!text) return ""

        // For search/excerpt purposes, return a longer snippet of the content
        const excerptLength = 280
        if (text.length <= excerptLength) {
            return text.trim()
        }

        // Find a good breaking point near the end to avoid cutting words
        const excerpt = text.slice(0, excerptLength).trim()
        const lastSpaceIndex = excerpt.lastIndexOf(' ')
        if (lastSpaceIndex > excerptLength * 0.8) {
            return excerpt.slice(0, lastSpaceIndex).trim() + '…'
        }

        return excerpt + '…'
    }

    const getEntryBodyContent = (entry: Entry): string => {
        const text = entry.context?.trim() || ""
        if (!text) return ""

        // Return the full content, preserving line breaks
        return text.replace(/\n/g, '\n')
    }

    const handleSave = (entry: Omit<Entry, "id">) => {
        onSave(entry)
    }

    // Helper function to capitalize tags
    const capitalizeTag = (tag: string): string => {
        return tag.trim().toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
    }

    // Memoized tag collection for better performance
    const getAllTags = () => {
        const tagCounts = new Map<string, number>()
        baseEntries.forEach(entry => {
            entry.tags.forEach(tag => {
                const capitalizedTag = capitalizeTag(tag)
                tagCounts.set(capitalizedTag, (tagCounts.get(capitalizedTag) || 0) + 1)
            })
        })
        // Return tags sorted alphabetically with their usage counts
        return Array.from(tagCounts.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([tag]) => tag)
    }

    const toggleTag = (tag: string) => {
        if (tag === "__clear__") {
            setSelectedTags([])
            return
        }
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        )
    }

    const formatDateTime = (dateString: string) => {
        if (!isClient) {
            // Server-side fallback: show ISO date and UTC time
            const datePart = dateString.split('T')[0]
            const timePart = dateString.split('T')[1]?.slice(0, 5) || '00:00'
            return `${datePart} at ${timePart}`
        }

        // Client-side: show local timezone with better formatting
        try {
            const date = new Date(dateString)
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            // Check if it's today or yesterday for friendlier display
            const dateStr = date.toLocaleDateString()
            const todayStr = today.toLocaleDateString()
            const yesterdayStr = yesterday.toLocaleDateString()

            let displayDate: string
            if (dateStr === todayStr) {
                displayDate = 'Today'
            } else if (dateStr === yesterdayStr) {
                displayDate = 'Yesterday'
            } else {
                displayDate = date.toLocaleDateString()
            }

            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            return `${displayDate} at ${timeStr}`
        } catch {
            // Fallback if date parsing fails
            return dateString
        }
    }

    const renderFullEntry = (entry: Entry) => {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold">{getEntryTitle(entry)}</h2>
                    {entry.rating > 0 && (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                            {entry.rating}★
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(entry.date)}
                    </div>
                    {entry.rating > 0 && (
                        <div className="flex items-center gap-1">
                            {Array.from({ length: entry.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-primary fill-current" />
                            ))}
                        </div>
                    )}
                </div>

                {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                                {capitalizeTag(tag)}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="prose prose-sm max-w-none dark:prose-invert">
                    {(() => {
                        const fullText = getEntryText(entry)
                        if (fullText) {
                            // Split by lines and render with proper line breaks
                            const lines = fullText.split('\n').filter(line => line.trim())
                            return (
                                <div className="space-y-3">
                                    {lines.map((line, index) => (
                                        <p key={index} className="leading-relaxed">
                                            {line.trim()}
                                        </p>
                                    ))}
                                </div>
                            )
                        } else {
                            return <p className="text-muted-foreground italic">No content</p>
                        }
                    })()}
                </div>
            </div>
        )
    }

    // Optimized search function
    const matchesSearchTerm = (entry: Entry, searchTerm: string): boolean => {
        if (!searchTerm.trim()) return true

        const term = searchTerm.toLowerCase()
        const entryTitle = (entry.title || "").toLowerCase()
        const entryContent = (entry.context || "").toLowerCase()
        const participant = entry.participant.toLowerCase()

        // Check if search term matches in title, content, or participant
        return entryTitle.includes(term) || entryContent.includes(term) || participant.includes(term)
    }

    // Optimized filtering and sorting
    const getFilteredEntries = () => {
        return baseEntries
            .filter((entry) => {
                const matchesSearch = matchesSearchTerm(entry, searchTerm)
                const matchesRating = filterRating === "all" || entry.rating.toString() === filterRating
                const matchesTags = selectedTags.length === 0 || selectedTags.some(tag =>
                    entry.tags.some(entryTag => capitalizeTag(entryTag) === tag)
                )
                return matchesSearch && matchesRating && matchesTags
            })
            .sort((a, b) => {
                // Always sort by date (newest first)
                return new Date(b.date).getTime() - new Date(a.date).getTime()
            })
    }

    const baseEntries = entries.filter((entry) => !deletedIds.has(entry.id))
    const filteredAndSorted = getFilteredEntries()

    return (
        <div className="space-y-6">
            <div className="animate-in fade-in-5 slide-in-from-top-20 duration-700 ease-out">
                <RichTextEditor onSave={handleSave} existingTags={getAllTags()} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search entries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-0 bg-muted/30"
                    />
                </div>
                <Select value="" onValueChange={toggleTag}>
                    <SelectTrigger className="w-full sm:w-40 border-0 bg-muted/30">
                        <SelectValue placeholder={selectedTags.length > 0 ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected` : "Filter by tags"} />
                    </SelectTrigger>
                    <SelectContent>
                        {getAllTags().map((tag) => (
                            <SelectItem key={tag} value={tag}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded border ${selectedTags.includes(tag) ? 'bg-purple-500 border-purple-500' : 'border-muted-foreground'}`} />
                                    {tag}
                                </div>
                            </SelectItem>
                        ))}
                        {selectedTags.length > 0 && (
                            <>
                                <div className="border-t my-1" />
                                <SelectItem value="__clear__" onSelect={() => setSelectedTags([])}>
                                    Clear all filters
                                </SelectItem>
                            </>
                        )}
                    </SelectContent>
                </Select>
                <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-full sm:w-32 border-0 bg-muted/30">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="5">5★</SelectItem>
                        <SelectItem value="4">4★</SelectItem>
                        <SelectItem value="3">3★</SelectItem>
                        <SelectItem value="2">2★</SelectItem>
                        <SelectItem value="1">1★</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3">
                {filteredAndSorted.length === 0 ? (
                    <Card className="p-8">
                        <CardContent className="text-center">
                            <p className="text-muted-foreground mb-2">No entries yet</p>
                            <p className="text-sm text-muted-foreground">
                                Start by creating your first journal entry above
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredAndSorted.map((entry) => (
                    <Dialog key={entry.id}>
                        <DialogTrigger asChild>
                            <Card className="hover:bg-muted/30 hover:shadow-md hover:scale-[1.02] border-0 shadow-sm transition-all duration-200 cursor-pointer hover:border-purple-500/20 hover:shadow-purple-500/20 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.3)]">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-medium">{getEntryTitle(entry)}</h3>
                                                {entry.rating > 0 && (
                                                    <Badge variant="secondary" className="text-xs px-2 py-0 rounded-full">
                                                        {entry.rating}★
                                                    </Badge>
                                                )}
                                                {entry.tags.length > 0 && (
                                                    <Badge variant="outline" className="text-xs px-2 py-0 rounded-full">
                                                        {capitalizeTag(entry.tags[0])}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDateTime(entry.date)}
                                                </div>
                                                {entry.rating > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: entry.rating }).map((_, i) => (
                                                            <Star key={i} className="w-3 h-3 text-primary fill-current" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                                                {getEntryExcerpt(entry)}
                                            </p>
                                        </div>
                                        <div className="ml-3" onClick={(e) => e.stopPropagation()}>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                                        aria-label="Delete entry"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This hides the entry from history without altering its original content. You can't edit entries.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Journal Entry</DialogTitle>
                            </DialogHeader>
                            {renderFullEntry(entry)}
                        </DialogContent>
                    </Dialog>
                    ))
                )}
            </div>
        </div>
    )
}
