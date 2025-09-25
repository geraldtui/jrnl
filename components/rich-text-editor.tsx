"use client"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Entry } from "@/app/page"
import { Star } from "lucide-react"

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

    const exec = (command: string) => {
        document.execCommand(command, false)
        editorRef.current?.focus()
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
            tags: [],
            contentHtml: html,
        }
        onSave(entry)
        // clear editor
        if (editorRef.current) editorRef.current.innerHTML = ""
        setRating(0)
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
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 mr-2" aria-label="Rating">
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
                <div
                    ref={editorRef}
                    contentEditable
                    role="textbox"
                    aria-label="Journal editor"
                    className="min-h-28 w-full rounded-md border border-purple-500/10 bg-background/50 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/30"
                    suppressContentEditableWarning
                />
            </CardContent>
        </Card>
    )
}

export default RichTextEditor
