import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center mb-8">
        欢迎使用珅哥GPT
      </h1>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm">
        <ChatInterface />
      </div>
    </div>
  )
} 