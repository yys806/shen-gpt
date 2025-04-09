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
      console.log(`Attempt ${i + 1} response:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        text: text.substring(0, 1000) // 只记录前1000个字符
      })

      // 检查响应是否为HTML或错误页面
      if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
        console.error('Received HTML response:', text.substring(0, 500))
        throw new Error('API服务器返回了HTML页面，可能是服务器配置问题')
      }

      // 尝试解析为 JSON
      try {
        const data = JSON.parse(text)
        if (!response.ok) {
          const errorMessage = data.error?.message || data.message || `API请求失败 (状态码: ${response.status})`
          console.error('API error response:', data)
          throw new Error(errorMessage)
        }
        return data
      } catch (parseError) {
        // 如果响应不是 JSON
        console.error('Failed to parse response as JSON:', {
          error: parseError,
          text: text.substring(0, 500)
        })

        // 检查是否包含常见错误信息
        if (text.includes('error') || text.includes('Error') || !response.ok) {
          throw new Error(text.includes('An error occurred')
            ? '服务器处理请求时发生错误，请稍后重试'
            : 'API服务器返回了无效的响应格式')
        }

        throw new Error('服务器返回了无效的数据格式')
      }
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed:`, error)
      
      // 如果是最后一次尝试，抛出错误
      if (i === retries - 1) {
        throw new Error(error.message || '请求失败，请稍后重试')
      }

      // 否则等待后重试
      const delay = 1000 * (i + 1)
      console.log(`Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('达到最大重试次数')
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

      console.log('Starting API request with body:', {
        model: requestBody.model,
        messages: requestBody.messages.map((m: any) => ({
          role: m.role,
          content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '') // 只记录消息的前100个字符
        }))
      })

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
        if (!data.choices?.[0]?.message?.content) {
          console.error('Unexpected API response structure:', data)
          throw new Error('API返回了意外的数据结构')
        }
        responseContent = data.choices[0].message.content
      }

      return NextResponse.json({ response: responseContent })
    } catch (error: any) {
      console.error('API request failed:', {
        error: error.message,
        stack: error.stack,
        cause: error.cause
      })
      return NextResponse.json(
        { error: error.message || '请求失败，请稍后重试' },
        { status: error.status || 500 }
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