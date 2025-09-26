"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import type { Entry } from "@/app/page"
import { Star, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SimpleTextEditorProps {
    onSave: (entry: Omit<Entry, "id">) => void
    existingTags?: string[]
}

export function RichTextEditor({ onSave, existingTags = [] }: SimpleTextEditorProps) {
    const [content, setContent] = useState("")
    const [title, setTitle] = useState("")
    const [saving, setSaving] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [selectedTag, setSelectedTag] = useState<string>("")
    const [customTag, setCustomTag] = useState("")
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [availableTags, setAvailableTags] = useState<string[]>(existingTags)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const { toast } = useToast()

    // Helper function to capitalize tags
    const capitalizeTag = (tag: string): string => {
        return tag.trim().toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
    }

    useEffect(() => {
        // Capitalize existing tags when they come in
        const capitalizedTags = existingTags.map(tag => capitalizeTag(tag))
        setAvailableTags(capitalizedTags)
    }, [existingTags])

    const clearEditor = () => {
        setContent("")
        setTitle("")
        setRating(0)
        setHoveredRating(0)
        setSelectedTag("")
        setCustomTag("")
        setShowCustomInput(false)
    }

    const isContentEmpty = () => {
        return !content.trim()
    }

    const isEntryComplete = () => {
        const hasContent = content.trim().length > 0
        const hasRating = rating > 0
        const hasTag = selectedTag.length > 0 || (showCustomInput && customTag.trim().length > 0)
        return hasContent && hasRating && hasTag
    }

    const handleSave = () => {
        if (!isEntryComplete()) return
        setShowConfirmDialog(true)
    }

    const confirmAndSave = async () => {
        if (!isEntryComplete()) return

        setSaving(true)

        try {
            // Determine final tag
            let finalTag = selectedTag
            if (showCustomInput && customTag.trim()) {
                finalTag = capitalizeTag(customTag.trim())
                // Add new tag to available tags for next time
                if (!availableTags.includes(finalTag)) {
                    setAvailableTags(prev => [...prev, finalTag].sort())
                }
            }

            const entry: Omit<Entry, "id"> = {
                title: title.trim(),
                participant: "You",
                date: new Date().toISOString(),
                context: content.trim(),
                rating,
                reflection: {
                    didWell: "",
                    couldImprove: "",
                    learned: ""
                },
                tags: finalTag ? [finalTag] : [],
            }

            await onSave(entry)
            clearEditor()
            setShowConfirmDialog(false)

            // Show success toast
            toast({
                title: "Entry saved!",
                description: "Your journal entry has been saved successfully.",
            })
        } catch (error) {
            console.error("Failed to save entry:", error)
            // Show error toast
            toast({
                variant: "destructive",
                title: "Save failed",
                description: "There was an error saving your entry. Please try again.",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSave()
        }
    }

    const handleTagSelect = (value: string) => {
        if (value === "__new__") {
            setShowCustomInput(true)
            setSelectedTag("")
        } else {
            setSelectedTag(value)
            setShowCustomInput(false)
            setCustomTag("")
        }
    }

    const handleCustomTagSubmit = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && customTag.trim()) {
            const newTag = capitalizeTag(customTag.trim())
            setSelectedTag(newTag)
            if (!availableTags.includes(newTag)) {
                setAvailableTags(prev => [...prev, newTag].sort())
            }
            setShowCustomInput(false)
            setCustomTag("")
        }
    }

    return (
        <div className="space-y-3">
            <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className="border-0 bg-muted/30 focus:bg-background transition-all hover:ring-1 hover:ring-white/20"
            />
            <Textarea
                placeholder=""
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={saving}
                className="min-h-[120px] resize-y leading-relaxed text-base p-4 border-0 bg-muted/30 focus:bg-background transition-all hover:ring-1 hover:ring-white/20"
            />

            <div className="flex justify-end items-center gap-3">
                {showCustomInput ? (
                    <Input
                        placeholder="Enter tag name..."
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={handleCustomTagSubmit}
                        onBlur={() => {
                            if (!customTag.trim()) {
                                setShowCustomInput(false)
                            }
                        }}
                        className="w-32 h-8 text-sm"
                        autoFocus
                        disabled={saving}
                    />
                ) : (
                    <Select value={selectedTag} onValueChange={handleTagSelect} disabled={saving}>
                        <SelectTrigger className="w-24 h-8 text-sm border-0 bg-muted/30">
                            <SelectValue placeholder="tag*" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTags.map((tag) => (
                                <SelectItem key={tag} value={tag}>
                                    {tag}
                                </SelectItem>
                            ))}
                            <div className="border-t my-1" />
                            <SelectItem value="__new__">
                                <div className="flex items-center gap-2">
                                    <Plus className="w-3 h-3" />
                                    New tag
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )}

                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                        const starIndex = i + 1
                        const isHighlighted = starIndex <= (hoveredRating || rating)
                        const isHoverable = hoveredRating === 0 && starIndex > rating

                        return (
                            <button
                                key={i}
                                onClick={() => setRating(rating === starIndex ? 0 : starIndex)}
                                onMouseEnter={() => setHoveredRating(starIndex)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className={`p-1 rounded transition-colors ${
                                    isHighlighted
                                        ? "text-purple-500"
                                        : "text-transparent hover:text-white"
                                }`}
                                disabled={saving}
                            >
                                <Star className="w-4 h-4 fill-current stroke-white/30 stroke-1" />
                            </button>
                        )
                    })}
                </div>

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogTrigger asChild>
                        <Button
                            disabled={!isEntryComplete() || saving}
                            size="sm"
                            className="px-4"
                        >
                            {saving ? "..." : "jrnl"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Submit Journal Entry?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Once submitted, this entry cannot be edited or changed. Make sure your content, rating, and tag are correct before proceeding.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Review</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmAndSave}>
                                Submit Entry
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
