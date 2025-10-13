/**
 * 模块渲染器（P2：就地渲染与 Overlay）
 * 
 * 核心原则：
 * - 就地渲染：模块 DOM 不包裹多余结构
 * - Overlay 分离：编辑辅助（高亮/工具条）通过 overlay 实现，不写入模块 DOM
 * - 导出纯净：导出 HTML 与渲染前一致（仅净化差异）
 */

import type { HtmlModule } from './htmlSplitter'
import { sanitizeHtml } from './htmlSanitizer'
import { enableTextEditing } from './textEditor'

export interface ModuleState {
  list: HtmlModule[]
  selectedIds: Set<string>
  hoveredId: string | null
  editCleanups: Map<string, () => void> // 编辑器清理函数
}

export interface RenderOptions {
  enableSelection?: boolean  // 是否启用选择功能
  enableHover?: boolean      // 是否启用悬停高亮
  onModuleClick?: (moduleId: string, event: MouseEvent) => void
  onModuleDoubleClick?: (moduleId: string, event: MouseEvent) => void
}

/**
 * 初始化编辑器
 */
export function mountEditor(
  root: HTMLElement,
  modules: HtmlModule[],
  options: RenderOptions = {}
): ModuleState {
  const state: ModuleState = {
    list: modules,
    selectedIds: new Set(),
    hoveredId: null,
    editCleanups: new Map()
  }

  // 清空容器
  root.innerHTML = ''
  root.className = 'pm-editor-root'

  // 渲染所有模块
  for (const mod of modules) {
    const moduleHost = createModuleHost(mod, state, options)
    root.appendChild(moduleHost)
  }

  return state
}

/**
 * 创建模块宿主容器
 * 
 * 结构：
 * <div class="pm-module-host" data-module-id="xxx" data-module-kind="gap">
 *   <!-- 模块内容（纯净 HTML，不包裹） -->
 *   <br>
 *   <!-- Overlay 层（编辑辅助，不参与导出） -->
 *   <div class="pm-module-overlay">...</div>
 * </div>
 */
function createModuleHost(
  mod: HtmlModule,
  state: ModuleState,
  options: RenderOptions
): HTMLElement {
  const host = document.createElement('div')
  host.className = 'pm-module-host'
  host.dataset.moduleId = mod.id
  host.dataset.moduleKind = mod.kind

  // 1. 插入模块内容（就地，不包裹）
  const contentNodes = htmlToNodes(mod.html)
  for (const node of contentNodes) {
    host.appendChild(node)
  }

  // 2. 创建 Overlay 层（编辑辅助）
  const overlay = createModuleOverlay(mod, state, options)
  host.appendChild(overlay)

  // 3. 绑定交互事件
  attachModuleEvents(host, mod, state, options)

  // 4. 对于文本和表格模块，启用文本编辑
  if (mod.kind === 'text' || mod.kind === 'table') {
    enableTextEditingForModule(host, mod, state)
  }

  return host
}

/**
 * 将 HTML 字符串转为 DOM 节点数组
 */
function htmlToNodes(html: string): Node[] {
  const temp = document.createElement('div')
  temp.innerHTML = html
  return Array.from(temp.childNodes)
}

/**
 * 创建模块 Overlay（编辑辅助层）
 * 
 * Overlay 包含：
 * - 选中高亮边框
 * - 悬停高亮
 * - 模块类型标签
 * - 操作按钮（源码/删除等）
 */
function createModuleOverlay(
  mod: HtmlModule,
  state: ModuleState,
  options: RenderOptions
): HTMLElement {
  const overlay = document.createElement('div')
  overlay.className = 'pm-module-overlay'
  overlay.dataset.overlayFor = mod.id

  // 选中状态
  if (state.selectedIds.has(mod.id)) {
    overlay.classList.add('pm-selected')
  }

  // 悬停状态
  if (state.hoveredId === mod.id) {
    overlay.classList.add('pm-hovered')
  }

  // 模块类型标签
  const typeLabel = document.createElement('div')
  typeLabel.className = 'pm-module-type-label'
  typeLabel.textContent = getModuleTypeLabel(mod.kind)
  overlay.appendChild(typeLabel)

  // 操作按钮容器
  const actions = document.createElement('div')
  actions.className = 'pm-module-actions'

  // 源码按钮
  const sourceBtn = document.createElement('button')
  sourceBtn.className = 'pm-action-btn pm-source-btn'
  sourceBtn.textContent = '源码'
  sourceBtn.title = '查看/编辑源码'
  actions.appendChild(sourceBtn)

  // 删除按钮
  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'pm-action-btn pm-delete-btn'
  deleteBtn.textContent = '×'
  deleteBtn.title = '删除模块'
  actions.appendChild(deleteBtn)

  overlay.appendChild(actions)

  return overlay
}

/**
 * 获取模块类型显示标签
 */
function getModuleTypeLabel(kind: HtmlModule['kind']): string {
  const labels: Record<HtmlModule['kind'], string> = {
    gap: '间隔',
    image: '图片',
    table: '表格',
    text: '文本'
  }
  return labels[kind]
}

/**
 * 绑定模块交互事件
 */
function attachModuleEvents(
  host: HTMLElement,
  mod: HtmlModule,
  state: ModuleState,
  options: RenderOptions
): void {
  // 点击选择
  if (options.enableSelection !== false) {
    host.addEventListener('click', (e) => {
      // 忽略 overlay 内按钮的点击
      if ((e.target as HTMLElement).closest('.pm-module-actions')) {
        return
      }

      // 切换选中状态
      if (state.selectedIds.has(mod.id)) {
        state.selectedIds.delete(mod.id)
      } else {
        // Ctrl/Cmd 多选，否则单选
        if (!e.ctrlKey && !e.metaKey) {
          state.selectedIds.clear()
        }
        state.selectedIds.add(mod.id)
      }

      // 更新 overlay 状态
      updateOverlayState(host, state)

      // 触发回调
      if (options.onModuleClick) {
        options.onModuleClick(mod.id, e)
      }
    })
  }

  // 双击编辑
  if (options.onModuleDoubleClick) {
    host.addEventListener('dblclick', (e) => {
      options.onModuleDoubleClick!(mod.id, e)
    })
  }

  // 悬停高亮
  if (options.enableHover !== false) {
    host.addEventListener('mouseenter', () => {
      state.hoveredId = mod.id
      updateOverlayState(host, state)
    })

    host.addEventListener('mouseleave', () => {
      if (state.hoveredId === mod.id) {
        state.hoveredId = null
        updateOverlayState(host, state)
      }
    })
  }
}

/**
 * 更新 Overlay 状态
 */
function updateOverlayState(host: HTMLElement, state: ModuleState): void {
  const overlay = host.querySelector('.pm-module-overlay') as HTMLElement
  if (!overlay) return

  const moduleId = host.dataset.moduleId!

  // 选中状态
  if (state.selectedIds.has(moduleId)) {
    overlay.classList.add('pm-selected')
  } else {
    overlay.classList.remove('pm-selected')
  }

  // 悬停状态
  if (state.hoveredId === moduleId) {
    overlay.classList.add('pm-hovered')
  } else {
    overlay.classList.remove('pm-hovered')
  }
}

/**
 * 导出选中模块的 HTML（纯净，不包含 overlay）
 */
export function exportSelectedModules(
  root: HTMLElement,
  state: ModuleState
): string {
  const fragments: string[] = []

  // 按顺序遍历所有模块宿主
  const hosts = root.querySelectorAll('.pm-module-host')
  for (const host of Array.from(hosts)) {
    const moduleId = (host as HTMLElement).dataset.moduleId!

    // 如果有选中，仅导出选中的；否则导出全部
    if (state.selectedIds.size > 0 && !state.selectedIds.has(moduleId)) {
      continue
    }

    // 提取模块内容（排除 overlay）
    const moduleHtml = extractModuleContent(host as HTMLElement)
    fragments.push(moduleHtml)
  }

  return fragments.join('')
}

/**
 * 提取模块内容（排除 overlay 和其他编辑辅助节点）
 */
function extractModuleContent(host: HTMLElement): string {
  const temp = document.createElement('div')

  // 复制所有子节点，但排除 overlay
  for (const child of Array.from(host.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      // 跳过 overlay 和其他编辑辅助节点
      if (el.classList.contains('pm-module-overlay')) {
        continue
      }
    }
    temp.appendChild(child.cloneNode(true))
  }

  // 序列化后需要净化，因为浏览器会自动添加 tbody 等标签
  const html = temp.innerHTML
  return sanitizeHtml(html)
}

/**
 * 重新渲染所有模块（保持状态）
 */
export function rerenderModules(
  root: HTMLElement,
  state: ModuleState,
  options: RenderOptions = {}
): void {
  root.innerHTML = ''

  for (const mod of state.list) {
    const moduleHost = createModuleHost(mod, state, options)
    root.appendChild(moduleHost)
  }
}

/**
 * 更新单个模块的内容
 */
export function updateModuleContent(
  root: HTMLElement,
  moduleId: string,
  newHtml: string,
  state: ModuleState
): void {
  // 更新状态中的模块
  const mod = state.list.find(m => m.id === moduleId)
  if (!mod) return

  mod.html = newHtml

  // 更新 DOM
  const host = root.querySelector(`[data-module-id="${moduleId}"]`) as HTMLElement
  if (!host) return

  // 移除旧内容（保留 overlay）
  const overlay = host.querySelector('.pm-module-overlay')
  host.innerHTML = ''

  // 插入新内容
  const contentNodes = htmlToNodes(newHtml)
  for (const node of contentNodes) {
    host.appendChild(node)
  }

  // 恢复 overlay
  if (overlay) {
    host.appendChild(overlay)
  }
}

/**
 * 删除模块
 */
export function deleteModule(
  root: HTMLElement,
  moduleId: string,
  state: ModuleState
): void {
  // 从状态中移除
  const index = state.list.findIndex(m => m.id === moduleId)
  if (index === -1) return

  state.list.splice(index, 1)
  state.selectedIds.delete(moduleId)

  // 从 DOM 中移除
  const host = root.querySelector(`[data-module-id="${moduleId}"]`)
  if (host) {
    host.remove()
  }
}

/**
 * 选择所有模块
 */
export function selectAllModules(state: ModuleState): void {
  state.selectedIds.clear()
  for (const mod of state.list) {
    state.selectedIds.add(mod.id)
  }
}

/**
 * 清除所有选择
 */
export function clearSelection(state: ModuleState): void {
  state.selectedIds.clear()
}

/**
 * 获取选中的模块
 */
export function getSelectedModules(state: ModuleState): HtmlModule[] {
  return state.list.filter(m => state.selectedIds.has(m.id))
}

/**
 * 为模块启用文本编辑
 */
function enableTextEditingForModule(
  host: HTMLElement,
  mod: HtmlModule,
  state: ModuleState
): void {
  // 找到可编辑的元素（排除 overlay）
  const editableElements: HTMLElement[] = []
  
  for (const child of Array.from(host.children)) {
    if (child.classList.contains('pm-module-overlay')) {
      continue
    }
    if (child.nodeType === Node.ELEMENT_NODE) {
      editableElements.push(child as HTMLElement)
    }
  }

  // 为每个可编辑元素启用编辑
  const cleanups: Array<() => void> = []
  
  for (const element of editableElements) {
    const cleanup = enableTextEditing(element, {
      onSave: (html) => {
        // 更新模块内容
        const updatedHtml = extractModuleContent(host)
        mod.html = updatedHtml
        
        // 更新状态中的模块
        const index = state.list.findIndex(m => m.id === mod.id)
        if (index >= 0) {
          state.list[index] = { ...mod, html: updatedHtml }
        }
      }
    })
    cleanups.push(cleanup)
  }

  // 保存清理函数
  state.editCleanups.set(mod.id, () => {
    cleanups.forEach(cleanup => cleanup())
  })
}

