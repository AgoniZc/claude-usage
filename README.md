# claude-usage

Claude Code 每日使用统计 — **Agent Skill + CLI 工具**。

解析本地 `~/.claude/projects/` 会话 JSONL，汇总 token 用量、代码增删行数、交互次数、修改文件数。可安装到 Claude Code、Codex、Cursor、Hermes 等支持 Agent Skills 的平台，由 Agent 自动调用；也可单独当 CLI 使用。

## 特性

- 零 npm 依赖，仅需 Node.js >= 18
- 流式解析 JSONL，内存友好
- Token 按 `message.id` 去重
- 表格 / JSON 两种输出
- 支持按模型细分 token

## 作为 Agent Skill 安装（推荐）

### 一行安装

**macOS / Linux / Git Bash：**

```bash
curl -fsSL https://raw.githubusercontent.com/AgoniZc/claude-usage/main/install.sh | bash
```

**Windows PowerShell：**

```powershell
irm https://raw.githubusercontent.com/AgoniZc/claude-usage/main/install.ps1 | iex
```

### 从源码安装

```bash
git clone https://github.com/AgoniZc/claude-usage.git
cd claude-usage
./install.sh --all --local
```

Windows：

```powershell
git clone https://github.com/AgoniZc/claude-usage.git
cd claude-usage
.\install.ps1 -All -Local
```

### 安装目标

| 平台 | Skill 路径 |
|------|------------|
| Claude Code | `~/.claude/skills/claude-usage/` |
| Codex CLI | `~/.codex/skills/claude-usage/` |
| Cursor | `~/.cursor/skills/claude-usage/` |
| 其他 Agent | `./install.sh --dir ~/.hermes/skills` 等 |

安装完成后**重启 Agent 或新开 session**。之后可直接说：

- 「今天 Claude Code 用了多少 token？」
- 「看下最近 7 天使用统计」
- 「昨天改了多少行代码？」

Agent 会匹配 `SKILL.md` 中的 trigger，运行 `node bin/cli.js` 并整理结果。

### 安装选项

```bash
./install.sh --claude          # 仅 Claude Code
./install.sh --codex           # 仅 Codex
./install.sh --cursor          # 仅 Cursor
./install.sh --all             # 三者都装（默认）
./install.sh --dir ~/.hermes/skills   # 自定义 Agent
./install.sh --repo https://github.com/AgoniZc/claude-usage.git
```

## 作为 CLI 直接使用

不装 Skill 也可以手动运行：

```bash
node bin/cli.js --today
node bin/cli.js --last 30 --by-model
node bin/cli.js --format json --yesterday
```

可选：全局 alias（在 shell 配置里）：

```bash
alias claude-usage="node /path/to/claude-usage/bin/cli.js"
```

## 使用方法

```bash
# 最近 7 天（默认）
node bin/cli.js

# 今日 / 昨日
node bin/cli.js --today
node bin/cli.js --yesterday

# 最近 N 天
node bin/cli.js --last 30

# 指定日期 / 范围
node bin/cli.js --date 2026-06-03
node bin/cli.js --from 2026-06-01 --to 2026-06-03

# JSON 输出 / 按模型
node bin/cli.js --today --format json
node bin/cli.js --today --by-model

node bin/cli.js --help
```

## 输出示例

```
日期       输入Token  输出Token 缓存读取    缓存创建 增/删行       文件数 对话数
─────────────────────────────────────────────────────────────────────────────────
2026-06-02  3,362,809   508,398 89,299,738        0 +29410/-4745    173     89
2026-06-03  2,775,907   467,749 72,821,632        0 +13787/-1914    144    120
─────────────────────────────────────────────────────────────────────────────────
合计       13,268,291 1,618,411 261,147,358        0 +58778/-11389    399    382
```

## 统计指标

| 指标 | 说明 |
|------|------|
| 输入Token | 每日发送给模型的 token 总量 |
| 输出Token | 模型生成的 token 总量 |
| 缓存读取 | Prompt Cache 命中的 token 数 |
| 缓存创建 | 写入 Prompt Cache 的 token 数 |
| 增/删行 | 通过 Edit/Write 工具新增和删除的代码行数 |
| 文件数 | 被修改的唯一文件数 |
| 对话数 | 用户交互次数 |

## Contributing

欢迎提交 Issue 和 Pull Request。从源码安装见上文「从源码安装」一节。

## 技术细节

- **数据来源**：`~/.claude/projects/` 下的 JSONL 会话文件
- **零依赖**：仅使用 Node.js 内置模块
- **流式解析**：逐行读取，内存友好
- **Token 去重**：同一 API 响应按 `message.id` 去重
- **Node.js >= 18**

## 目录结构

```
claude-usage/
├── SKILL.md          # Agent Skill 定义（discovery + 工作流）
├── README.md
├── install.sh        # macOS/Linux 安装脚本
├── install.ps1       # Windows 安装脚本
├── package.json
├── bin/cli.js
└── src/
    ├── scanner.js
    ├── parser.js
    ├── aggregator.js
    ├── formatter.js
    └── utils.js
```

## License

MIT
