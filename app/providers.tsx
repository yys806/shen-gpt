'use client'

import { SessionProvider } from 'next-auth/react'
import { create } from 'zustand'

interface AppState {
  selectedModel: string
  apiKey: string
  setSelectedModel: (model: string) => void
  setApiKey: (key: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedModel: 'deepseek',
  apiKey: '',
  setSelectedModel: (model) => set({ selectedModel: model }),
  setApiKey: (key) => set({ apiKey: key }),
}))

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
} 