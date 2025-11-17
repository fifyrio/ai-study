type Flashcard = { question: string; answer: string }

function parseFlashcardsText(rawText: string): Flashcard[] {
  const cleanedText = rawText.replace(/```json\n?|\n?```/g, "").trim()

  const tryParse = (text: string) => {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  const tryReturnArray = (value: unknown): Flashcard[] | null => {
    if (Array.isArray(value)) return value as Flashcard[]
    if (value && typeof value === "object" && Array.isArray((value as { flashcards?: Flashcard[] }).flashcards)) {
      return (value as { flashcards: Flashcard[] }).flashcards
    }
    return null
  }

  const directResult = tryReturnArray(tryParse(cleanedText))
  if (directResult) return directResult

  const arrayMatch = cleanedText.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    const arrayResult = tryReturnArray(tryParse(arrayMatch[0]))
    if (arrayResult) return arrayResult
  }

  const objectMatches = cleanedText.match(/\{[\s\S]*?\}/g)
  if (objectMatches) {
    const cards: Flashcard[] = []
    for (const rawCard of objectMatches) {
      if (!/"question"\s*:/i.test(rawCard) || !/"answer"\s*:/i.test(rawCard)) continue
      const normalized = rawCard.replace(/,\s*$/, "")
      const parsedCard = tryParse(normalized)
      if (parsedCard && typeof parsedCard === "object" && "question" in parsedCard && "answer" in parsedCard) {
        cards.push(parsedCard as Flashcard)
      }
    }
    if (cards.length > 0) return cards
  }

  throw new Error("Unable to parse flashcards JSON")
}

export async function POST(req: Request) {
  try {
    const { content, language = "中文", scenario = "学习", count = "10" } = await req.json()

    if (!content || typeof content !== "string") {
      return Response.json({ error: "请提供有效的学习资料" }, { status: 400 })
    }

    // Determine the number of flashcards to generate
    let cardCount: string
    if (count === "auto") {
      cardCount = "合适的数量（根据内容自动决定）"
    } else {
      cardCount = count
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return Response.json({ error: "请在环境变量中设置 OPENROUTER_API_KEY" }, { status: 500 })
    }

    const languageInstruction =
      language === "英语" ? "Please generate questions and answers in English." : "请用中文生成问题和答案。"

    // Define scenario-specific instructions
    const scenarioInstructions = {
      学习: `你是一个专业的教育助手。请根据以下学习资料生成${count === "auto" ? "合适数量的" : cardCount + " 个"}闪卡问答对，帮助学生深入理解和记忆关键概念。

要求：
1. ${count === "auto" ? "根据内容的丰富程度和知识点数量，自动决定生成合适数量的问答对（建议 5-15 个）" : "生成恰好 " + cardCount + " 个问答对"}
2. 问题应该清晰、具体，能够测试对关键概念的理解
3. 答案应该简洁明了，但包含必要的信息
4. 问答对应该覆盖资料中的不同重点`,

      面试: `你是一个专业的面试教练。请根据以下资料生成${count === "auto" ? "合适数量的" : cardCount + " 个"}模拟面试问题和参考答案，帮助用户准备面试。

要求：
1. ${count === "auto" ? "根据内容涉及的技能和经验范围，自动决定生成合适数量的面试问答对（建议 5-15 个）" : "生成恰好 " + cardCount + " 个面试问答对"}
2. 问题应该模拟真实面试场景，包括行为问题、技术问题、情景问题等
3. 答案应该提供结构化的参考回答（如使用 STAR 方法），展示最佳实践
4. 问题应该从易到难，覆盖不同面试阶段
5. 问题应该具有挑战性，能够展示候选人的深度理解和实践经验`,

      备考: `你是一个专业的考试辅导老师。请根据以下资料生成${count === "auto" ? "合适数量的" : cardCount + " 个"}考试重点问答对，帮助学生高效备考。

要求：
1. ${count === "auto" ? "根据内容的考点数量和重要程度，自动决定生成合适数量的考试问答对（建议 5-15 个）" : "生成恰好 " + cardCount + " 个考试问答对"}
2. 问题应该聚焦考试高频考点和重难点
3. 答案应该简洁精准，便于快速记忆和理解
4. 问题类型应该多样化（名词解释、简答题、论述题等）
5. 应该包含常见的易错点和陷阱题`,
    }

    const scenarioInstruction = scenarioInstructions[scenario as keyof typeof scenarioInstructions] || scenarioInstructions["学习"]

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
            content: `${scenarioInstruction}

${languageInstruction}

学习资料：
${content}

以 JSON 格式返回，格式如下：
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
      flashcards = parseFlashcardsText(text)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return Response.json({ error: "解析 AI 响应失败，请重试" }, { status: 500 })
    }

    // Validate flashcard count based on mode
    if (!Array.isArray(flashcards)) {
      return Response.json({ error: "生成的闪卡格式不正确，请重试" }, { status: 500 })
    }

    if (count !== "auto") {
      const expectedCount = parseInt(count)
      if (flashcards.length !== expectedCount) {
        return Response.json({ error: `生成的闪卡数量不正确（期望 ${expectedCount} 个，实际 ${flashcards.length} 个），请重试` }, { status: 500 })
      }
    } else {
      // For auto mode, accept any reasonable count (5-20)
      if (flashcards.length < 3 || flashcards.length > 20) {
        return Response.json({ error: "生成的闪卡数量超出合理范围，请重试" }, { status: 500 })
      }
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
