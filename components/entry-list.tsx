"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Calendar, Search, Trash2 } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
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
}

export function EntryList({ entries, onSave }: EntryListProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState<"date" | "rating" | "title">("date")
    const [filterRating, setFilterRating] = useState<string>("all")
    // Editor is always visible on top; no toggle needed
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
    const [isClient, setIsClient] = useState(false)

    const defaultEntries: Entry[] = [
        {
            id: "demo-1",
            title: "Started building a simple journaling app today",
            participant: "",
            date: "2025-01-14T00:00:00.000Z",
            context:
                "Started building a simple journaling app today. I'm tired of overcomplicated apps with features I never use.",
            rating: 4,
            reflection: { didWell: "", couldImprove: "", learned: "" },
            tags: ["development", "minimalism"],
            contentHtml:
                "Started building a simple journaling app today. I'm tired of overcomplicated apps with features I never use. Just want something clean where I can write thoughts and rate my day. No fancy bells and whistles, no subscriptions, no cloud sync drama. Sometimes the best tools are the simplest ones.",
        },
        {
            id: "demo-2",
            title: "Removed another unnecessary feature from the app",
            participant: "",
            date: "2025-01-15T00:00:00.000Z",
            context:
                "Removed another unnecessary feature from the app. Less is definitely more when it comes to personal tools.",
            rating: 5,
            reflection: { didWell: "", couldImprove: "", learned: "" },
            tags: ["simplicity", "focus"],
            contentHtml:
                "Removed another unnecessary feature from the app. Less is definitely more when it comes to personal tools. Every button I remove makes the interface cleaner and the purpose clearer. The goal is to capture thoughts quickly without friction. <em>Minimalism</em> isn't about having less features, it's about having the right features.",
        },
    ]

    useEffect(() => {
        setIsClient(true)
        try {
            const raw = localStorage.getItem("jrnl-deleted-ids")
            if (raw) {
                const arr = JSON.parse(raw) as string[]
                setDeletedIds(new Set(arr))
            }
        } catch {
            // ignore
        }
    }, [])

    const persistDeleted = (ids: Set<string>) => {
        localStorage.setItem("jrnl-deleted-ids", JSON.stringify(Array.from(ids)))
    }

    const deleteEntry = (id: string) => {
        const next = new Set(deletedIds)
        next.add(id)
        setDeletedIds(next)
        persistDeleted(next)
    }

    const fromHtml = (html: string) => {
        // Strip scripts/styles and tags, then decode a few common entities
        const withoutBlocks = html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        const withoutTags = withoutBlocks.replace(/<[^>]+>/g, " ")
        const decoded = withoutTags
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
        return decoded.replace(/\s+/g, " ").trim()
    }

    const getEntryTitle = (entry: Entry): string => {
        const text = entry.contentHtml ? fromHtml(entry.contentHtml) : (entry.context || "")
        if (!text) return entry.title || "Untitled"

        // Split by common sentence endings or take first reasonable chunk
        const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0)
        if (sentences.length > 0) {
            return sentences[0].slice(0, 80) || "Untitled"
        }

        // Fallback: take first 80 characters
        return text.slice(0, 80) || "Untitled"
    }

    const getEntryExcerpt = (entry: Entry): string => {
        const text = entry.contentHtml ? fromHtml(entry.contentHtml) : (entry.context || "")
        if (!text) return ""

        // Split by sentences and skip the first one (which becomes the title)
        const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0)

        if (sentences.length <= 1) {
            // If only one sentence, show nothing in excerpt since it's used as title
            return ""
        }

        // Join remaining sentences
        const remainingSentences = sentences.slice(1)
        const remainingText = remainingSentences.join('. ').trim()

        // Add period if it doesn't end with punctuation
        const finalText = remainingText && !remainingText.match(/[.!?]$/) ? remainingText + '.' : remainingText

        return finalText.length > 280 ? `${finalText.slice(0, 277)}…` : finalText
    }

    const handleSave = (entry: Omit<Entry, "id">) => {
        onSave(entry)
    }

    const formatDateTime = (dateString: string) => {
        if (!isClient) {
            // Server-side fallback: show ISO date and UTC time
            return `${dateString.split('T')[0]} at ${dateString.split('T')[1]?.slice(0, 5) || '00:00'}`
        }
        // Client-side: show local timezone
        const date = new Date(dateString)
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
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
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="prose prose-sm max-w-none dark:prose-invert">
                    {entry.contentHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: entry.contentHtml }} />
                    ) : (
                        <p className="text-muted-foreground">{entry.context || "No content available."}</p>
                    )}
                </div>
            </div>
        )
    }

    const baseEntries = entries.filter((entry) => !deletedIds.has(entry.id))
    const sourceEntries = baseEntries.length === 0 ? defaultEntries : baseEntries
    const filteredAndSorted = sourceEntries
        .filter((entry) => {
            const entryTitle = getEntryTitle(entry)
            const entryExcerpt = getEntryExcerpt(entry)
            const matchesSearch =
                entryTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entryExcerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.participant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.context.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesRating = filterRating === "all" || entry.rating.toString() === filterRating
            return matchesSearch && matchesRating
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "date":
                    return new Date(b.date).getTime() - new Date(a.date).getTime()
                case "rating":
                    return b.rating - a.rating
                case "title":
                    return getEntryTitle(a).localeCompare(getEntryTitle(b))
                default:
                    return 0
            }
        })

    // Always render editor and list; default demo entries appear when there are no saved entries

    return (
        <div className="space-y-6">
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
                <Select value={sortBy} onValueChange={(value: "date" | "rating" | "title") => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-32 border-0 bg-muted/30">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
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
                <div className="animate-in fade-in-5 slide-in-from-top-20 duration-700 ease-out">
                    <RichTextEditor onSave={handleSave} />
                </div>

                {filteredAndSorted.map((entry) => (
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
                                                        {entry.tags[0]}
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
                                            {entry.id.startsWith("demo-") ? (
                                                <div className="p-2 opacity-50" aria-hidden>
                                                    <Trash2 className="w-4 h-4" />
                                                </div>
                                            ) : (
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
                                                            <AlertDialogAction onClick={() => deleteEntry(entry.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
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
                ))}
            </div>
        </div>
    )
}
