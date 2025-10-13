/**
 * HTML 净化工具（Rakuten SP 合规版）
 * 
 * 严格遵守白名单标签/属性；移除禁止项；表外壳提升。
 * 不改写实体与协议；不新增任何标签/属性/结构。
 */

// 白名单配置
const ALLOWED_TAGS = new Set([
  'table', 'tr', 'td', 'th',           // 结构
  'p', 'br', 'font', 'b', 'strong', 'i', 'u', 'center', 'a', // 文本
  'img',                               // 媒体
  'hr'                                 // 分隔（仅原文存在时保留）
])

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  'a': new Set(['href', 'target']),
  'img': new Set(['src', 'alt', 'width', 'height', 'border']),
  'table': new Set(['align', 'bgcolor', 'border', 'bordercolor', 'cellpadding', 'cellspacing', 'frame', 'height', 'rules', 'width']),
  'tr': new Set(['align', 'bgcolor', 'bordercolor', 'height', 'valign']),
  'td': new Set(['align', 'bgcolor', 'bordercolor', 'height', 'valign', 'width', 'colspan', 'rowspan', 'axis', 'headers']),
  'th': new Set(['align', 'bgcolor', 'bordercolor', 'height', 'valign', 'width', 'colspan', 'rowspan', 'axis', 'headers']),
  'p': new Set(['align']),
  'font': new Set(['color', 'size'])
}

// 强制移除的标签（直接删除，不保留内容）
const DISALLOWED_TAGS_NO_CONTENT = new Set([
  'script', 'style', 'iframe', 'col'
])

// 移除但保留内容的标签
const DISALLOWED_TAGS_KEEP_CONTENT = new Set([
  'span'
])

// 表格外壳（需提升/删除）
const TABLE_WRAPPER_TAGS = new Set([
  'thead', 'tbody', 'tfoot', 'colgroup'
])

/**
 * 净化 HTML 片段
 * @param html 原始 HTML 字符串
 * @returns 净化后的 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
  // 0. 保护全角空格（U+3000）- 临时替换为占位符
  const FULLWIDTH_SPACE = '\u3000'
  const FULLWIDTH_SPACE_PLACEHOLDER = '___FULLWIDTH_SPACE___'
  const hasFullwidthSpace = html.includes(FULLWIDTH_SPACE)
  let processedHtml = html
  
  if (hasFullwidthSpace) {
    processedHtml = html.replace(/\u3000/g, FULLWIDTH_SPACE_PLACEHOLDER)
  }

  // 1. 解析为 DOM
  const parser = new DOMParser()
  const doc = parser.parseFromString(processedHtml, 'text/html')
  const container = doc.body

  // 2. 净化节点树
  sanitizeNode(container)

  // 3. 序列化回 HTML
  let result = container.innerHTML
  
  // 4. 恢复全角空格
  if (hasFullwidthSpace) {
    result = result.replace(new RegExp(FULLWIDTH_SPACE_PLACEHOLDER, 'g'), FULLWIDTH_SPACE)
  }
  
  return result
}

/**
 * 递归净化节点（移除禁止标签/属性；提升表外壳）
 */
function sanitizeNode(node: Node): void {
  const toRemove: Node[] = []
  const toPromote: Array<{ wrapper: Element; parent: Node }> = []

  // 遍历子节点
  const children = Array.from(node.childNodes)
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element
      const tagName = el.tagName.toLowerCase()

      // 强制移除禁止标签（直接删除，不保留内容）
      if (DISALLOWED_TAGS_NO_CONTENT.has(tagName)) {
        toRemove.push(child)
        continue
      }

      // 移除但保留内容的标签
      if (DISALLOWED_TAGS_KEEP_CONTENT.has(tagName)) {
        toRemove.push(child)
        continue
      }

      // 表格外壳：提升其子节点
      if (TABLE_WRAPPER_TAGS.has(tagName)) {
        toPromote.push({ wrapper: el, parent: node })
        continue
      }

      // 非白名单标签：移除（保留内容）
      if (!ALLOWED_TAGS.has(tagName)) {
        toRemove.push(child)
        continue
      }

      // 清洗属性
      sanitizeAttributes(el)

      // 递归净化子节点
      sanitizeNode(child)
    }
  }

  // 执行移除
  for (const child of toRemove) {
    const el = child as Element
    const tagName = el.tagName.toLowerCase()
    
    // 禁止标签（直接删除，不保留内容）
    if (DISALLOWED_TAGS_NO_CONTENT.has(tagName)) {
      node.removeChild(child)
    } else {
      // 其他标签：移除但保留内容
      while (el.firstChild) {
        node.insertBefore(el.firstChild, child)
      }
      node.removeChild(child)
    }
  }

  // 执行表外壳提升
  for (const { wrapper, parent } of toPromote) {
    // 提升子节点前，先净化子节点
    sanitizeNode(wrapper)
    
    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper)
    }
    parent.removeChild(wrapper)
  }
}

/**
 * 清洗元素属性（移除禁止属性；仅保留白名单）
 */
function sanitizeAttributes(el: Element): void {
  const tagName = el.tagName.toLowerCase()
  const allowed = ALLOWED_ATTRIBUTES[tagName] || new Set<string>()

  // 收集所有属性名
  const attrNames: string[] = []
  for (let i = 0; i < el.attributes.length; i++) {
    attrNames.push(el.attributes[i].name)
  }

  // 移除非白名单属性
  for (const name of attrNames) {
    const lowerName = name.toLowerCase()

    // 强制移除的属性模式
    if (
      lowerName === 'style' ||
      lowerName === 'class' ||
      lowerName === 'id' ||
      lowerName.startsWith('data-') ||
      lowerName.startsWith('aria-') ||
      lowerName.startsWith('on')
    ) {
      el.removeAttribute(name)
      continue
    }

    // 非白名单属性
    if (!allowed.has(lowerName)) {
      el.removeAttribute(name)
    }
  }
}

/**
 * 验证净化结果是否合规
 * @returns 验证错误列表（为空表示合规）
 */
export function validateSanitized(html: string): string[] {
  const errors: string[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  function checkNode(node: Node, path: string): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tagName = el.tagName.toLowerCase()

      // 跳过 DOMParser 自动添加的容器标签
      if (tagName === 'html' || tagName === 'head' || tagName === 'body') {
        // 只检查子节点
        for (let i = 0; i < node.childNodes.length; i++) {
          checkNode(node.childNodes[i], path)
        }
        return
      }

      // 检查禁止标签
      if (DISALLOWED_TAGS_NO_CONTENT.has(tagName) || DISALLOWED_TAGS_KEEP_CONTENT.has(tagName)) {
        errors.push(`${path}: 发现禁止标签 <${tagName}>`)
      }

      // 检查表外壳
      if (TABLE_WRAPPER_TAGS.has(tagName)) {
        errors.push(`${path}: 发现表外壳 <${tagName}>`)
      }

      // 检查非白名单标签
      if (!ALLOWED_TAGS.has(tagName) && 
          !DISALLOWED_TAGS_NO_CONTENT.has(tagName) && 
          !DISALLOWED_TAGS_KEEP_CONTENT.has(tagName) && 
          !TABLE_WRAPPER_TAGS.has(tagName)) {
        errors.push(`${path}: 发现非白名单标签 <${tagName}>`)
      }

      // 检查属性
      const allowed = ALLOWED_ATTRIBUTES[tagName] || new Set<string>()
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i]
        const name = attr.name.toLowerCase()

        if (
          name === 'style' ||
          name === 'class' ||
          name === 'id' ||
          name.startsWith('data-') ||
          name.startsWith('aria-') ||
          name.startsWith('on')
        ) {
          errors.push(`${path}: 发现禁止属性 ${name}`)
        } else if (!allowed.has(name)) {
          errors.push(`${path}: 发现非白名单属性 <${tagName} ${name}>`)
        }
      }

      // 递归检查子节点
      for (let i = 0; i < node.childNodes.length; i++) {
        checkNode(node.childNodes[i], `${path}/${tagName}[${i}]`)
      }
    }
  }

  checkNode(doc.body, 'root')
  return errors
}

