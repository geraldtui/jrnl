"use client"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Entry } from "@/app/page"
import { Star, X } from "lucide-react"

interface RichTextEditorProps {
    onSave: (entry: Omit<Entry, "id">) => void
}

function extractTitleAndExcerpt(html: string): { title: string; excerpt: string } {
    const temp = document.createElement("div")
    temp.innerHTML = html
    const text = (temp.textContent || "").replace(/\s+/g, " ").trim()
    const firstLine = text.split(/\n|\.|!|\?/).map((t) => t.trim()).find((t) => t.length > 0) || "Untitled"
    const title = firstLine.slice(0, 80)
    const excerpt = text.slice(0, 160)
    return { title, excerpt }
}

export function RichTextEditor({ onSave }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement | null>(null)
    const [saving, setSaving] = useState(false)
    const [rating, setRating] = useState(0)
    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState("")

    const exec = (command: string) => {
        document.execCommand(command, false)
        editorRef.current?.focus()
    }

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()])
            setNewTag("")
        }
    }

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag))
    }

    const handleSave = () => {
        const html = editorRef.current?.innerHTML?.trim() || ""
        const plain = editorRef.current?.innerText?.replace(/\s+/g, " ").trim() || ""
        if (!plain) return
        setSaving(true)
        const { title, excerpt } = extractTitleAndExcerpt(html)
        const entry: Omit<Entry, "id"> = {
            title,
            participant: "",
            date: new Date().toISOString(),
            context: excerpt,
            rating,
            reflection: {
                didWell: "",
                couldImprove: "",
                learned: "",
            },
            tags,
            contentHtml: html,
        }
        onSave(entry)
        // clear editor
        if (editorRef.current) editorRef.current.innerHTML = ""
        setRating(0)
        setTags([])
        setSaving(false)
    }

    return (
        <Card className="border border-purple-500/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1 mb-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => exec("bold")}>B</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => exec("italic")}>
                        <span className="italic">I</span>
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => exec("underline")}>
                        <span className="underline">U</span>
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => exec("insertUnorderedList")}>• List</Button>
                </div>
                <div
                    ref={editorRef}
                    contentEditable
                    role="textbox"
                    aria-label="Journal editor"
                    className="min-h-28 w-full rounded-md border border-purple-500/10 bg-background/50 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/30"
                    suppressContentEditableWarning
                />

                {/* Tags and controls section */}
                <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <div className="mb-2">
                            <Input
                                placeholder="Tags"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                className="w-1/4 h-8 text-sm bg-background/50 border-purple-500/10"
                            />
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="flex items-center gap-1 bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs px-2 py-1"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rating and Save button */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`p-1 rounded-md transition-colors ${star <= rating ? "text-purple-500" : "text-muted-foreground hover:text-foreground"}`}
                                    aria-label={`Set rating ${star}`}
                                >
                                    <Star className={`w-4 h-4 ${star <= rating ? "fill-current" : ""}`} />
                                </button>
                            ))}
                        </div>
                        <Button type="button" size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Add Entry"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default RichTextEditor
