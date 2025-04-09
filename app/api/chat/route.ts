import { NextResponse } from 'next/server'

const MODEL_ENDPOINTS = {
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  'gpt-4': 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
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
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 增加到60秒超时

      console.log('Sending request to DeepSeek API:', {
        endpoint,
        model: requestBody.model,
        messageCount: requestBody.messages.length
      })

      let response
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
          cache: 'no-store',
          next: { revalidate: 0 }
        })
      } catch (fetchError: any) {
        console.error('Fetch error details:', {
          name: fetchError.name,
          message: fetchError.message,
          cause: fetchError.cause,
          stack: fetchError.stack
        })

        // 如果是超时错误，返回特定消息
        if (fetchError.name === 'AbortError') {
          return NextResponse.json(
            { error: '请求超时，请稍后重试' },
            { status: 504 }
          )
        }

        // 如果是网络错误，返回特定消息
        if (fetchError.message.includes('network') || fetchError.message.includes('terminated')) {
          return NextResponse.json(
            { error: '网络连接错误，请检查网络连接并重试' },
            { status: 503 }
          )
        }

        throw fetchError
      }

      clearTimeout(timeoutId)

      const responseText = await response.text()
      console.log('Raw API Response:', responseText)
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      // 检查响应是否为HTML或错误页面
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>') || responseText.includes('An error occurred')) {
        console.error('Received invalid response:', responseText)
        return NextResponse.json(
          { 
            error: 'API服务器返回了无效的响应，请稍后重试',
            details: {
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              responsePreview: responseText.substring(0, 500)
            }
          },
          { status: 500 }
        )
      }

      // 尝试解析响应
      let data
      try {
        data = JSON.parse(responseText.trim())
      } catch (parseError) {
        console.error('JSON Parse error:', {
          error: parseError,
          responseText: responseText,
          status: response.status,
        })
        return NextResponse.json(
          { 
            error: '服务器返回了无效的数据格式，请稍后重试',
            details: {
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              responsePreview: responseText.substring(0, 500)
            }
          },
          { status: 500 }
        )
      }

      if (!response.ok) {
        let errorMessage = 'API request failed'
        errorMessage = data?.error?.message || data?.message || `API request failed with status ${response.status}`
        console.error('API Error:', {
          message: errorMessage,
          status: response.status,
          data: data
        })
        return NextResponse.json(
          { error: `API Error: ${errorMessage}` },
          { status: response.status }
        )
      }

      console.log('Parsed API Response:', JSON.stringify(data, null, 2))
      
      let responseContent

      if (model === 'claude') {
        responseContent = data.content[0].text
      } else {
        responseContent = data.choices[0].message.content
      }

      return NextResponse.json({ response: responseContent })
    } catch (error: any) {
      console.error('Chat API error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      })
      return NextResponse.json(
        { error: `Server error: ${error.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Chat API error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    })
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    )
  }
} 