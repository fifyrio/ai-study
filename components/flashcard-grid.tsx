"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { HelpCircle, Lightbulb, X, Volume2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Flashcard {
  question: string
  answer: string
}

interface FlashcardGridProps {
  flashcards: Flashcard[]
}

export default function FlashcardGrid({ flashcards }: FlashcardGridProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [playingAudio, setPlayingAudio] = useState<number | null>(null)
  const router = useRouter()

  const handlePlayAudio = async (e: React.MouseEvent, text: string, index: number) => {
    e.stopPropagation()

    if (playingAudio === index) {
      return
    }

    setPlayingAudio(index)

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setPlayingAudio(null)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error("Error playing audio:", error)
      setPlayingAudio(null)
    }
  }

  const handleSpeakingCoach = (e: React.MouseEvent, card: Flashcard) => {
    e.stopPropagation()
    const params = new URLSearchParams({
      question: card.question,
      answer: card.answer,
    })
    router.push(`/speaking-coach?${params.toString()}`)
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {flashcards.map((card, index) => (
          <div key={index} className="group cursor-pointer" onClick={() => setSelectedCard(index)}>
            <Card
              className={cn(
                "h-[240px] border-0 shadow-xl transition-all duration-300",
                "bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-950/30",
                "group-hover:shadow-2xl group-hover:scale-[1.02]",
              )}
            >
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-lg transition-all",
                        "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900",
                      )}
                      onClick={(e) => handleSpeakingCoach(e, card)}
                      title="口语教练"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-lg transition-all",
                        playingAudio === index
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900",
                      )}
                      onClick={(e) => handlePlayAudio(e, card.question, index)}
                      disabled={playingAudio === index}
                    >
                      <Volume2 className={cn("h-4 w-4", playingAudio === index && "animate-pulse")} />
                    </Button>
                    <HelpCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-2">
                  <p className="text-balance text-center text-lg font-semibold leading-relaxed text-gray-900 dark:text-gray-100">
                    {card.question}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                  点击查看答案
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {selectedCard !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700">
              <CardContent className="p-8 md:p-12">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 hover:text-white"
                  onClick={() => setSelectedCard(null)}
                >
                  <X className="h-5 w-5" />
                </Button>

                <div className="flex items-start justify-between mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white backdrop-blur-sm">
                    {selectedCard + 1}
                  </div>
                  <Lightbulb className="h-8 w-8 text-yellow-300" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-6 w-6 text-yellow-300" />
                    <h3 className="text-lg font-semibold uppercase tracking-wider text-white/90">答案</h3>
                  </div>
                  <p className="text-xl md:text-2xl leading-relaxed text-white whitespace-pre-wrap">
                    {flashcards[selectedCard].answer}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/60">点击任意处关闭</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
