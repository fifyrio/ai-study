"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Globe, Target, BookOpen } from "lucide-react"
import FlashcardGrid from "@/components/flashcard-grid"
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

interface FlashcardSetDetailProps {
  flashcardSet: FlashcardSet
  onBack: () => void
}

export default function FlashcardSetDetail({ flashcardSet, onBack }: FlashcardSetDetailProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="hover:bg-white/50 dark:hover:bg-gray-800/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回历史记录
        </Button>

        <div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl">
            {flashcardSet.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{flashcardSet.flashcards.length} 个闪卡</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                创建于 {formatDistanceToNow(new Date(flashcardSet.createdAt), { addSuffix: true, locale: zhCN })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{flashcardSet.language}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>{flashcardSet.scenario}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard Grid */}
      <FlashcardGrid flashcards={flashcardSet.flashcards} />
    </div>
  )
}
