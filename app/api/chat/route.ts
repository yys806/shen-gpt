import { NextResponse } from 'next/server'

const MODEL_ENDPOINTS = {
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  'gpt-4': 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      const text = await response.text()

      // 尝试解析为 JSON
      try {
        const data = JSON.parse(text)
        if (!response.ok) {
          throw new Error(data.error?.message || data.message || `API request failed with status ${response.status}`)
        }
        return data
      } catch (parseError) {
        // 如果响应不是 JSON，检查是否包含错误信息
        if (text.includes('error') || text.includes('Error') || !response.ok) {
          console.error('Non-JSON error response:', text)
          throw new Error('API服务器返回了无效的响应格式，请稍后重试')
        }
        throw parseError
      }
    } catch (error: any) {
      if (i === retries - 1) throw error
      // 如果还有重试次数，等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('Maximum retries reached')
}

export async function POST(req: Request) {
  try {
    const { messages, model, apiKey } = await req.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const endpoint = MODEL_ENDPOINTS[model as keyof typeof MODEL_ENDPOINTS]
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Invalid model selected' },
        { status: 400 }
      )
    }

    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }

    if (model === 'deepseek') {
      headers = {
        ...headers,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Origin': 'https://api.deepseek.com',
        'Referer': 'https://api.deepseek.com/'
      }
    }

    let requestBody
    if (model === 'claude') {
      requestBody = {
        model: 'claude-3-opus-20240229',
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: 1000,
      }
    } else if (model === 'deepseek') {
      requestBody = {
        model: 'deepseek-chat',
        messages: messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      }
    } else {
      requestBody = {
        model: 'gpt-4',
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: 1000,
      }
    }

    console.log('Sending request to:', endpoint)
    console.log('Request headers:', { ...headers, Authorization: 'Bearer [REDACTED]' })
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds timeout

      const data = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        cache: 'no-store',
        next: { revalidate: 0 }
      })

      clearTimeout(timeoutId)
      
      let responseContent

      if (model === 'claude') {
        responseContent = data.content[0].text
      } else {
        responseContent = data.choices[0].message.content
      }

      return NextResponse.json({ response: responseContent })
    } catch (error: any) {
      console.error('API request error:', error)
      return NextResponse.json(
        { error: error.message || '请求失败，请稍后重试' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    )
  }
} 