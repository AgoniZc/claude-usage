/**
 * 流式 JSONL 解析器：逐行读取会话文件，提取关键字段
 */

import { createReadStream } from 'fs'
import { createInterface } from 'readline'

/**
 * 解析单个 JSONL 文件，yield 结构化记录
 * @param {string} filePath - JSONL 文件路径
 * @yields {{ kind: 'assistant', messageId, timestamp, model, usage, toolUses }}
 * @yields {{ kind: 'user', timestamp, isHuman }}
 */
export async function* parseFile(filePath) {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (!line || line.length === 0) continue

    let obj
    try {
      obj = JSON.parse(line)
    } catch {
      continue // 跳过无法解析的行
    }

    const type = obj.type

    if (type === 'assistant' && obj.message) {
      const msg = obj.message
      const usage = msg.usage
      const content = msg.content

      // 提取 Edit/Write 工具调用
      const toolUses = []
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'tool_use' && (block.name === 'Edit' || block.name === 'Write')) {
            toolUses.push({
              name: block.name,
              input: block.input || {},
            })
          }
        }
      }

      yield {
        kind: 'assistant',
        messageId: msg.id,
        timestamp: obj.timestamp,
        model: msg.model,
        usage: usage
          ? {
              inputTokens: usage.input_tokens ?? 0,
              outputTokens: usage.output_tokens ?? 0,
              cacheReadTokens: usage.cache_read_input_tokens ?? 0,
              cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
            }
          : null,
        toolUses,
      }
    } else if (type === 'user' && obj.message) {
      const msg = obj.message
      const content = msg.content

      // 判断是否为人类输入：content 为字符串（非 tool_result 数组）
      const isHuman = typeof content === 'string'

      yield {
        kind: 'user',
        timestamp: obj.timestamp,
        isHuman,
      }
    }
  }
}
