export async function POST(req: Request) {
  try {
    const { transcription, question, answer } = await req.json()

    if (!transcription || typeof transcription !== "string") {
      return Response.json({ error: "Transcription is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return Response.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Speaking Coach",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "user",
            content: `You are a professional English speaking coach. Analyze the following English response and provide detailed feedback.

Question: ${question}
Expected Answer: ${answer}
User's Spoken Response: ${transcription}

Please analyze the user's spoken English and provide:
1. Grammar errors (if any)
2. Suggestions for improvement (pronunciation, word choice, sentence structure, fluency)
3. Overall feedback on their speaking

Return your analysis in the following JSON format:
{
  "transcription": "${transcription}",
  "grammarErrors": ["error1", "error2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "overallFeedback": "detailed feedback here"
}

Requirements:
- If there are no grammar errors, return an empty array for grammarErrors
- Provide at least 2-3 constructive suggestions
- Make the overall feedback encouraging but honest
- Focus on practical improvements
- Only return the JSON object, no other text or explanations.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenRouter API error:", errorData)
      return Response.json({ error: "Failed to analyze speaking" }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      return Response.json({ error: "AI did not return a valid response" }, { status: 500 })
    }

    let feedback
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      feedback = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return Response.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    // Validate response structure
    if (!feedback.grammarErrors || !feedback.suggestions || !feedback.overallFeedback) {
      return Response.json({ error: "Invalid feedback structure" }, { status: 500 })
    }

    return Response.json(feedback)
  } catch (error) {
    console.error("Error analyzing speaking:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
