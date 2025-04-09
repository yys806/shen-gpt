'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

interface ChatLayoutProps {
  children?: React.ReactNode
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const [openAIKey, setOpenAIKey] = useState('')
  const [deepseekKey, setDeepseekKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const { toast } = useToast()

  // 从localStorage加载API密钥
  useEffect(() => {
    const savedOpenAIKey = localStorage.getItem('openai_key')
    const savedDeepseekKey = localStorage.getItem('deepseek_key')
    const savedAnthropicKey = localStorage.getItem('anthropic_key')

    if (savedOpenAIKey) setOpenAIKey(savedOpenAIKey)
    if (savedDeepseekKey) setDeepseekKey(savedDeepseekKey)
    if (savedAnthropicKey) setAnthropicKey(savedAnthropicKey)
  }, [])

  // 保存API密钥到localStorage
  const saveKeys = () => {
    if (openAIKey) localStorage.setItem('openai_key', openAIKey)
    if (deepseekKey) localStorage.setItem('deepseek_key', deepseekKey)
    if (anthropicKey) localStorage.setItem('anthropic_key', anthropicKey)

    toast({
      title: '保存成功',
      description: 'API密钥已保存到本地',
    })
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="openai_key">OpenAI API Key</Label>
              <Input
                id="openai_key"
                type="password"
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div>
              <Label htmlFor="deepseek_key">DeepSeek API Key</Label>
              <Input
                id="deepseek_key"
                type="password"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div>
              <Label htmlFor="anthropic_key">Anthropic API Key</Label>
              <Input
                id="anthropic_key"
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
          </div>
          <Button className="mt-4" onClick={saveKeys}>
            保存API密钥
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="gpt4" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gpt4">GPT-4</TabsTrigger>
          <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
          <TabsTrigger value="claude">Claude</TabsTrigger>
        </TabsList>
        <TabsContent value="gpt4" className="mt-4">
          {children}
        </TabsContent>
        <TabsContent value="deepseek" className="mt-4">
          {children}
        </TabsContent>
        <TabsContent value="claude" className="mt-4">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  )
} 