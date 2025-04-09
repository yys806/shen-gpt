'use client'

import { useSession } from 'next-auth/react'
import { useAppStore } from '../providers'
import { useState } from 'react'

export default function Profile() {
  const { data: session } = useSession()
  const { apiKey, setApiKey } = useAppStore()
  const [newApiKey, setNewApiKey] = useState(apiKey)

  const handleSave = () => {
    setApiKey(newApiKey)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">个人中心</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">个人信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <p className="mt-1">{session?.user?.name || '未设置'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">邮箱</label>
            <p className="mt-1">{session?.user?.email || '未设置'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">API 配置</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="mt-1 input-field"
              placeholder="输入您的 API Key"
            />
          </div>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
} 