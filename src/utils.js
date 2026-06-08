/**
 * 辅助函数：日期解析、行数计算、数字格式化
 */

/**
 * 计算字符串中的行数
 * 空字符串返回 0，否则按换行符分割后计数
 */
export function countLines(str) {
  if (!str || str === '') return 0
  return str.split('\n').length
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(n) {
  return n.toLocaleString('en-US')
}

/**
 * 从 ISO 8601 时间戳提取日期部分 (YYYY-MM-DD)
 */
export function toDate(timestamp) {
  if (!timestamp) return null
  return timestamp.slice(0, 10)
}

/**
 * 获取今天的日期字符串 (UTC)
 */
export function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * 获取昨天的日期字符串 (UTC)
 */
export function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * 获取 N 天前的日期字符串
 */
export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/**
 * 生成从 start 到 end（含）的所有日期字符串
 */
export function dateRange(start, end) {
  const dates = []
  const current = new Date(start + 'T00:00:00Z')
  const endDate = new Date(end + 'T00:00:00Z')
  while (current <= endDate) {
    dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

/**
 * 解析 CLI 参数为日期过滤器
 * 返回 { from, to } 或 null（不过滤）
 */
export function parseDateArgs(args) {
  const todayStr = today()
  const yesterdayStr = yesterday()

  if (args.help) return null

  if (args.today) {
    return { from: todayStr, to: todayStr }
  }

  if (args.yesterday) {
    return { from: yesterdayStr, to: yesterdayStr }
  }

  if (args.date) {
    return { from: args.date, to: args.date }
  }

  if (args.from && args.to) {
    return { from: args.from, to: args.to }
  }

  if (args.from) {
    return { from: args.from, to: todayStr }
  }

  if (args.to) {
    return { from: '2020-01-01', to: args.to }
  }

  // --last N（默认 7 天）
  const last = args.last ?? 7
  return { from: daysAgo(last - 1), to: todayStr }
}

/**
 * 检查日期是否在过滤范围内
 */
export function isDateInRange(date, filter) {
  if (!filter) return true
  return date >= filter.from && date <= filter.to
}

/**
 * 简易 CLI 参数解析器
 * 支持 --flag, --flag value, --flag=N
 */
export function parseArgs(argv) {
  const args = {}
  let i = 2 // 跳过 node 和脚本路径
  while (i < argv.length) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      args.help = true
      i++
    } else if (arg === '--today') {
      args.today = true
      i++
    } else if (arg === '--yesterday') {
      args.yesterday = true
      i++
    } else if (arg === '--by-model') {
      args.byModel = true
      i++
    } else if (arg === '--format') {
      args.format = argv[i + 1]
      i += 2
    } else if (arg.startsWith('--format=')) {
      args.format = arg.slice('--format='.length)
      i++
    } else if (arg === '--date') {
      args.date = argv[i + 1]
      i += 2
    } else if (arg.startsWith('--date=')) {
      args.date = arg.slice('--date='.length)
      i++
    } else if (arg === '--from') {
      args.from = argv[i + 1]
      i += 2
    } else if (arg.startsWith('--from=')) {
      args.from = arg.slice('--from='.length)
      i++
    } else if (arg === '--to') {
      args.to = argv[i + 1]
      i += 2
    } else if (arg.startsWith('--to=')) {
      args.to = arg.slice('--to='.length)
      i++
    } else if (arg === '--last') {
      args.last = parseInt(argv[i + 1], 10)
      i += 2
    } else if (arg.startsWith('--last=')) {
      args.last = parseInt(arg.slice('--last='.length), 10)
      i++
    } else {
      i++
    }
  }
  return args
}

/**
 * 打印帮助信息
 */
export function printHelp() {
  console.log(`
claude-usage — Claude Code 每日使用统计

用法:
  claude-usage [选项]

选项:
  --today             查看今日统计
  --yesterday         查看昨日统计
  --date YYYY-MM-DD   查看指定日期统计
  --last N            查看最近 N 天统计（默认 7）
  --from YYYY-MM-DD   起始日期（配合 --to 使用）
  --to YYYY-MM-DD     结束日期（配合 --from 使用）
  --format table|json 输出格式（默认 table）
  --by-model          按模型细分 token 用量
  -h, --help          显示帮助信息

示例:
  claude-usage --today
  claude-usage --last 30
  claude-usage --from 2026-05-01 --to 2026-05-31
  claude-usage --last 7 --format json
  claude-usage --yesterday --by-model
`.trim())
}
