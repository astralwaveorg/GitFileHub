# GitFileDock - 开发计划

> 轻量级 Git 文件服务器 | A lightweight Git-powered file server

## 项目概述

GitFileDock 是一个通过 Web 界面管理多个 Git 仓库的轻量级文件服务器。用户可以浏览、预览、编辑、上传、下载文件，支持代码高亮、匿名访问，所有变更自动提交推送。提供类似 GitHub Raw 的文件直链能力，支持 GitHub / Gitea / Gitee 平台的 Webhook 自动同步与定时拉取。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16 |
| 语言 | TypeScript | 5.x |
| UI 组件 | Tailwind CSS + shadcn/ui | 最新 |
| 数据库 | SQLite + Prisma ORM | 最新 |
| 代码高亮 | Shiki | 最新 |
| 代码编辑 | CodeMirror 6 | 最新 |
| 认证 | JWT (jsonwebtoken) + HttpOnly Cookie | - |
| Git 操作 | Node.js child_process (git CLI) | - |
| 定时任务 | node-cron | - |
| 文件上传 | Next.js API + formidable | - |
| 部署 | Docker + Docker Compose / Node.js | - |

## 功能模块

### 模块 1：认证系统
- [x] 默认管理员账户 (admin/admin123)
- [x] 登录/登出
- [x] 修改密码
- [x] 首次登录强制修改密码
- [x] JWT Token + HttpOnly Cookie
- [x] 中间件保护需要认证的路由

### 模块 2：仓库管理
- [x] 仓库 CRUD（增删改查）
- [x] 仓库切换器（下拉菜单）
- [x] 添加仓库时自动 clone
- [x] 仓库配置：隐藏路径、同步间隔、Webhook Secret
- [x] 仓库删除（可选是否删除本地文件）

### 模块 3：SSH 密钥管理
- [x] SSH 密钥 CRUD
- [x] 密钥加密存储
- [x] 添加/编辑时只显示最后 4 位指纹

### 模块 4：文件浏览
- [x] 面包屑导航（逐层进入目录）
- [x] 文件列表视图（列表/网格切换）
- [x] 文件夹显示包含文件数
- [x] 文件类型图标区分
- [x] 搜索当前目录文件
- [x] 按名称/大小/时间排序
- [x] 分页/虚拟滚动（大目录）
- [x] 隐藏文件过滤（根据仓库配置的隐藏路径）

### 模块 5：文件预览
- [x] 代码文件：行号 + 语法高亮（Shiki）
  - 支持：JS/TS/JSX/TSX/Python/Go/Java/Rust/C/C++/HTML/CSS/SCSS/JSON/YAML/TOML/Shell/SQL/MD 等
- [x] Markdown：渲染富文本 + 源码切换
- [x] 图片：直接展示 + 缩放
- [x] PDF：内嵌预览
- [x] 文本文件：纯文本展示
- [x] 二进制文件：显示文件信息 + 下载按钮

### 模块 6：文件编辑
- [x] 文本/代码文件可编辑（CodeMirror 6）
- [x] 编辑器：行号、语法高亮、Tab 缩进
- [x] 图片和二进制文件不显示编辑按钮
- [x] 保存时自动 git add → commit → push
- [x] 提交状态实时显示

### 模块 7：文件操作
- [x] 新建文件
- [x] 新建文件夹
- [x] 删除文件/文件夹（确认弹窗）
- [x] 重命名文件/文件夹（行内编辑）
- [x] 所有变更自动 git commit + push

### 模块 8：文件上传
- [x] 点击上传 + 拖拽上传
- [x] 批量上传
- [x] 同名文件覆盖确认
- [x] 上传大小限制 100MB
- [x] 上传完成自动 git commit + push

### 模块 9：文件下载
- [x] 单文件下载
- [x] 文件夹打包 ZIP 下载

### 模块 10：复制链接
- [x] 复制文件直链（类似 GitHub Raw）
- [x] 复制目录链接（浏览器中浏览目录）
- [x] 自动获取当前域名生成链接
- [x] 链接支持 wget/curl 直接下载文件内容
- [x] 链接支持匿名访问（即使文件在隐藏列表中）

### 模块 11：Git 同步
- [x] 手动同步按钮（git pull）
- [x] 同步进度显示
- [x] 冲突提示
- [x] 定时同步（30min/1h/2h/4h/关闭），使用 node-cron
- [x] Webhook 自动同步
  - 支持 GitHub push event
  - 支持 Gitea push event
  - 支持 Gitee push event
  - Webhook URL 格式：/api/webhook/:secret
  - Ping event 响应

### 模块 12：设置页面
- [x] 仓库管理标签页
- [x] SSH 密钥管理标签页
- [x] 个人信息标签页（修改用户名/密码）
- [x] 需要登录才能访问

### 模块 13：匿名访问 & 分享
- [x] 未登录用户可浏览公开文件
- [x] 设置中隐藏的文件在浏览时不显示
- [x] 但隐藏文件的直链仍可通过链接访问
- [x] 分享链接可在浏览器中打开预览
- [x] 分享链接可通过 wget/curl 下载原始内容

## 页面路由设计

| 路由 | 页面 | 认证 | 说明 |
|------|------|:----:|------|
| `/` | 文件浏览主页 | 否 | 默认显示第一个仓库根目录 |
| `/login` | 登录页 | 否 | 管理员登录 |
| `/settings` | 设置页 | 是 | 仓库/密钥/用户管理 |
| `/browse/[repo]` | 仓库根目录 | 否 | 浏览指定仓库 |
| `/browse/[repo]/[...path]` | 子目录/文件 | 否 | 浏览子目录或预览文件 |
| `/raw/[repo]/[...path]` | 文件原始内容 | 否 | 类似 GitHub Raw，供 wget/curl |
| `/api/auth/*` | 认证 API | 否 | 登录/登出/修改密码 |
| `/api/repos` | 仓库 API | 视操作 | GET 不需认证，POST/PUT/DELETE 需要 |
| `/api/files/[repo]/*` | 文件 API | 视操作 | GET/下载不需认证，写入操作需要 |
| `/api/keys/*` | 密钥 API | 是 | 密钥管理 |
| `/api/git/*` | Git API | 是 | 同步/状态 |
| `/api/webhook/:secret` | Webhook | 否 | 接收平台推送 |

## API 设计

### 认证 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| POST | /api/auth/login | 登录 | 否 |
| POST | /api/auth/logout | 登出 | 是 |
| GET | /api/auth/me | 获取当前用户信息 | 是 |
| PUT | /api/auth/password | 修改密码 | 是 |

### 仓库 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| GET | /api/repos | 获取仓库列表 | 否 |
| POST | /api/repos | 添加仓库 | 是 |
| PUT | /api/repos/[id] | 编辑仓库配置 | 是 |
| DELETE | /api/repos/[id] | 删除仓库 | 是 |
| POST | /api/repos/[id]/sync | 手动同步 | 是 |
| GET | /api/repos/[id]/status | 获取仓库状态（分支、最新提交等） | 否 |

### 文件 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| GET | /api/files/[repo] | 列出仓库根目录 | 否 |
| GET | /api/files/[repo]/[...path] | 列出子目录/获取文件内容 | 否 |
| POST | /api/files/[repo]/[...path] | 创建文件/文件夹 | 是 |
| PUT | /api/files/[repo]/[...path] | 编辑文件内容 | 是 |
| DELETE | /api/files/[repo]/[...path] | 删除文件/文件夹 | 是 |
| POST | /api/files/[repo]/upload | 上传文件到指定目录 | 是 |
| GET | /api/files/[repo]/download/[...path] | 下载文件/文件夹(ZIP) | 否 |

### 密钥 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| GET | /api/keys | 获取密钥列表 | 是 |
| POST | /api/keys | 添加密钥 | 是 |
| PUT | /api/keys/[id] | 编辑密钥 | 是 |
| DELETE | /api/keys/[id] | 删除密钥 | 是 |

### Webhook API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| POST | /api/webhook/[secret] | 接收 Webhook 推送 | 否 |

## 数据库设计 (SQLite + Prisma)

### User 表
```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  mustChangePwd Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### SSHKey 表
```prisma
model SSHKey {
  id         String   @id @default(cuid())
  name       String
  privateKey String   // 加密存储
  fingerprint String  // SSH 密钥指纹（用于显示）
  createdAt  DateTime @default(now())
  repos      Repo[]
}
```

### Repo 表
```prisma
model Repo {
  id               String   @id @default(cuid())
  name             String   @unique
  remoteUrl        String
  localPath        String
  branch           String   @default("main")
  sshKeyId         String
  sshKey           SSHKey   @relation(fields: [sshKeyId], references: [id])
  hiddenPaths      String   @default("[]")  // JSON 数组
  autoPullInterval Int      @default(0)      // 分钟，0=关闭
  webhookSecret    String   @unique
  platform         String   @default("github") // github/gitea/gitee
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

## 项目目录结构

```
GitFileDock/
├── PLAN.md                    # 本文件 - 开发计划
├── LICENSE                    # MIT 许可证
├── README.md                  # 项目说明
├── .gitignore                 # Git 忽略配置
├── .env.example               # 环境变量示例
├── docker-compose.yml         # Docker 编排
├── Dockerfile                 # Docker 镜像
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── prisma/
│   ├── schema.prisma          # 数据库模型
│   └── seed.ts                # 初始数据种子
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 根布局（暗色主题）
│   │   ├── page.tsx           # 首页（重定向到第一个仓库）
│   │   ├── globals.css        # 全局样式
│   │   ├── login/
│   │   │   └── page.tsx       # 登录页
│   │   ├── settings/
│   │   │   └── page.tsx       # 设置页
│   │   ├── browse/
│   │   │   └── [repo]/
│   │   │       └── [...path]/
│   │   │           └── page.tsx  # 文件浏览/预览
│   │   ├── raw/
│   │   │   └── [repo]/
│   │   │       └── [...path]/
│   │   │           └── route.ts  # 原始文件下载端点
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── me/route.ts
│   │       │   └── password/route.ts
│   │       ├── repos/
│   │       │   ├── route.ts         # GET 列表 / POST 添加
│   │       │   └── [id]/
│   │       │       ├── route.ts     # PUT 编辑 / DELETE 删除
│   │       │       ├── sync/route.ts
│   │       │       └── status/route.ts
│   │       ├── files/
│   │       │   └── [repo]/
│   │       │       ├── [...path]/
│   │       │       │   └── route.ts # GET 浏览/POST 创建/PUT 编辑/DELETE 删除
│   │       │       ├── upload/
│   │       │       │   └── route.ts
│   │       │       └── download/
│   │       │           └── [...path]/
│   │       │               └── route.ts
│   │       ├── keys/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── git/
│   │       │   └── pull/
│   │       │       └── [id]/
│   │       │           └── route.ts
│   │       └── webhook/
│   │           └── [secret]/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/               # shadcn/ui 基础组件
│   │   ├── layout/
│   │   │   ├── Header.tsx        # 顶部导航栏
│   │   │   ├── Footer.tsx        # 底部状态栏
│   │   │   └── Sidebar.tsx       # 侧边栏（可选）
│   │   ├── file/
│   │   │   ├── FileList.tsx      # 文件列表
│   │   │   ├── FileItem.tsx      # 单个文件项
│   │   │   ├── FileGrid.tsx      # 网格视图
│   │   │   ├── FileIcon.tsx      # 文件类型图标
│   │   │   └── FileActions.tsx   # 文件操作菜单
│   │   ├── editor/
│   │   │   ├── CodeEditor.tsx    # CodeMirror 编辑器
│   │   │   └── CodePreview.tsx   # 代码预览（Shiki 高亮）
│   │   ├── preview/
│   │   │   ├── ImagePreview.tsx  # 图片预览
│   │   │   ├── MarkdownPreview.tsx # Markdown 预览
│   │   │   ├── PdfPreview.tsx    # PDF 预览
│   │   │   └── PreviewPanel.tsx  # 预览面板容器
│   │   ├── repo/
│   │   │   ├── RepoSwitcher.tsx  # 仓库切换器
│   │   │   └── RepoSettings.tsx  # 仓库设置表单
│   │   ├── nav/
│   │   │   └── Breadcrumb.tsx    # 面包屑导航
│   │   └── common/
│   │       ├── SearchInput.tsx   # 搜索框
│   │       ├── UploadDialog.tsx  # 上传对话框
│   │       ├── ConfirmDialog.tsx # 确认弹窗
│   │       ├── Toast.tsx         # 提示消息
│   │       └── CopyButton.tsx    # 复制按钮
│   ├── lib/
│   │   ├── db.ts              # Prisma 客户端
│   │   ├── auth.ts            # 认证工具（JWT 签发/验证）
│   │   ├── git.ts             # Git 操作封装
│   │   ├── file-utils.ts      # 文件类型判断、大小格式化等
│   │   ├── crypto.ts          # SSH 密钥加密/解密
│   │   ├── scheduler.ts       # 定时任务（node-cron）
│   │   ├── webhook.ts         # Webhook 处理器
│   │   └── constants.ts       # 常量定义
│   └── middleware.ts          # Next.js 中间件（认证检查）
├── data/                      # 运行时数据（gitignore）
│   ├── gitfiledock.db         # SQLite 数据库
│   └── repos/                 # Git 仓库本地存储
└── public/
    └── favicon.ico
```

## 开发阶段

### 阶段 1：项目初始化 [进行中]
- [x] 创建项目目录
- [x] 生成 SSH Deploy Key
- [x] 编写 PLAN.md
- [x] 创建 LICENSE / .gitignore / README.md
- [x] 初始化 Next.js 项目
- [x] 配置 Prisma + SQLite
- [x] 配置 Tailwind CSS + shadcn/ui
- [x] 数据库 seed（默认管理员）
- [x] 首次提交推送

### 阶段 2：认证系统
- [x] JWT 工具函数
- [x] 登录 API
- [x] 登录页面
- [x] 认证中间件
- [x] 修改密码 API + 页面

### 阶段 3：仓库 & 密钥管理
- [x] SSH 密钥 CRUD API
- [x] 仓库 CRUD API
- [x] 设置页面（仓库管理、密钥管理）
- [x] Git 操作封装（clone/pull/commit/push）

### 阶段 4：文件浏览核心
- [x] 文件列表 API
- [x] 面包屑导航
- [x] 仓库切换器
- [x] 文件列表组件（列表视图）
- [x] 文件图标
- [x] 搜索和排序
- [x] 隐藏文件过滤

### 阶段 5：文件预览 & 编辑
- [x] 代码预览（Shiki 语法高亮）
- [x] Markdown 预览
- [x] 图片预览
- [x] 代码编辑器（CodeMirror 6）
- [x] 文件编辑 API（自动 commit + push）

### 阶段 6：文件操作
- [x] 新建文件/文件夹 API + UI
- [x] 删除 API + 确认弹窗
- [x] 重命名 API + 行内编辑
- [x] 文件下载 API
- [x] 文件夹 ZIP 下载
- [x] 上传 API + 拖拽上传 UI
- [x] 同名文件覆盖确认

### 阶段 7：复制链接 & Raw 端点
- [x] 复制链接按钮
- [x] /raw/[repo]/[...path] 端点
- [x] wget/curl 兼容（Content-Disposition）

### 阶段 8：Git 同步 & Webhook
- [x] 手动同步按钮 + API
- [x] 定时同步（node-cron）
- [x] Webhook 接收 API
- [x] GitHub Webhook 解析
- [x] Gitea Webhook 解析
- [x] Gitee Webhook 解析

### 阶段 9：Docker 部署
- [x] Dockerfile
- [x] docker-compose.yml
- [x] .env.example
- [x] 部署文档

### 阶段 10：测试 & 优化
- [x] 功能测试
- [x] 暗色主题优化
- [x] 响应式适配
- [x] 性能优化（大目录虚拟滚动）

## 安全设计

| 项目 | 方案 |
|------|------|
| 密码存储 | bcrypt 哈希 |
| SSH 密钥存储 | AES-256-GCM 加密，密钥来自环境变量 |
| JWT | HS256 签名，Token 有效期 7 天，HttpOnly Cookie |
| 文件路径 | 严格校验，防止目录遍历（path.resolve + 白名单） |
| 文件上传 | 类型检测 + 大小限制（100MB）+ 路径校验 |
| Git 操作 | 每次操作前检查仓库状态 |
| Webhook | Secret 校验 |
| CSRF | SameSite Cookie + Token 校验 |

## 环境变量

```env
# 应用
PORT=3000
BASE_URL=http://localhost:3000

# JWT 密钥（首次启动自动生成）
JWT_SECRET=your-jwt-secret-change-this

# SSH 密钥加密密钥（首次启动自动生成）
ENCRYPTION_KEY=your-encryption-key-change-this

# Git 用户信息（用于 commit）
GIT_USER_NAME=GitFileDock
GIT_USER_EMAIL=gitfiledock@local
```

## 部署方式

### Docker（推荐）
```bash
docker-compose up -d
```

### Node.js 直接运行
```bash
npm install
npx prisma db push
npm run build
npm start
```

## 更新日志

| 日期 | 内容 |
|------|------|
| 2026-04-17 | 项目创建，编写 PLAN.md，创建基础文件 |
