/**
 * HTML 拆分引擎（对齐 html temple flip）
 * 
 * 按顶层节点序拆分为四类模块：gap/image/table/text
 * 顶层连续 <br> 合并为一个"间隔模块"；顶层 <p><br></p> 独立为间隔模块
 */

import { sanitizeHtml } from './htmlSanitizer'

export type ModuleKind = 'gap' | 'image' | 'table' | 'text'

export interface HtmlModule {
  id: string
  kind: ModuleKind
  html: string          // 净化后的模块 HTML
  rawFragment: string   // 原始片段（内部用）
}

export interface SplitOptions {
  treatTopTableAsAtomic?: boolean          // 默认 true：顶层 table 为原子模块
  mergeConsecutiveBrAsOneGap?: boolean     // 默认 true：连续 br 合并为一个间隔模块
}

/**
 * 拆分整页 HTML 为模块列表
 */
export function splitHtmlToModules(pageHtml: string, options?: SplitOptions): HtmlModule[] {
  const opts: Required<SplitOptions> = {
    treatTopTableAsAtomic: options?.treatTopTableAsAtomic ?? true,
    mergeConsecutiveBrAsOneGap: options?.mergeConsecutiveBrAsOneGap ?? true
  }

  // 解析 HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(pageHtml, 'text/html')
  const root = doc.body

  const modules: HtmlModule[] = []
  const topNodes = Array.from(root.childNodes)

  let i = 0
  while (i < topNodes.length) {
    const node = topNodes[i]

    // 1. 文本节点（空白忽略；非空作为文本模块起点）
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text.trim()) {
        // 收集连续文本/内联节点为一个文本模块
        const collected = collectTextModule(topNodes, i)
        modules.push(createModule(collected.nodes, 'text'))
        i = collected.nextIndex
      } else {
        i++
      }
      continue
    }

    // 2. 元素节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tagName = el.tagName.toLowerCase()

      // 2.1 顶层 <br> / <br />
      if (tagName === 'br') {
        if (opts.mergeConsecutiveBrAsOneGap) {
          // 收集连续 br
          const collected = collectConsecutiveBr(topNodes, i)
          modules.push(createModule(collected.nodes, 'gap'))
          i = collected.nextIndex
        } else {
          modules.push(createModule([node], 'gap'))
          i++
        }
        continue
      }

      // 2.2 顶层 <p><br></p> 或 <p><br /></p>
      if (tagName === 'p' && isParagraphWithOnlyBr(el)) {
        modules.push(createModule([node], 'gap'))
        i++
        continue
      }

      // 2.3 顶层 <img> 或 <a><img></a>（带链接的图片）
      if (tagName === 'img') {
        modules.push(createModule([node], 'image'))
        i++
        continue
      }
      
      // 2.3.1 顶层 <a> 且仅包含 <img>（带链接的图片）
      if (tagName === 'a' && isLinkWithOnlyImage(el)) {
        modules.push(createModule([node], 'image'))
        i++
        continue
      }

      // 2.4 顶层 <table>
      if (tagName === 'table' && opts.treatTopTableAsAtomic) {
        modules.push(createModule([node], 'table'))
        i++
        continue
      }

      // 2.5 其他块级/内联：作为文本模块起点
      const collected = collectTextModule(topNodes, i)
      modules.push(createModule(collected.nodes, 'text'))
      i = collected.nextIndex
      continue
    }

    // 其他节点类型（注释等）跳过
    i++
  }

  return modules
}

/**
 * 收集连续的顶层 <br> 节点
 */
function collectConsecutiveBr(
  nodes: Node[],
  startIndex: number
): { nodes: Node[]; nextIndex: number } {
  const collected: Node[] = []
  let i = startIndex

  while (i < nodes.length) {
    const node = nodes[i]
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      if (el.tagName.toLowerCase() === 'br') {
        collected.push(node)
        i++
        continue
      }
    }
    break
  }

  return { nodes: collected, nextIndex: i }
}

/**
 * 收集连续的文本/内联节点为一个文本模块
 * （遇到 table/img/顶层br/顶层p-br/顶层p 时停止）
 * 
 * 规则：
 * 1. 每个顶层 <p> 标签（非 <p><br></p>）都是独立的文本模块
 * 2. 连续的非 <p> 内联元素可以合并为一个文本模块
 */
function collectTextModule(
  nodes: Node[],
  startIndex: number
): { nodes: Node[]; nextIndex: number } {
  const collected: Node[] = []
  let i = startIndex

  while (i < nodes.length) {
    const node = nodes[i]

    // 文本节点：收集
    if (node.nodeType === Node.TEXT_NODE) {
      collected.push(node)
      i++
      continue
    }

    // 元素节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tagName = el.tagName.toLowerCase()

      // 遇到顶层 table/img：停止
      if (tagName === 'table' || tagName === 'img') {
        break
      }

      // 遇到顶层 br：停止（作为独立间隔模块）
      if (tagName === 'br') {
        break
      }

      // 遇到顶层 <p><br></p>：停止
      if (tagName === 'p' && isParagraphWithOnlyBr(el)) {
        break
      }

      // 遇到顶层 <p>（非空 br）：
      // - 如果已经收集了节点，停止（让当前 <p> 成为下一个模块）
      // - 如果还没收集节点，收集这一个 <p> 后立即停止
      if (tagName === 'p') {
        if (collected.length > 0) {
          // 已经有内容了，停止，让这个 <p> 成为下一个模块
          break
        } else {
          // 收集这个 <p> 作为独立模块
          collected.push(node)
          i++
          break // 立即停止，确保每个 <p> 独立
        }
      }

      // 其他元素：收集
      collected.push(node)
      i++
      continue
    }

    // 其他节点：收集
    collected.push(node)
    i++
  }

  return { nodes: collected, nextIndex: i }
}

/**
 * 判断 <a> 是否仅包含 <img>（及空白）
 * 用于识别带链接的图片：<a href="..."><img src="..."></a>
 */
function isLinkWithOnlyImage(el: Element): boolean {
  const children = Array.from(el.childNodes)
  let hasImage = false
  
  for (const child of children) {
    // 跳过空白文本节点
    if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent?.trim()) {
        return false // 有非空白文本，不是纯图片链接
      }
      continue
    }
    
    // 检查是否为 img 元素
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as Element
      if (childEl.tagName.toLowerCase() === 'img') {
        hasImage = true
      } else {
        return false // 有其他元素，不是纯图片链接
      }
    }
  }
  
  return hasImage
}

/**
 * 判断 <p> 是否仅包含 <br>（及空白）
 */
function isParagraphWithOnlyBr(el: Element): boolean {
  const children = Array.from(el.childNodes)
  let foundBr = false

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as Element
      if (childEl.tagName.toLowerCase() === 'br') {
        foundBr = true
      } else {
        return false // 有其他元素
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ''
      if (text.trim()) {
        return false // 有非空文本
      }
    }
  }

  return foundBr
}

/**
 * 创建模块对象
 */
function createModule(nodes: Node[], kind: ModuleKind): HtmlModule {
  // 序列化节点为 HTML 片段
  // 注意：需要先保护全角空格，因为 innerHTML 会将其转换为半角空格
  const temp = document.createElement('div')
  for (const node of nodes) {
    temp.appendChild(node.cloneNode(true))
  }
  
  // 保护全角空格 - 在序列化之前替换
  const FULLWIDTH_SPACE = '\u3000'
  const FULLWIDTH_SPACE_PLACEHOLDER = '___FULLWIDTH_SPACE___'
  
  // 遍历所有文本节点，替换全角空格
  const textNodes: Text[] = []
  const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }
  
  textNodes.forEach(textNode => {
    if (textNode.textContent && textNode.textContent.includes(FULLWIDTH_SPACE)) {
      textNode.textContent = textNode.textContent.replace(/\u3000/g, FULLWIDTH_SPACE_PLACEHOLDER)
    }
  })
  
  // 序列化
  let rawFragment = temp.innerHTML
  
  // 恢复全角空格
  rawFragment = rawFragment.replace(new RegExp(FULLWIDTH_SPACE_PLACEHOLDER, 'g'), FULLWIDTH_SPACE)

  // 净化（第一次）
  let sanitized = sanitizeHtml(rawFragment)
  
  // DOMParser 会自动添加 tbody 等，需要再净化一次
  // 确保序列化后的 HTML 也符合合规约束
  sanitized = sanitizeHtml(sanitized)

  // 生成稳定 ID（基于顺序 + 内容哈希）
  const id = generateModuleId(sanitized, kind)

  return {
    id,
    kind,
    html: sanitized,
    rawFragment
  }
}

/**
 * 生成稳定的模块 ID
 */
let moduleCounter = 0
function generateModuleId(html: string, kind: ModuleKind): string {
  // 简单策略：kind + 序号 + 内容摘要
  const snippet = html.substring(0, 20).replace(/\s+/g, '')
  const hash = simpleHash(html)
  return `${kind}-${++moduleCounter}-${hash}-${snippet}`
}

/**
 * 简单哈希（用于 ID 生成）
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * 导出选中模块为 HTML（严格原序拼接，不插入分隔符）
 */
export function exportModulesHtml(modules: HtmlModule[]): string {
  const combined = modules.map(m => m.html).join('')
  // 最终净化一次，确保移除浏览器自动添加的 tbody 等
  return sanitizeHtml(combined)
}

