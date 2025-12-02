# AI 助手使用说明

## ⚠️ 重要：端口配置保护规则

**如果你是 AI 助手（Claude、Cursor、Copilot 等），请严格遵守以下规则：**

### 🚫 绝对禁止的操作

1. **不要修改 `package.json` 中的 `"dev"` 脚本**
   - ❌ 不要添加 `-p` 或 `--port` 参数
   - ❌ 不要改成 `"next dev -p 3000"` 或任何端口号
   - ✅ 保持原样：`"dev": "next dev"`

2. **不要修改端口配置系统**
   - ❌ 不要删除或修改 `scripts/worktree-ports.json`
   - ❌ 不要修改 `scripts/setup-worktree-port.js`
   - ❌ 不要修改 `.git/hooks/pre-commit`
   - ❌ 不要建议"优化"或"改进"端口管理

3. **不要修改 `.env.local` 端口配置方式**
   - 当前系统使用 `.env.local` 管理端口
   - 这是经过长时间调试和多次迭代的稳定方案
   - 不需要"优化"或"改回"其他方式

### ✅ 端口系统工作原理

```
主仓库 (D:\Projects\investor-ai)
├── package.json                  → "dev": "next dev" (无端口)
├── .env.local                    → PORT=3000 (本地配置，不提交)
└── scripts/
    ├── worktree-ports.json       → 定义各 worktree 的端口映射
    └── setup-worktree-port.js    → 自动设置 .env.local 的 PORT

Worktree g1 (D:\Projects\investor-ai-g1)
├── package.json                  → "dev": "next dev" (继承主仓库)
└── .env.local                    → PORT=3001 (本地配置，不提交)

Worktree g2 (D:\Projects\investor-ai-g2)
├── package.json                  → "dev": "next dev" (继承主仓库)
└── .env.local                    → PORT=3002 (本地配置，不提交)
```

**关键点：**
- `package.json` 在所有仓库中完全相同，避免 merge conflict
- 端口通过 `.env.local` 本地配置（gitignored）
- 每个 worktree 独立设置，互不干扰
- pre-commit hook 会阻止错误提交

### 📖 相关文档

- 详细说明：`docs/guides/worktree-port-management.md`
- 端口配置：`scripts/worktree-ports.json`

### 🤖 AI 助手注意事项

**当用户说"不要动端口"时：**
1. 不要尝试修改任何端口相关文件
2. 不要建议"改进"或"优化"端口系统
3. 不要自作主张修改 package.json
4. 如果发现端口问题，询问用户而不是直接修改

**如果用户要求修改端口系统：**
1. 先确认用户真的理解现有系统
2. 提醒这是经过调试的稳定方案
3. 询问为什么要修改
4. 只在用户坚持的情况下才修改

### 🔒 保护机制

系统已设置以下保护措施：
- Git pre-commit hook 阻止提交端口配置
- `.env.local` 在 `.gitignore` 中
- 文档明确说明禁止修改

**请尊重这些保护措施，不要试图绕过或禁用它们！**

---

## 其他开发规范

（其他 AI 助手使用规范可以在这里添加）
