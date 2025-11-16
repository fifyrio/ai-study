"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Trash2, BookOpen, Calendar, Globe, Target } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Flashcard {
  question: string
  answer: string
}

interface FlashcardSet {
  id: string
  title: string
  flashcards: Flashcard[]
  createdAt: string
  language: string
  scenario: string
}

interface FlashcardHistoryProps {
  onLoadFlashcards: (flashcards: Flashcard[], title: string) => void
}

export default function FlashcardHistory({ onLoadFlashcards }: FlashcardHistoryProps) {
  const [savedSets, setSavedSets] = useState<FlashcardSet[]>([])

  useEffect(() => {
    loadSavedSets()

    // Listen for updates
    const handleUpdate = () => {
      loadSavedSets()
    }

    window.addEventListener("flashcardsUpdated", handleUpdate)
    return () => window.removeEventListener("flashcardsUpdated", handleUpdate)
  }, [])

  const loadSavedSets = () => {
    try {
      const sets = JSON.parse(localStorage.getItem("flashcardSets") || "[]")
      setSavedSets(sets)
    } catch (err) {
      console.error("Error loading saved sets:", err)
    }
  }

  const deleteSet = (id: string) => {
    try {
      const sets = savedSets.filter((set) => set.id !== id)
      localStorage.setItem("flashcardSets", JSON.stringify(sets))
      setSavedSets(sets)
    } catch (err) {
      console.error("Error deleting set:", err)
    }
  }

  const loadSet = (set: FlashcardSet) => {
    onLoadFlashcards(set.flashcards, set.title)
  }

  if (savedSets.length === 0) {
    return null
  }

  return (
    <Card className="border-0 bg-white/80 shadow-2xl backdrop-blur-sm dark:bg-gray-900/80">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <History className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-xl text-gray-900 dark:text-gray-100">历史记录</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savedSets.map((set) => (
            <div
              key={set.id}
              className="group flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-blue-600"
            >
              <div className="flex-1 cursor-pointer" onClick={() => loadSet(set)}>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">{set.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{set.flashcards.length} 个闪卡</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(set.createdAt), { addSuffix: true, locale: zhCN })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span>{set.language}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{set.scenario}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSet(set.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                title="删除"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
