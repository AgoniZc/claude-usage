#!/usr/bin/env node

/**
 * claude-usage — Claude Code 每日使用统计
 *
 * 解析 ~/.claude/projects/ 下的会话 JSONL 文件，
 * 汇总每日 token 用量、代码增删行数、交互次数、修改文件数。
 */

import { scanFiles } from '../src/scanner.js'
import { parseFile } from '../src/parser.js'
import { Aggregator } from '../src/aggregator.js'
import { formatTable, formatJSON } from '../src/formatter.js'
import { parseArgs, parseDateArgs, printHelp } from '../src/utils.js'

async function main() {
  const args = parseArgs(process.argv)

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const dateFilter = parseDateArgs(args)
  const format = args.format || 'table'

  // 1. 扫描所有 JSONL 文件
  const files = await scanFiles()

  if (files.length === 0) {
    console.log('未找到 Claude 会话数据。请确认 ~/.claude/projects/ 目录存在。')
    process.exit(0)
  }

  // 2. 创建聚合器并处理每个文件
  const aggregator = new Aggregator()

  for (const file of files) {
    for await (const record of parseFile(file)) {
      aggregator.ingest(record)
    }
  }

  // 3. 获取结果
  const results = aggregator.getResults(dateFilter)

  // 4. 格式化输出
  if (format === 'json') {
    console.log(formatJSON(results))
  } else {
    console.log(formatTable(results, { byModel: args.byModel }))
  }
}

main().catch((err) => {
  console.error('错误:', err.message)
  process.exit(1)
})
