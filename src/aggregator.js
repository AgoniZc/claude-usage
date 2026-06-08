/**
 * 数据聚合器：按日期聚合统计，处理 token 去重、行数计算、文件去重
 */

import { toDate, countLines } from './utils.js'

/**
 * 创建一天的空统计数据结构
 */
function createDayStats(date) {
  return {
    date,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    interactions: 0,
    linesAdded: 0,
    linesDeleted: 0,
    filesModified: new Set(),
    byModel: new Map(), // model -> { inputTokens, outputTokens }
  }
}

export class Aggregator {
  constructor() {
    /** @type {Map<string, ReturnType<typeof createDayStats>>} */
    this.days = new Map()
    /** @type {Map<string, Set<string>>} date -> Set<messageId>，用于 token 去重 */
    this.seenMessageIds = new Map()
  }

  /**
   * 获取或创建指定日期的统计数据
   */
  getOrCreateDay(date) {
    if (!this.days.has(date)) {
      this.days.set(date, createDayStats(date))
    }
    return this.days.get(date)
  }

  /**
   * 检查 messageId 是否已处理过（去重）
   */
  isMessageSeen(date, messageId) {
    if (!this.seenMessageIds.has(date)) {
      this.seenMessageIds.set(date, new Set())
    }
    const seen = this.seenMessageIds.get(date)
    if (seen.has(messageId)) {
      return true
    }
    seen.add(messageId)
    return false
  }

  /**
   * 摄入一条解析后的记录
   */
  ingest(record) {
    const date = toDate(record.timestamp)
    if (!date) return

    const day = this.getOrCreateDay(date)

    if (record.kind === 'assistant') {
      // Token 去重：同一个 messageId 只计一次
      if (record.messageId && !this.isMessageSeen(date, record.messageId) && record.usage) {
        day.inputTokens += record.usage.inputTokens
        day.outputTokens += record.usage.outputTokens
        day.cacheReadTokens += record.usage.cacheReadTokens
        day.cacheCreationTokens += record.usage.cacheCreationTokens

        // 按模型细分
        if (record.model) {
          if (!day.byModel.has(record.model)) {
            day.byModel.set(record.model, { inputTokens: 0, outputTokens: 0 })
          }
          const modelStats = day.byModel.get(record.model)
          modelStats.inputTokens += record.usage.inputTokens
          modelStats.outputTokens += record.usage.outputTokens
        }
      }

      // 处理 Edit/Write 工具调用（不需要去重，因为一个 response 中每个 tool_use 只出现一次）
      for (const toolUse of record.toolUses) {
        if (toolUse.name === 'Edit') {
          const { file_path, old_string, new_string } = toolUse.input
          if (file_path) {
            day.filesModified.add(file_path)
            day.linesDeleted += countLines(old_string)
            day.linesAdded += countLines(new_string)
          }
        } else if (toolUse.name === 'Write') {
          const { file_path, content } = toolUse.input
          if (file_path) {
            day.filesModified.add(file_path)
            day.linesAdded += countLines(content)
          }
        }
      }
    } else if (record.kind === 'user' && record.isHuman) {
      day.interactions++
    }
  }

  /**
   * 获取聚合结果
   * @param {{ from: string, to: string } | null} dateFilter
   */
  getResults(dateFilter) {
    // 收集并排序日期
    const sortedDates = [...this.days.keys()].sort()

    // 按日期范围过滤
    const filteredDates = sortedDates.filter((date) => {
      if (!dateFilter) return true
      return date >= dateFilter.from && date <= dateFilter.to
    })

    // 构建结果
    const days = filteredDates.map((date) => {
      const stats = this.days.get(date)
      return {
        date: stats.date,
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
        cacheReadTokens: stats.cacheReadTokens,
        cacheCreationTokens: stats.cacheCreationTokens,
        interactions: stats.interactions,
        linesAdded: stats.linesAdded,
        linesDeleted: stats.linesDeleted,
        filesModified: stats.filesModified.size,
        byModel: Object.fromEntries(stats.byModel),
      }
    })

    // 计算汇总
    const totals = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      interactions: 0,
      linesAdded: 0,
      linesDeleted: 0,
      filesModified: 0,
      byModel: {},
    }

    // 汇总时需要对文件路径全局去重
    const allFiles = new Set()

    for (const day of days) {
      totals.inputTokens += day.inputTokens
      totals.outputTokens += day.outputTokens
      totals.cacheReadTokens += day.cacheReadTokens
      totals.cacheCreationTokens += day.cacheCreationTokens
      totals.interactions += day.interactions
      totals.linesAdded += day.linesAdded
      totals.linesDeleted += day.linesDeleted

      // 文件去重：需要从原始数据中获取
      const origDay = this.days.get(day.date)
      for (const f of origDay.filesModified) {
        allFiles.add(f)
      }

      // 合并 byModel
      for (const [model, modelStats] of Object.entries(day.byModel)) {
        if (!totals.byModel[model]) {
          totals.byModel[model] = { inputTokens: 0, outputTokens: 0 }
        }
        totals.byModel[model].inputTokens += modelStats.inputTokens
        totals.byModel[model].outputTokens += modelStats.outputTokens
      }
    }

    totals.filesModified = allFiles.size

    return { days, totals }
  }
}
