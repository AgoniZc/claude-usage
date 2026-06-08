/**
 * 文件扫描器：递归扫描 ~/.claude/projects/ 下所有 JSONL 文件
 */

import { readdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const CLAUDE_DIR = join(homedir(), '.claude')
const PROJECTS_DIR = join(CLAUDE_DIR, 'projects')

/**
 * 递归扫描目录，收集所有 .jsonl 文件路径
 */
export async function scanFiles() {
  const files = []

  async function walk(dir) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return // 目录不存在或无权限，跳过
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name.endsWith('.jsonl')) {
        files.push(fullPath)
      }
    }
  }

  await walk(PROJECTS_DIR)
  return files
}
