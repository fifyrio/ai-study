export async function POST(req: Request) {
  try {
    const { content, language = "中文" } = await req.json()

    if (!content || typeof content !== "string") {
      return Response.json({ error: "请提供有效的学习资料" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return Response.json({ error: "请在环境变量中设置 OPENROUTER_API_KEY" }, { status: 500 })
    }

    const languageInstruction =
      language === "英语" ? "Please generate questions and answers in English." : "请用中文生成问题和答案。"

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Flashcard Generator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "user",
            content: `你是一个专业的教育助手。请根据以下学习资料生成 10 个闪卡问答对。

${languageInstruction}

学习资料：
${content}

要求：
1. 生成恰好 10 个问答对
2. 问题应该清晰、具体，能够测试对关键概念的理解
3. 答案应该简洁明了，但包含必要的信息
4. 问答对应该覆盖资料中的不同重点
5. 以 JSON 格式返回，格式如下：
[
  {"question": "问题1", "answer": "答案1"},
  {"question": "问题2", "answer": "答案2"},
  ...
]

只返回 JSON 数组，不要包含任何其他文字或解释。`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenRouter API error:", errorData)
      return Response.json({ error: "调用 OpenRouter API 失败，请检查 API 密钥" }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      return Response.json({ error: "AI 未返回有效响应" }, { status: 500 })
    }

    let flashcards
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      flashcards = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return Response.json({ error: "解析 AI 响应失败，请重试" }, { status: 500 })
    }

    if (!Array.isArray(flashcards) || flashcards.length !== 10) {
      return Response.json({ error: "生成的闪卡数量不正确，请重试" }, { status: 500 })
    }

    for (const card of flashcards) {
      if (!card.question || !card.answer) {
        return Response.json({ error: "闪卡格式不正确，请重试" }, { status: 500 })
      }
    }

    return Response.json({ flashcards })
  } catch (error) {
    console.error("Error generating flashcards:", error)
    return Response.json({ error: "生成闪卡时出错，请检查 API 密钥并重试" }, { status: 500 })
  }
}
