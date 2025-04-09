'use client'

import { useState } from 'react'
import { useAppStore } from '@/app/providers'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { selectedModel, apiKey } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !apiKey) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          apiKey,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'API request failed')
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch (error: any) {
      console.error('Error:', error)
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: `抱歉，发生了错误：${error.message || '请检查您的API密钥是否正确，或稍后重试。'}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-4">👋 欢迎使用珅哥GPT！</p>
            {!apiKey ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="mb-2">⚠️ 请先配置API密钥才能开始对话</p>
                <Link href="/profile" className="text-primary hover:underline">
                  点击这里前往配置
                </Link>
              </div>
            ) : (
              <p>开始输入您的问题吧！</p>
            )}
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : message.content.startsWith('抱歉，发生了错误')
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-white shadow-sm'
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm rounded-lg p-4">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={apiKey ? "输入您的问题..." : "请先在个人中心配置API密钥"}
            className="flex-1 input-field"
            disabled={isLoading || !apiKey}
          />
          <button
            type="submit"
            className={`btn-primary ${(!apiKey || !input.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!apiKey || !input.trim() || isLoading}
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
        {!apiKey && (
          <p className="mt-2 text-sm text-gray-500">
            提示：您需要先在
            <Link href="/profile" className="text-primary hover:underline mx-1">
              个人中心
            </Link>
            配置API密钥才能发送消息
          </p>
        )}
      </form>
    </div>
  )
} 