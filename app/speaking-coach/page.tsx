"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Square, Loader2, ArrowLeft, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Feedback {
  transcription: string
  grammarErrors: string[]
  suggestions: string[]
  overallFeedback: string
}

export default function SpeakingCoachPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const question = searchParams.get("question") || ""
  const answer = searchParams.get("answer") || ""

  useEffect(() => {
    if (!question || !answer) {
      router.push("/")
    }
  }, [question, answer, router])

  const startRecording = async () => {
    try {
      // Check if we're in the browser
      if (typeof window === "undefined" || !navigator.mediaDevices) {
        setError("浏览器不支持录音功能")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await processAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError("")
      setFeedback(null)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      let errorMessage = "无法访问麦克风"

      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          errorMessage = "麦克风权限被拒绝。请点击浏览器地址栏左侧的锁图标，允许麦克风访问"
        } else if (err.name === "NotFoundError") {
          errorMessage = "未找到麦克风设备，请连接麦克风后重试"
        } else if (err.name === "NotSupportedError") {
          errorMessage = "当前浏览器不支持录音功能，请使用 Chrome、Edge 或 Firefox"
        } else if (err.name === "NotReadableError") {
          errorMessage = "麦克风已被其他应用占用，请关闭其他使用麦克风的应用"
        }
      }

      setError(errorMessage)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError("")

    try {
      // Step 1: Convert speech to text
      const formData = new FormData()
      formData.append("audio", audioBlob)

      const transcriptionResponse = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      })

      if (!transcriptionResponse.ok) {
        throw new Error("语音识别失败")
      }

      const { transcription } = await transcriptionResponse.json()

      // Step 2: Get AI feedback
      const feedbackResponse = await fetch("/api/analyze-speaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription,
          question,
          answer,
        }),
      })

      if (!feedbackResponse.ok) {
        throw new Error("分析失败")
      }

      const feedbackData = await feedbackResponse.json()
      setFeedback(feedbackData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理录音时出错")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-green-950/20 dark:to-teal-950/20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-20 h-72 w-72 rounded-full bg-green-400/20 blur-3xl dark:bg-green-500/10" />
        <div className="absolute -right-4 top-40 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute bottom-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 hover:bg-white/50 dark:hover:bg-gray-800/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>

          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
              <Mic className="h-4 w-4" />
              AI 口语教练
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 md:text-5xl">
              练习英语口语
            </h1>
          </div>

          <div className="space-y-6">
            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">闪卡问题</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{question}</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">参考答案</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{answer}</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="mb-6 text-gray-600 dark:text-gray-400">
                    点击下方按钮开始录制你的英语回答，AI 将分析你的语法和发音
                  </p>

                  {!isRecording && !isProcessing && (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="h-20 w-20 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-xl dark:from-green-500 dark:to-emerald-500"
                    >
                      <Mic className="h-8 w-8" />
                    </Button>
                  )}

                  {isRecording && (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="h-20 w-20 animate-pulse rounded-full bg-gradient-to-r from-red-600 to-pink-600 shadow-lg hover:from-red-700 hover:to-pink-700 hover:shadow-xl"
                    >
                      <Square className="h-8 w-8" />
                    </Button>
                  )}

                  {isProcessing && (
                    <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>正在分析你的口语...</span>
                    </div>
                  )}

                  {isRecording && (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">录音中...点击停止按钮完成</p>
                  )}

                  {error && (
                    <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {feedback && (
              <Card className="border-0 bg-gradient-to-br from-green-600 to-emerald-600 shadow-xl dark:from-green-700 dark:to-emerald-700">
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center gap-2 text-white">
                    <Sparkles className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">AI 反馈</h2>
                  </div>

                  <div className="space-y-6 text-white">
                    <div>
                      <h3 className="mb-2 font-semibold uppercase tracking-wider text-white/90">你的回答</h3>
                      <p className="rounded-lg bg-white/20 p-4 backdrop-blur-sm">{feedback.transcription}</p>
                    </div>

                    {feedback.grammarErrors.length > 0 && (
                      <div>
                        <h3 className="mb-2 font-semibold uppercase tracking-wider text-white/90">语法错误</h3>
                        <ul className="space-y-2 rounded-lg bg-white/20 p-4 backdrop-blur-sm">
                          {feedback.grammarErrors.map((error, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-300" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.suggestions.length > 0 && (
                      <div>
                        <h3 className="mb-2 font-semibold uppercase tracking-wider text-white/90">改进建议</h3>
                        <ul className="space-y-2 rounded-lg bg-white/20 p-4 backdrop-blur-sm">
                          {feedback.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-300" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="mb-2 font-semibold uppercase tracking-wider text-white/90">总体评价</h3>
                      <p className="rounded-lg bg-white/20 p-4 backdrop-blur-sm leading-relaxed">
                        {feedback.overallFeedback}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
