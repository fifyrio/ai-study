"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Sparkles, RotateCcw, BookOpen, Languages, Target, Hash } from "lucide-react"
import FlashcardGrid from "@/components/flashcard-grid"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface FlashcardGeneratorProps {
  initialFlashcards?: Flashcard[]
  initialTitle?: string
}

export default function FlashcardGenerator({ initialFlashcards, initialTitle }: FlashcardGeneratorProps = {}) {
  const [content, setContent] = useState("")
  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [language, setLanguage] = useState("中文")
  const [scenario, setScenario] = useState("学习")
  const [count, setCount] = useState("10")
  const [loadedTitle, setLoadedTitle] = useState(initialTitle)

  const generateFlashcards = async () => {
    if (!content.trim()) {
      setError("请输入学习资料")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, language, scenario, count }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "生成失败")
      }

      const data = await response.json()
      setFlashcards(data.flashcards)

      // Generate title and save to localStorage
      await saveFlashcardSet(content, data.flashcards)
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成闪卡时出错，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const saveFlashcardSet = async (contentText: string, cards: Flashcard[]) => {
    try {
      // Generate title
      const titleResponse = await fetch("/api/generate-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: contentText }),
      })

      let title = "未命名闪卡集"
      if (titleResponse.ok) {
        const titleData = await titleResponse.json()
        title = titleData.title
      }

      // Create flashcard set
      const flashcardSet: FlashcardSet = {
        id: Date.now().toString(),
        title,
        flashcards: cards,
        createdAt: new Date().toISOString(),
        language,
        scenario,
      }

      // Save to localStorage
      const savedSets = JSON.parse(localStorage.getItem("flashcardSets") || "[]")
      savedSets.unshift(flashcardSet) // Add to beginning

      // Keep only last 20 sets
      if (savedSets.length > 20) {
        savedSets.pop()
      }

      localStorage.setItem("flashcardSets", JSON.stringify(savedSets))

      // Dispatch event to notify other components
      window.dispatchEvent(new Event("flashcardsUpdated"))
    } catch (err) {
      console.error("Error saving flashcard set:", err)
      // Don't show error to user, saving is a nice-to-have feature
    }
  }

  const handleReset = () => {
    setContent("")
    setFlashcards([])
    setError("")
    setLoadedTitle(undefined)
  }

  return (
    <div className="space-y-8">
      {flashcards.length === 0 ? (
        <Card className="border-0 bg-white/80 shadow-2xl backdrop-blur-sm dark:bg-gray-900/80">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <label htmlFor="content" className="block text-lg font-semibold">
                    学习资料
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">粘贴或输入你想学习的内容</p>
                </div>
              </div>

              <Textarea
                id="content"
                placeholder="例如：课程笔记、文章段落、概念解释、历史事件、科学原理等...&#10;&#10;提示：内容越详细，生成的闪卡质量越高！"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[240px] resize-none border-2 border-gray-200 text-base leading-relaxed transition-colors focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800/50 dark:focus:border-blue-400"
                disabled={isLoading}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                    <Languages className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="language" className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                      输出语言
                    </label>
                    <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
                      <SelectTrigger className="mt-1.5 border-2 border-gray-200 bg-white transition-colors focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800/50 dark:focus:border-purple-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="中文">中文</SelectItem>
                        <SelectItem value="英语">英语</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="scenario" className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                      使用场景
                    </label>
                    <Select value={scenario} onValueChange={setScenario} disabled={isLoading}>
                      <SelectTrigger className="mt-1.5 border-2 border-gray-200 bg-white transition-colors focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800/50 dark:focus:border-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="学习">学习</SelectItem>
                        <SelectItem value="面试">面试</SelectItem>
                        <SelectItem value="备考">备考</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Hash className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="count" className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                      闪卡数量
                    </label>
                    <Select value={count} onValueChange={setCount} disabled={isLoading}>
                      <SelectTrigger className="mt-1.5 border-2 border-gray-200 bg-white transition-colors focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-800/50 dark:focus:border-cyan-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 个</SelectItem>
                        <SelectItem value="10">10 个</SelectItem>
                        <SelectItem value="auto">自动</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              <Button
                onClick={generateFlashcards}
                disabled={isLoading || !content.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-base font-semibold shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:opacity-50 dark:from-blue-500 dark:to-indigo-500"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    AI 正在生成闪卡...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    生成{count === "auto" ? "自动数量" : count + " 个"}闪卡
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {loadedTitle || "你的闪卡"}
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">点击任意卡片查看答案</p>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="border-2 font-semibold shadow-sm transition-all hover:bg-gray-100 hover:shadow-md dark:hover:bg-gray-800 bg-transparent"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              重新生成
            </Button>
          </div>
          <FlashcardGrid flashcards={flashcards} />
        </>
      )}
    </div>
  )
}
