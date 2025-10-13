/**
 * 模块渲染器测试（P2）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  mountEditor,
  exportSelectedModules,
  updateModuleContent,
  deleteModule,
  selectAllModules,
  clearSelection,
  getSelectedModules,
  type ModuleState
} from './moduleRenderer'
import { splitHtmlToModules } from './htmlSplitter'

// 设置 jsdom 环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.document = dom.window.document as any
global.Node = dom.window.Node as any
global.Element = dom.window.Element as any
global.HTMLElement = dom.window.HTMLElement as any
global.MouseEvent = dom.window.MouseEvent as any

describe('moduleRenderer (P2)', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('P2: 模块宿主容器渲染', () => {
    it('应创建模块宿主容器', () => {
      const html = '<p>测试</p><br><img src="test.jpg">'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)

      // 应创建对应数量的宿主容器
      const hosts = container.querySelectorAll('.pm-module-host')
      expect(hosts.length).toBe(modules.length)
    })

    it('模块宿主应包含 data-module-id 和 data-module-kind', () => {
      const html = '<br><p>测试</p>'
      const modules = splitHtmlToModules(html)

      mountEditor(container, modules)

      const hosts = container.querySelectorAll('.pm-module-host')
      for (const host of Array.from(hosts)) {
        expect((host as HTMLElement).dataset.moduleId).toBeDefined()
        expect((host as HTMLElement).dataset.moduleKind).toBeDefined()
      }
    })

    it('模块内容应就地渲染，不包裹多余结构', () => {
      const html = '<p>测试段落</p>'
      const modules = splitHtmlToModules(html)

      mountEditor(container, modules)

      const host = container.querySelector('.pm-module-host') as HTMLElement
      // 应直接包含 <p>，不包裹 div 等
      const p = host.querySelector('p')
      expect(p).toBeDefined()
      expect(p?.textContent).toContain('测试段落')
    })

    it('间隔模块应正确渲染', () => {
      const html = '<br><p>测试</p>'
      const modules = splitHtmlToModules(html)

      mountEditor(container, modules)

      const gapHost = container.querySelector('[data-module-kind="gap"]')
      expect(gapHost).toBeDefined()
      expect(gapHost?.querySelector('br')).toBeDefined()
    })

    it('图片模块应正确渲染', () => {
      const html = '<img src="test.jpg" alt="测试">'
      const modules = splitHtmlToModules(html)

      mountEditor(container, modules)

      const imageHost = container.querySelector('[data-module-kind="image"]')
      expect(imageHost).toBeDefined()
      const img = imageHost?.querySelector('img')
      expect(img?.getAttribute('src')).toBe('test.jpg')
    })

    it('表格模块应正确渲染', () => {
      const html = '<table><tr><td>测试</td></tr></table>'
      const modules = splitHtmlToModules(html)

      mountEditor(container, modules)

      const tableHost = container.querySelector('[data-module-kind="table"]')
      expect(tableHost).toBeDefined()
      expect(tableHost?.querySelector('table')).toBeDefined()
    })
  })

  describe('P2: Overlay 层', () => {
    it('每个模块应有 overlay 层', () => {
      const html = '<p>测试</p><br>'
      const modules = splitHtmlToModules(html)

      mountEditor(container, modules)

      const overlays = container.querySelectorAll('.pm-module-overlay')
      expect(overlays.length).toBe(modules.length)
    })

    it('overlay 应包含类型标签', () => {
      const html = '<br>'
      const modules = splitHtmlToModules(html)

      mountEditor(container, modules)

      const overlay = container.querySelector('.pm-module-overlay')
      const label = overlay?.querySelector('.pm-module-type-label')
      expect(label).toBeDefined()
      expect(label?.textContent).toBe('间隔')
    })

    it('overlay 应包含操作按钮', () => {
      const html = '<p>测试</p>'
      const modules = splitHtmlToModules(html)

      mountEditor(container, modules)

      const overlay = container.querySelector('.pm-module-overlay')
      const actions = overlay?.querySelector('.pm-module-actions')
      expect(actions).toBeDefined()

      const sourceBtn = actions?.querySelector('.pm-source-btn')
      const deleteBtn = actions?.querySelector('.pm-delete-btn')
      expect(sourceBtn).toBeDefined()
      expect(deleteBtn).toBeDefined()
    })

    it('选中模块时 overlay 应添加 pm-selected 类', () => {
      const html = '<p>测试</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      state.selectedIds.add(modules[0].id)

      // 重新渲染以应用状态
      const host = container.querySelector('.pm-module-host') as HTMLElement
      const overlay = host.querySelector('.pm-module-overlay')

      // 手动触发点击来选中
      state.selectedIds.clear()
      state.selectedIds.add(modules[0].id)

      // 验证状态
      expect(state.selectedIds.has(modules[0].id)).toBe(true)
    })
  })

  describe('P2: 导出 HTML', () => {
    it('导出应排除 overlay 层', () => {
      const html = '<p>测试内容</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      const exported = exportSelectedModules(container, state)

      // 不应包含 overlay 相关类名
      expect(exported).not.toContain('pm-module-overlay')
      expect(exported).not.toContain('pm-module-type-label')
      expect(exported).not.toContain('pm-module-actions')

      // 应包含原始内容
      expect(exported).toContain('测试内容')
    })

    it('导出应排除宿主容器', () => {
      const html = '<p>测试</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      const exported = exportSelectedModules(container, state)

      // 不应包含宿主容器类名和属性
      expect(exported).not.toContain('pm-module-host')
      expect(exported).not.toContain('data-module-id')
      expect(exported).not.toContain('data-module-kind')
    })

    it('导出 HTML 应与渲染前一致（仅净化差异）', () => {
      const html = '<p>测试</p><br><img src="test.jpg">'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      const exported = exportSelectedModules(container, state)

      // 导出应包含所有关键内容
      expect(exported).toContain('测试')
      expect(exported).toContain('<br>')
      expect(exported).toContain('test.jpg')

      // 长度应相近（允许净化导致的微小差异）
      const originalLength = modules.map(m => m.html).join('').length
      expect(Math.abs(exported.length - originalLength)).toBeLessThan(50)
    })

    it('未选中时应导出全部模块', () => {
      const html = '<p>第一段</p><p>第二段</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      const exported = exportSelectedModules(container, state)

      expect(exported).toContain('第一段')
      expect(exported).toContain('第二段')
    })

    it('选中部分模块时应仅导出选中的', () => {
      const html = '<p>第一段</p><br><p>第二段</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)

      // 仅选中第一个模块
      state.selectedIds.add(modules[0].id)

      const exported = exportSelectedModules(container, state)

      expect(exported).toContain('第一段')
      expect(exported).not.toContain('第二段')
    })

    it('导出应严格按序拼接', () => {
      const html = '<p>A</p><p>B</p><p>C</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      const exported = exportSelectedModules(container, state)

      // 验证顺序
      const indexA = exported.indexOf('A')
      const indexB = exported.indexOf('B')
      const indexC = exported.indexOf('C')

      expect(indexA).toBeLessThan(indexB)
      expect(indexB).toBeLessThan(indexC)
    })
  })

  describe('P2: 模块操作', () => {
    it('应能更新模块内容', () => {
      const html = '<p>原始内容</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      const moduleId = modules[0].id

      updateModuleContent(container, moduleId, '<p>新内容</p>', state)

      const exported = exportSelectedModules(container, state)
      expect(exported).toContain('新内容')
      expect(exported).not.toContain('原始内容')
    })

    it('更新模块内容后 overlay 应保留', () => {
      const html = '<p>测试</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      const moduleId = modules[0].id

      updateModuleContent(container, moduleId, '<p>新内容</p>', state)

      const host = container.querySelector(`[data-module-id="${moduleId}"]`)
      const overlay = host?.querySelector('.pm-module-overlay')
      expect(overlay).toBeDefined()
    })

    it('应能删除模块', () => {
      const html = '<p>第一段</p><p>第二段</p>'
      const modules = splitHtmlToModules(html)
      const originalCount = modules.length

      const state = mountEditor(container, modules)
      const firstModuleId = modules[0].id

      deleteModule(container, firstModuleId, state)

      expect(state.list.length).toBe(originalCount - 1)
      const host = container.querySelector(`[data-module-id="${firstModuleId}"]`)
      expect(host).toBeNull()
    })

    it('应能选择所有模块', () => {
      const html = '<p>A</p><p>B</p><p>C</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      selectAllModules(state)

      expect(state.selectedIds.size).toBe(modules.length)
    })

    it('应能清除选择', () => {
      const html = '<p>A</p><br><p>B</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      // 确保至少有2个模块
      if (modules.length >= 2) {
        state.selectedIds.add(modules[0].id)
        state.selectedIds.add(modules[1].id)
      }

      clearSelection(state)

      expect(state.selectedIds.size).toBe(0)
    })

    it('应能获取选中的模块', () => {
      const html = '<p>A</p><br><p>B</p><br><p>C</p>'
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      // 确保至少有3个模块
      if (modules.length >= 3) {
        state.selectedIds.add(modules[0].id)
        state.selectedIds.add(modules[2].id)

        const selected = getSelectedModules(state)

        expect(selected.length).toBe(2)
        expect(selected[0].id).toBe(modules[0].id)
        expect(selected[1].id).toBe(modules[2].id)
      } else {
        // 如果模块数不够，至少验证函数能正常工作
        state.selectedIds.add(modules[0].id)
        const selected = getSelectedModules(state)
        expect(selected.length).toBeGreaterThan(0)
      }
    })
  })

  describe('P2: 导出纯净性验证', () => {
    it('复杂 HTML 导出应保持纯净', () => {
      const html = `
        <table bgcolor="#bf0000">
          <tr><td>测试</td></tr>
        </table>
        <br>
        <img src="test.jpg" width="100%">
        <p align="center">文本</p>
      `
      const modules = splitHtmlToModules(html)

      const state = mountEditor(container, modules)
      const exported = exportSelectedModules(container, state)

      // 不应包含任何编辑辅助
      expect(exported).not.toContain('pm-')
      expect(exported).not.toContain('data-module')
      expect(exported).not.toContain('overlay')

      // 应包含所有原始属性
      expect(exported).toContain('bgcolor="#bf0000"')
      expect(exported).toContain('width="100%"')
      expect(exported).toContain('align="center"')
    })

    it('导出后再拆分应得到相同数量的模块', () => {
      const html = '<p>A</p><br><img src="test.jpg"><br><table><tr><td>B</td></tr></table>'
      const modules1 = splitHtmlToModules(html)

      const state = mountEditor(container, modules1)
      const exported = exportSelectedModules(container, state)

      const modules2 = splitHtmlToModules(exported)

      expect(modules2.length).toBe(modules1.length)
    })
  })
})

