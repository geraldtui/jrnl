"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { MessageCircle, Star, Calendar, TrendingUp } from "lucide-react"
import type { Entry } from "@/app/page"

interface InsightsDashboardProps {
  entries: Entry[]
}

export function InsightsDashboard({ entries }: InsightsDashboardProps) {
  const insights = useMemo(() => {
    if (entries.length === 0) return null

    const totalEntries = entries.length
    const averageRating = entries.reduce((sum, entry) => sum + entry.rating, 0) / totalEntries

    // Rating distribution
    const ratingDistribution = Array.from({ length: 5 }, (_, i) => ({
      rating: i + 1,
      count: entries.filter((entry) => entry.rating === i + 1).length,
    }))

    // Monthly trends
    const monthlyData = entries.reduce(
      (acc, entry) => {
        const month = new Date(entry.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
        if (!acc[month]) {
          acc[month] = { month, count: 0, totalRating: 0 }
        }
        acc[month].count++
        acc[month].totalRating += entry.rating
        return acc
      },
      {} as Record<string, { month: string; count: number; totalRating: number }>,
    )

    const monthlyTrends = Object.values(monthlyData)
      .map((data) => ({
        ...data,
        averageRating: data.totalRating / data.count,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Most common tags
    const tagCounts = entries.reduce(
      (acc, entry) => {
        entry.tags.forEach((tag) => {
          acc[tag] = (acc[tag] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>,
    )

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    // Writing patterns and streaks
    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const writingDays = new Set(sortedEntries.map(entry => new Date(entry.date).toDateString()))
    const totalWritingDays = writingDays.size

    // Calculate current streak
    let currentStreak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      if (writingDays.has(checkDate.toDateString())) {
        currentStreak++
      } else {
        break
      }
    }

    // Most productive time (based on hour of day)
    const hourCounts = entries.reduce((acc, entry) => {
      const hour = new Date(entry.date).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0]

    const getTimeOfDay = (hour: number) => {
      if (hour < 6) return "early morning"
      if (hour < 12) return "morning"
      if (hour < 17) return "afternoon"
      if (hour < 21) return "evening"
      return "night"
    }

    // Recent improvement areas
    const recentImprovements = entries
      .slice(0, 10)
      .filter((entry) => entry.reflection.couldImprove)
      .map((entry) => entry.reflection.couldImprove)

    return {
      totalEntries,
      averageRating,
      ratingDistribution,
      monthlyTrends,
      topTags,
      recentImprovements,
      writingStats: {
        totalWritingDays,
        currentStreak,
        mostProductiveTime: mostProductiveHour ? getTimeOfDay(parseInt(mostProductiveHour)) : null,
        averagePerDay: totalEntries / Math.max(totalWritingDays, 1)
      }
    }
  }, [entries])

  if (!insights) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <BarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No data to analyze yet</p>
          <p className="text-sm">Write some journal entries to see your insights</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{insights.totalEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{insights.averageRating.toFixed(1)}/5</div>
            <div className="flex mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(insights.averageRating) ? "text-primary fill-current" : "text-muted-foreground"
                    }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {insights.monthlyTrends[insights.monthlyTrends.length - 1]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">entries written</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>How you rate your journal entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={insights.ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="rating" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Entry frequency and quality over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={insights.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tags and Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Common Topics</CardTitle>
            <CardDescription>Most frequently used tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.topTags.slice(0, 8).map(({ tag, count }) => (
                <div key={tag} className="flex items-center justify-between">
                  <Badge variant="outline">{tag}</Badge>
                  <div className="flex items-center gap-2 flex-1 ml-3">
                    <Progress value={(count / insights.totalEntries) * 100} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Writing Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Writing Patterns</CardTitle>
            <CardDescription>Your journaling habits and streaks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Current Streak</span>
                </div>
                <span className="text-lg font-bold text-primary">{insights.writingStats.currentStreak} days</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Writing Days</span>
                <span className="font-medium">{insights.writingStats.totalWritingDays} total</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average per Day</span>
                <span className="font-medium">{insights.writingStats.averagePerDay.toFixed(1)} entries</span>
              </div>

              {insights.writingStats.mostProductiveTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Most Active</span>
                  <span className="font-medium capitalize">{insights.writingStats.mostProductiveTime}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
