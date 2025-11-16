import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as Blob

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Create a new File object with proper extension
    // Whisper API needs a file with the correct extension
    const file = new File([audioFile], "audio.webm", { type: "audio/webm" })

    // Create FormData for OpenAI API
    const openaiFormData = new FormData()
    openaiFormData.append("file", file)
    openaiFormData.append("model", "whisper-1")
    openaiFormData.append("language", "en") // Default to English

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Whisper API error:", error)
      return NextResponse.json({ error: "Failed to transcribe audio" }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({ transcription: data.text })
  } catch (error) {
    console.error("Error transcribing audio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
