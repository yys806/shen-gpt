import { NextResponse } from 'next/server'

const MODEL_ENDPOINTS = {
  deepseek: 'https://api.deepseek.ai/v1/chat/completions',
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
      Authorization: `Bearer ${apiKey}`,
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
        max_tokens: 1000,
        temperature: 0.7,
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
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('API Error:', error)
      return NextResponse.json(
        { error: error.error?.message || 'API request failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('API Response:', JSON.stringify(data, null, 2))
    
    let responseText

    if (model === 'claude') {
      responseText = data.content[0].text
    } else {
      responseText = data.choices[0].message.content
    }

    return NextResponse.json({ response: responseText })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 