# GitFileDock

> 轻量级 Git 文件服务器。通过 Web 界面管理多个 Git 仓库，浏览、预览、编辑、上传、下载文件，支持代码高亮与匿名访问。所有变更自动提交推送，提供类似 GitHub Raw 的文件直链能力。支持 GitHub / Gitea / Gitee 平台 Webhook 自动同步与定时拉取。

## 功能特性

- **多仓库管理** — 通过 Web 界面配置多个 Git 仓库，一键切换
- **文件浏览** — 面包屑导航，列表/网格视图，搜索排序
- **文件预览** — 代码语法高亮（Shiki）、Markdown 渲染、图片/PDF 预览
- **在线编辑** — CodeMirror 6 编辑器，支持语法高亮、行号、Tab 缩进
- **文件操作** — 新建、删除、重命名、上传、下载，所有变更自动 Git 提交推送
- **文件直链** — 类似 GitHub Raw 的文件直链，支持 wget/curl 直接下载
- **匿名访问** — 无需登录即可浏览公开文件，隐藏文件仍可通过直链访问
- **Git 同步** — 手动同步 + 定时拉取 + Webhook 自动同步
- **多平台 Webhook** — 支持 GitHub / Gitea / Gitee
- **暗色主题** — 开发者友好的深色界面
- **Docker 部署** — 开箱即用的 Docker 和 Docker Compose 配置

## 快速开始

### Docker（推荐）

```bash
git clone git@github.com:astralwaveorg/GitFileHub.git
cd GitFileHub

# 配置环境变量
cp .env.example .env

# 启动
docker-compose up -d
```

访问 `http://your-server:3000`，默认账号 `admin` / `admin123`（首次登录后请修改密码）。

### Node.js

```bash
git clone git@github.com:astralwaveorg/GitFileHub.git
cd GitFileHub

npm install
npx prisma db push
npm run build
npm start
```

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `BASE_URL` | 基础 URL（用于生成直链） | `http://localhost:3000` |
| `JWT_SECRET` | JWT 签名密钥 | 自动生成 |
| `ENCRYPTION_KEY` | SSH 密钥加密密钥 | 自动生成 |
| `GIT_USER_NAME` | Git 提交用户名 | `GitFileDock` |
| `GIT_USER_EMAIL` | Git 提交邮箱 | `gitfiledock@local` |

### 添加仓库

1. 登录管理后台（默认 `admin` / `admin123`）
2. 进入 **设置 → 仓库管理**
3. 先在 **SSH 密钥管理** 中添加你 Git 平台的 SSH 私钥
4. 点击 **添加仓库**，填写仓库信息和远程地址
5. 系统会自动 clone 仓库到本地

### Webhook 配置

1. 在仓库设置中复制 Webhook URL
2. 到你的 Git 平台（GitHub / Gitea / Gitee）仓库设置中添加 Webhook
3. 将 Webhook URL 粘贴到对应位置
4. 选择 push 事件触发

## 技术栈

- [Next.js 16](https://nextjs.org/) — React 全栈框架
- [TypeScript](https://www.typescriptlang.org/) — 类型安全
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — UI 组件
- [Prisma](https://www.prisma.io/) + SQLite — 数据库
- [Shiki](https://shiki.matsu.io/) — 代码语法高亮
- [CodeMirror 6](https://codemirror.net/) — 代码编辑器
- [node-cron](https://www.npmjs.com/package/node-cron) — 定时任务

## License

[MIT](LICENSE)
