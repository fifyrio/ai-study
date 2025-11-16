"use client"

import { useState } from "react"
import FlashcardGenerator from "@/components/flashcard-generator"
import FlashcardHistory from "@/components/flashcard-history"
import FlashcardSetDetail from "@/components/flashcard-set-detail"
import { Sparkles } from "lucide-react"

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

export default function Home() {
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null)

  const handleSelectSet = (set: FlashcardSet) => {
    setSelectedSet(set)
  }

  const handleBackToHistory = () => {
    setSelectedSet(null)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute -right-4 top-40 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/10" />
        <div className="absolute bottom-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          {selectedSet ? (
            // Detail View
            <FlashcardSetDetail flashcardSet={selectedSet} onBack={handleBackToHistory} />
          ) : (
            // Home View
            <>
              <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  <Sparkles className="h-4 w-4" />
                  AI 驱动的智能学习工具
                </div>
                <h1 className="mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 md:text-6xl">
                  AI 闪卡生成器
                </h1>
                <p className="mx-auto max-w-2xl text-balance text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                  输入任何学习资料，让 AI 为你自动生成精心设计的问答闪卡，让学习更高效
                </p>
              </div>
              <div className="space-y-8">
                <FlashcardHistory onSelectSet={handleSelectSet} />
                <FlashcardGenerator />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
