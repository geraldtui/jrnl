"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { Entry } from "@/app/page"
import { Star, Plus } from "lucide-react"

interface SimpleTextEditorProps {
    onSave: (entry: Omit<Entry, "id">) => void
    existingTags?: string[]
}

export function RichTextEditor({ onSave, existingTags = [] }: SimpleTextEditorProps) {
    const [content, setContent] = useState("")
    const [saving, setSaving] = useState(false)
    const [rating, setRating] = useState(0)
    const [selectedTag, setSelectedTag] = useState<string>("")
    const [customTag, setCustomTag] = useState("")
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [availableTags, setAvailableTags] = useState<string[]>(existingTags)

    useEffect(() => {
        setAvailableTags(existingTags)
    }, [existingTags])

    const clearEditor = () => {
        setContent("")
        setRating(0)
        setSelectedTag("")
        setCustomTag("")
        setShowCustomInput(false)
    }

    const isContentEmpty = () => {
        return !content.trim()
    }

    const handleSave = async () => {
        if (isContentEmpty()) return

        setSaving(true)

        try {
            // Determine final tag
            let finalTag = selectedTag
            if (showCustomInput && customTag.trim()) {
                finalTag = customTag.trim().toLowerCase()
                // Add new tag to available tags for next time
                if (!availableTags.includes(finalTag)) {
                    setAvailableTags(prev => [...prev, finalTag].sort())
                }
            }

            const entry: Omit<Entry, "id"> = {
                title: "",
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
        } catch (error) {
            console.error("Failed to save entry:", error)
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
            const newTag = customTag.trim().toLowerCase()
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
                            <SelectValue placeholder="tag" />
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
                    {Array.from({ length: 5 }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setRating(rating === i + 1 ? 0 : i + 1)}
                            className={`p-1 rounded transition-colors ${
                                i < rating ? "text-yellow-500" : "text-transparent hover:text-white"
                            }`}
                            disabled={saving}
                        >
                            <Star className="w-4 h-4 fill-current stroke-white/30 stroke-1" />
                        </button>
                    ))}
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isContentEmpty() || saving}
                    size="sm"
                    className="px-4"
                >
                    {saving ? "..." : "jrnl"}
                </Button>
            </div>
        </div>
    )
}
