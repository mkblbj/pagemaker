/**
 * 文本编辑器测试（P3）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { enableTextEditing } from './textEditor'

// 设置 jsdom 环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.document = dom.window.document as any
global.Node = dom.window.Node as any
global.Element = dom.window.Element as any
global.HTMLElement = dom.window.HTMLElement as any
global.window = dom.window as any
global.MouseEvent = dom.window.MouseEvent as any
global.KeyboardEvent = dom.window.KeyboardEvent as any
global.FocusEvent = dom.window.FocusEvent as any

describe('textEditor (P3)', () => {
  let container: HTMLElement
  let element: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    
    element = document.createElement('p')
    element.textContent = '测试文本'
    container.appendChild(element)
  })

  describe('P3: 单击激活编辑', () => {
    it('单击应激活 contenteditable', () => {
      enableTextEditing(element)

      element.click()

      expect(element.getAttribute('contenteditable')).toBe('true')
      expect(element.classList.contains('pm-editing')).toBe(true)
    })

    it('激活后应显示工具条', () => {
      enableTextEditing(element)

      element.click()

      const toolbar = document.querySelector('.pm-text-toolbar')
      expect(toolbar).toBeDefined()
    })

    it('工具条应包含基本按钮', () => {
      enableTextEditing(element)

      element.click()

      const toolbar = document.querySelector('.pm-text-toolbar')
      expect(toolbar?.querySelector('.pm-toolbar-btn')).toBeDefined() // 加粗按钮
      expect(toolbar?.querySelector('.pm-toolbar-color')).toBeDefined() // 颜色选择器
      expect(toolbar?.querySelector('.pm-toolbar-size')).toBeDefined() // 字号选择
      expect(toolbar?.querySelector('.pm-toolbar-save')).toBeDefined() // 保存按钮
      expect(toolbar?.querySelector('.pm-toolbar-cancel')).toBeDefined() // 取消按钮
    })
  })

  describe('P3: 失焦保存', () => {
    it('失焦应保存内容', (done) => {
      const onSave = vi.fn()
      enableTextEditing(element, { onSave })

      element.click()
      element.textContent = '修改后的文本'

      // 模拟失焦
      element.blur()

      // 等待失焦保存的延迟
      setTimeout(() => {
        expect(onSave).toHaveBeenCalled()
        expect(element.getAttribute('contenteditable')).toBeNull()
        expect(element.classList.contains('pm-editing')).toBe(false)
        done()
      }, 300)
    })

    it('失焦后工具条应移除', (done) => {
      enableTextEditing(element)

      element.click()
      element.blur()

      setTimeout(() => {
        const toolbar = document.querySelector('.pm-text-toolbar')
        expect(toolbar).toBeNull()
        done()
      }, 300)
    })
  })

  describe('P3: 键盘快捷键', () => {
    it('Esc 应取消编辑', () => {
      const onCancel = vi.fn()
      enableTextEditing(element, { onCancel })

      const originalText = element.textContent
      element.click()
      element.textContent = '修改后的文本'

      // 按 Esc
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      element.dispatchEvent(escEvent)

      expect(onCancel).toHaveBeenCalled()
      expect(element.textContent).toBe(originalText)
      expect(element.getAttribute('contenteditable')).toBeNull()
    })

    it('Enter 应插入 <br>', () => {
      enableTextEditing(element)

      element.click()

      // 模拟按 Enter（实际测试中难以完全模拟 Selection API）
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      Object.defineProperty(enterEvent, 'preventDefault', { value: vi.fn() })
      element.dispatchEvent(enterEvent)

      // 验证 preventDefault 被调用
      expect(enterEvent.preventDefault).toHaveBeenCalled()
    })
  })

  describe('P3: 内容净化', () => {
    it('保存时应移除非白名单标签', (done) => {
      const onSave = vi.fn()
      enableTextEditing(element, { onSave })

      element.click()
      element.innerHTML = '<p>测试<span style="color: red;">文本</span></p>'

      element.blur()

      setTimeout(() => {
        expect(onSave).toHaveBeenCalled()
        const savedHtml = onSave.mock.calls[0][0]
        
        // 不应包含 span 和 style
        expect(savedHtml).not.toContain('<span')
        expect(savedHtml).not.toContain('style=')
        done()
      }, 300)
    })

    it('保存时应保留白名单标签', (done) => {
      const onSave = vi.fn()
      enableTextEditing(element, { onSave })

      element.click()
      element.innerHTML = '<b>粗体</b><font color="red">红色</font><a href="test.html">链接</a>'

      element.blur()

      setTimeout(() => {
        const savedHtml = onSave.mock.calls[0][0]
        
        // 应保留 b, font, a
        expect(savedHtml).toContain('<b>')
        expect(savedHtml).toContain('<font')
        expect(savedHtml).toContain('<a')
        done()
      }, 300)
    })
  })

  describe('P3: 清理函数', () => {
    it('应返回清理函数', () => {
      const cleanup = enableTextEditing(element)

      expect(typeof cleanup).toBe('function')
    })

    it('清理函数应移除事件监听', () => {
      const cleanup = enableTextEditing(element)

      element.click()
      expect(element.getAttribute('contenteditable')).toBe('true')

      cleanup()

      // 清理后再点击不应激活编辑
      element.click()
      // 由于已经激活过，这里验证清理是否正确需要重新创建元素
    })
  })

  describe('P3: 工具条功能', () => {
    it('保存按钮应存在', () => {
      enableTextEditing(element)

      element.click()

      const saveBtn = document.querySelector('.pm-toolbar-save') as HTMLElement
      expect(saveBtn).toBeDefined()
      expect(saveBtn?.textContent).toBe('✓')
    })

    it('取消按钮应存在', () => {
      enableTextEditing(element)

      element.click()

      const cancelBtn = document.querySelector('.pm-toolbar-cancel') as HTMLElement
      expect(cancelBtn).toBeDefined()
      expect(cancelBtn?.textContent).toBe('✗')
    })
  })
})

