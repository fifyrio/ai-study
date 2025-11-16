export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content || typeof content !== "string") {
      return Response.json({ error: "内容不能为空" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return Response.json({ error: "请在环境变量中设置 OPENROUTER_API_KEY" }, { status: 500 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Title Generator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "user",
            content: `请为以下学习内容生成一个简洁、准确的标题（不超过20个字）。只返回标题文本，不要有其他解释。

内容：
${content.substring(0, 500)}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenRouter API error:", errorData)
      return Response.json({ error: "生成标题失败" }, { status: 500 })
    }

    const data = await response.json()
    const title = data.choices?.[0]?.message?.content?.trim()

    if (!title) {
      return Response.json({ error: "AI 未返回有效标题" }, { status: 500 })
    }

    return Response.json({ title })
  } catch (error) {
    console.error("Error generating title:", error)
    return Response.json({ error: "生成标题时出错" }, { status: 500 })
  }
}
