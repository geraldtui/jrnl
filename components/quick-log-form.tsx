"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Star } from "lucide-react"
import type { Entry } from "@/app/page"

interface QuickLogFormProps {
  onSave: (entry: Omit<Entry, "id">) => void
  onCancel: () => void
}

export function QuickLogForm({ onSave, onCancel }: QuickLogFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    participant: "",
    date: new Date().toISOString().split("T")[0],
    context: "",
    rating: 0,
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState("")

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.participant) {
      const entry = {
        ...formData,
        reflection: {
          didWell: "",
          couldImprove: "",
          learned: "",
        },
      }
      onSave(entry)
    }
  }

  return (
    <Card className="border border-purple-500/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b border-purple-500/10">
        <CardTitle className="text-xl font-semibold text-center">New Entry</CardTitle>
        <p className="text-sm text-muted-foreground text-center">Capture a journal entry. Reflection is optional.</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Entry Title
              </Label>
              <Input
                id="title"
                placeholder="Team meeting with Sarah"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participant" className="text-sm font-medium">
                Participant(s)
              </Label>
              <Input
                id="participant"
                placeholder="Sarah, John"
                value={formData.participant}
                onChange={(e) => setFormData((prev) => ({ ...prev, participant: e.target.value }))}
                required
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context" className="text-sm font-medium">
              Context (Optional)
            </Label>
            <Textarea
              id="context"
              placeholder="Brief summary of your entry..."
              value={formData.context}
              onChange={(e) => setFormData((prev) => ({ ...prev, context: e.target.value }))}
              rows={3}
              className="bg-background/50 resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Rating (Optional)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                  className={`p-1 rounded-md transition-colors ${
                    star <= formData.rating
                      ? "text-purple-500 hover:text-purple-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className={`w-5 h-5 ${star <= formData.rating ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 bg-background/50"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                size="sm"
                className="bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20"
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 bg-purple-500/10 text-purple-300 border-purple-500/20"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              Save Entry
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
