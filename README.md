# 珅哥GPT

一个现代化的AI助手平台，支持多种AI模型和功能，包括对话、绘画、PPT生成和音乐创作等。

## 功能特点

- 支持多种AI模型（DeepSeek、GPT-4、Claude等）
- 简洁现代的UI设计，灵感来自苹果官网
- 用户认证系统（支持GitHub和Google登录）
- API密钥管理
- Markdown支持
- 响应式设计

## 技术栈

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- NextAuth.js
- Zustand

## 本地开发

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/shen-gpt.git
cd shen-gpt
```

2. 安装依赖：
```bash
npm install
```

3. 创建环境变量文件：
```bash
cp .env.example .env.local
```

4. 配置环境变量：
```env
# 认证配置
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret

# 数据库配置（如果需要）
DATABASE_URL=your_database_url
```

5. 启动开发服务器：
```bash
npm run dev
```

## 部署

1. 构建生产版本：
```bash
npm run build
```

2. 启动生产服务器：
```bash
npm start
```

## 环境变量说明

- `GITHUB_ID` 和 `GITHUB_SECRET`：GitHub OAuth应用凭证
- `GOOGLE_ID` 和 `GOOGLE_SECRET`：Google OAuth应用凭证
- `DATABASE_URL`：数据库连接URL（如果需要持久化存储）

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT 