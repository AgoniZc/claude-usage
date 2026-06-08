---
name: claude-usage
description: >
  Claude Code 每日使用统计 Skill。解析本地 ~/.claude/projects/ 会话 JSONL，
  汇总 token 用量（输入/输出/缓存）、代码增删行数、交互次数、修改文件数。
  当用户问 Claude Code 用量、token 统计、今天/昨天用了多少、代码改了多少行、
  使用报告、usage stats、daily usage、Claude 用了多少 token 时使用。
  仅用于 Claude Code，需要 Node.js >= 18，零 npm 依赖。
---

# Claude Usage Skill

Claude Code 专用 Skill：读取本机 Claude Code 会话日志，输出每日使用统计。数据来自 `~/.claude/projects/` 下的 JSONL 文件，不上传任何内容。

## 先决条件

- **Node.js >= 18**（仅使用内置模块，无需 `npm install`）
- 本机已用 **Claude Code** 产生过会话（存在 `~/.claude/projects/`）

检查 Node：

```bash
node --version
```

## 执行方式

**始终从 skill 根目录运行**（安装后路径：`~/.claude/skills/claude-usage`）：

```bash
node bin/cli.js [选项]
```

Windows PowerShell 同理：`node bin/cli.js --today`

## 用户意图 → 命令映射

| 用户在说 | 运行 |
|---|---|
| 今天用了多少 / 今日统计 | `node bin/cli.js --today` |
| 昨天 / 昨日 | `node bin/cli.js --yesterday` |
| 最近一周（默认） | `node bin/cli.js` 或 `node bin/cli.js --last 7` |
| 最近 N 天 | `node bin/cli.js --last N` |
| 某一天 | `node bin/cli.js --date YYYY-MM-DD` |
| 日期范围 | `node bin/cli.js --from YYYY-MM-DD --to YYYY-MM-DD` |
| 按模型拆分 token | 在上述命令后加 `--by-model` |
| 需要结构化数据（图表/二次处理） | 加 `--format json` |

## 输出指标

| 列名 | 含义 |
|---|---|
| 输入Token | 发送给模型的 token |
| 输出Token | 模型生成的 token |
| 缓存读取 | Prompt Cache 命中 |
| 缓存创建 | 写入 Prompt Cache |
| 增/删行 | Edit/Write 工具新增/删除的代码行 |
| 文件数 | 被修改的唯一文件数 |
| 对话数 | 用户交互次数 |

## 工作流

1. **确认环境**：`node --version`；若 `< 18` 则告知用户升级 Node。
2. **定位 skill 目录**：当前 skill 安装路径下的 `bin/cli.js`。
3. **按用户意图选参数**，运行 CLI，捕获 stdout。
4. **呈现结果**：
   - 默认 table 输出可直接贴给用户；
   - 若 `--format json`，解析后做摘要或可视化，并保留原始 JSON 供参考。
5. **空数据**：若输出「未找到 Claude 会话数据」，说明 `~/.claude/projects/` 不存在或为空——用户可能未安装 Claude Code 或尚无会话。

## 示例

**今日统计：**

```bash
node bin/cli.js --today
```

**最近 30 天 + 按模型：**

```bash
node bin/cli.js --last 30 --by-model
```

**JSON 供后续分析：**

```bash
node bin/cli.js --today --format json
```

## 回答风格

- 用中文回复（除非用户全程用英文）。
- 先给**结论摘要**（今日 token、对话数、代码变更），再附 CLI 表格。
- 用户问「是不是用太多了」时，结合 `--by-model` 或多日 `--last` 给趋势，不要臆造数据。

## 安装

见仓库 [README.md](README.md)。一行安装（bash）：

```bash
curl -fsSL https://raw.githubusercontent.com/AgoniZc/claude-usage/main/install.sh | bash
```

安装后重启 Claude Code 或新开 session，skill 即可被 discovery 匹配。
