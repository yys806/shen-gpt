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

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        cache: 'no-store',
        next: { revalidate: 0 }
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      console.log('Raw API Response:', responseText)

      if (!response.ok) {
        let errorMessage = 'API request failed'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error?.message || errorData.message || `API request failed with status ${response.status}`
        } catch (e) {
          errorMessage = responseText || `API request failed with status ${response.status}`
        }
        console.error('API Error:', errorMessage)
        return NextResponse.json(
          { error: `API Error: ${errorMessage}` },
          { status: response.status }
        )
      }

      const data = JSON.parse(responseText)
      console.log('Parsed API Response:', JSON.stringify(data, null, 2))
      
      let responseContent

      if (model === 'claude') {
        responseContent = data.content[0].text
      } else {
        responseContent = data.choices[0].message.content
      }

      return NextResponse.json({ response: responseContent })
    } catch (fetchError: any) {
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
        cause: fetchError.cause,
      })
      const errorMessage = fetchError.name === 'AbortError' 
        ? 'Request timed out after 30 seconds' 
        : `${fetchError.message} (${fetchError.name})`
      return NextResponse.json(
        { 
          error: `Network error: ${errorMessage}`,
          details: {
            name: fetchError.name,
            message: fetchError.message,
            cause: fetchError.cause
          }
        },
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