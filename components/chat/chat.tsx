'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { KeyboardEvent, ChangeEvent } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
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
          model: 'deepseek',
          apiKey: localStorage.getItem('deepseek_key'),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '请求失败')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error: any) {
      toast({
        title: '错误',
        description: error.message || '发生了未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] max-h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1"
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? '发送中...' : '发送'}
          </Button>
        </div>
      </div>
    </div>
  )
} 