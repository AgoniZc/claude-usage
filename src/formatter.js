/**
 * 输出格式化：表格和 JSON 两种格式
 */

import { formatNumber } from './utils.js'

/**
 * 将数字格式化为简写形式（如 1.2K, 3.5M）
 */
function shortNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

/**
 * 格式化增删行数
 */
function formatLines(added, deleted) {
  return `+${added}/-${deleted}`
}

/**
 * 计算字符串的中文显示宽度（考虑 CJK 字符占 2 列）
 */
function displayWidth(str) {
  let width = 0
  for (const ch of str) {
    const code = ch.codePointAt(0)
    if (
      (code >= 0x3000 && code <= 0x9fff) || // CJK 统一汉字
      (code >= 0xff00 && code <= 0xffef) || // 全角字符
      (code >= 0xf900 && code <= 0xfaff)    // CJK 兼容汉字
    ) {
      width += 2
    } else {
      width += 1
    }
  }
  return width
}

/**
 * 左填充字符串到指定显示宽度
 */
function padRight(str, width) {
  return str + ' '.repeat(Math.max(0, width - displayWidth(str)))
}

/**
 * 右填充字符串到指定显示宽度（数字右对齐）
 */
function padLeft(str, width) {
  return ' '.repeat(Math.max(0, width - displayWidth(str))) + str
}

/**
 * 表格格式输出
 */
export function formatTable(results, options = {}) {
  const { days, totals } = results
  const { byModel = false } = options

  if (days.length === 0) {
    return '没有找到匹配的使用数据。'
  }

  // 表头
  const headers = ['日期', '输入Token', '输出Token', '缓存读取', '缓存创建', '增/删行', '文件数', '对话数']
  let colWidths = headers.map((h) => displayWidth(h))

  // 计算每列最大宽度
  for (const day of days) {
    const row = dayToRow(day, byModel)
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i], displayWidth(row[i]))
    }
  }

  // 汇总行
  const totalsRow = totalsToRow(totals, byModel)
  for (let i = 0; i < totalsRow.length; i++) {
    colWidths[i] = Math.max(colWidths[i], displayWidth(totalsRow[i]))
  }

  // 额外加 1 个空格间距
  colWidths = colWidths.map((w) => w + 1)

  // 构建表格
  const lines = []

  // 表头
  const headerLine = headers.map((h, i) => padRight(h, colWidths[i])).join('')
  lines.push(headerLine)

  // 分隔线
  const sepLine = colWidths.map((w) => '─'.repeat(w)).join('')
  lines.push(sepLine)

  // 数据行
  for (const day of days) {
    const row = dayToRow(day, byModel)
    const line = row.map((cell, i) => {
      // 第一列左对齐（日期），其余右对齐
      return i === 0 ? padRight(cell, colWidths[i]) : padLeft(cell, colWidths[i])
    }).join('')
    lines.push(line)
  }

  // 汇总分隔线
  lines.push(sepLine)

  // 汇总行
  const tLine = totalsRow.map((cell, i) => {
    return i === 0 ? padRight(cell, colWidths[i]) : padLeft(cell, colWidths[i])
  }).join('')
  lines.push(tLine)

  // 如果需要按模型细分，追加模型详情
  if (byModel && totals.byModel && Object.keys(totals.byModel).length > 0) {
    lines.push('')
    lines.push('按模型细分:')
    for (const [model, stats] of Object.entries(totals.byModel)) {
      lines.push(`  ${model}: 输入 ${formatNumber(stats.inputTokens)}, 输出 ${formatNumber(stats.outputTokens)}`)
    }
  }

  return lines.join('\n')
}

function dayToRow(day, byModel) {
  return [
    day.date,
    formatNumber(day.inputTokens),
    formatNumber(day.outputTokens),
    formatNumber(day.cacheReadTokens),
    formatNumber(day.cacheCreationTokens),
    formatLines(day.linesAdded, day.linesDeleted),
    String(day.filesModified),
    String(day.interactions),
  ]
}

function totalsToRow(totals, byModel) {
  return [
    '合计',
    formatNumber(totals.inputTokens),
    formatNumber(totals.outputTokens),
    formatNumber(totals.cacheReadTokens),
    formatNumber(totals.cacheCreationTokens),
    formatLines(totals.linesAdded, totals.linesDeleted),
    String(totals.filesModified),
    String(totals.interactions),
  ]
}

/**
 * JSON 格式输出
 */
export function formatJSON(results) {
  return JSON.stringify(results, null, 2)
}
