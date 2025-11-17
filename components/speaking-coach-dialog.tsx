"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mic, Square, Loader2, Sparkles, AlertCircle, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GrammarError {
  original: string
  corrected: string
  explanation: string
}

interface Feedback {
  transcription: string
  grammarErrors: GrammarError[]
  suggestions: string[]
  overallFeedback: string
}

interface SpeakingCoachDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  question: string
  answer: string
}

export default function SpeakingCoachDialog({ open, onOpenChange, question, answer }: SpeakingCoachDialogProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState("")
  const [playingAudio, setPlayingAudio] = useState(false)
  const [playingAnswerAudio, setPlayingAnswerAudio] = useState(false)
  const [playingGrammarIndex, setPlayingGrammarIndex] = useState<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
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

  const handlePlayQuestionAudio = async () => {
    if (playingAudio) {
      return
    }

    setPlayingAudio(true)

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: question }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setPlayingAudio(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error("Error playing audio:", error)
      setPlayingAudio(false)
    }
  }

  const handlePlayAnswerAudio = async () => {
    if (playingAnswerAudio) {
      return
    }

    setPlayingAnswerAudio(true)

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: answer }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        setPlayingAnswerAudio(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error("Error playing audio:", error)
      setPlayingAnswerAudio(false)
    }
  }

  const handlePlayGrammarAudio = async (text: string, index: number) => {
    if (playingGrammarIndex !== null) {
      return
    }

    setPlayingGrammarIndex(index)

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
        setPlayingGrammarIndex(null)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error("Error playing audio:", error)
      setPlayingGrammarIndex(null)
    }
  }

  const handleClose = () => {
    setFeedback(null)
    setError("")
    setIsRecording(false)
    setIsProcessing(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mic className="h-5 w-5 text-green-600" />
            口语教练
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question */}
          <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">问题</h3>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  playingAudio
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900",
                )}
                onClick={handlePlayQuestionAudio}
                disabled={playingAudio}
                title="播放问题语音"
              >
                <Volume2 className={cn("h-4 w-4", playingAudio && "animate-pulse")} />
              </Button>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{question}</p>
          </div>

          {/* Answer Reference */}
          <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">参考答案</h3>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  playingAnswerAudio
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900",
                )}
                onClick={handlePlayAnswerAudio}
                disabled={playingAnswerAudio}
                title="播放参考答案语音"
              >
                <Volume2 className={cn("h-4 w-4", playingAnswerAudio && "animate-pulse")} />
              </Button>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{answer}</p>
          </div>

          {/* Recording Controls */}
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/30">
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              点击按钮录制你的英语回答，AI 将分析你的语法
            </p>

            {!isRecording && !isProcessing && (
              <Button
                onClick={startRecording}
                size="lg"
                className="h-16 w-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500"
              >
                <Mic className="h-7 w-7" />
              </Button>
            )}

            {isRecording && (
              <div className="space-y-3">
                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="h-16 w-16 animate-pulse rounded-full bg-gradient-to-r from-red-600 to-pink-600 shadow-lg hover:from-red-700 hover:to-pink-700"
                >
                  <Square className="h-7 w-7" />
                </Button>
                <p className="text-sm text-red-600 dark:text-red-400">录音中...点击停止</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">正在分析你的口语...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 p-6 text-white dark:from-green-700 dark:to-emerald-700">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-lg font-bold">AI 反馈</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/90">你的回答</h4>
                  <p className="rounded-lg bg-white/20 p-3 text-sm backdrop-blur-sm">{feedback.transcription}</p>
                </div>

                {feedback.grammarErrors.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/90">语法错误</h4>
                    <div className="space-y-3 rounded-lg bg-white/20 p-3 text-sm backdrop-blur-sm">
                      {feedback.grammarErrors.map((error, index) => (
                        <div key={index} className="space-y-1.5 rounded-lg bg-white/10 p-3">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-red-300">✗</span>
                            <div className="flex-1">
                              <span className="font-medium text-red-200">原句：</span>
                              <span className="line-through">{error.original}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 flex-shrink-0 rounded-lg transition-all",
                                playingGrammarIndex === index * 2
                                  ? "bg-white/30 text-white hover:bg-white/40"
                                  : "bg-white/10 text-white/80 hover:bg-white/20",
                              )}
                              onClick={() => handlePlayGrammarAudio(error.original, index * 2)}
                              disabled={playingGrammarIndex !== null}
                              title="播放原句语音"
                            >
                              <Volume2 className={cn("h-3.5 w-3.5", playingGrammarIndex === index * 2 && "animate-pulse")} />
                            </Button>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-green-300">✓</span>
                            <div className="flex-1">
                              <span className="font-medium text-green-200">修正：</span>
                              <span>{error.corrected}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 flex-shrink-0 rounded-lg transition-all",
                                playingGrammarIndex === index * 2 + 1
                                  ? "bg-white/30 text-white hover:bg-white/40"
                                  : "bg-white/10 text-white/80 hover:bg-white/20",
                              )}
                              onClick={() => handlePlayGrammarAudio(error.corrected, index * 2 + 1)}
                              disabled={playingGrammarIndex !== null}
                              title="播放修正后语音"
                            >
                              <Volume2
                                className={cn("h-3.5 w-3.5", playingGrammarIndex === index * 2 + 1 && "animate-pulse")}
                              />
                            </Button>
                          </div>
                          <div className="ml-6 text-xs text-white/80">
                            <span className="font-medium">说明：</span>
                            {error.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {feedback.suggestions.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/90">改进建议</h4>
                    <ul className="space-y-1 rounded-lg bg-white/20 p-3 text-sm backdrop-blur-sm">
                      {feedback.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-yellow-300" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/90">总体评价</h4>
                  <p className="rounded-lg bg-white/20 p-3 text-sm leading-relaxed backdrop-blur-sm">
                    {feedback.overallFeedback}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
