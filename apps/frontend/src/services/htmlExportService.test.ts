import { describe, it, expect } from 'vitest'
import { HtmlExportService, generateHTML, generatePreviewHTML } from './htmlExportService'
import type { PageModule } from '@pagemaker/shared-types'
import { PageModuleType } from '@pagemaker/shared-types'

describe('HtmlExportService', () => {
  const mockTitleModule: PageModule = {
    id: 'title-1',
    type: PageModuleType.TITLE,
    content: '测试标题',
    level: 'h1',
    alignment: 'center',
    color: '#1975B0'
  }

  const mockTextModule: PageModule = {
    id: 'text-1',
    type: PageModuleType.TEXT,
    content: '这是一段测试文本\n包含换行符',
    alignment: 'left',
    fontSize: '16px',
    color: '#333333'
  }

  describe('generateHTML', () => {
    it('应该默认生成纯内容HTML（不包含文档结构）', () => {
      const html = HtmlExportService.generateHTML([mockTitleModule])

      expect(html).not.toContain('<!DOCTYPE html>')
      expect(html).not.toContain('<html lang="zh-CN">')
      expect(html).not.toContain('<head>')
      expect(html).not.toContain('<body>')
      expect(html).toContain('<h1 class="pm-title"')
      expect(html).toContain('测试标题')
    })

    it('应该在fullDocument=true时生成完整的HTML文档结构', () => {
      const html = HtmlExportService.generateHTML([mockTitleModule], { fullDocument: true })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html lang="zh-CN">')
      expect(html).toContain('<head>')
      expect(html).toContain('<body>')
      expect(html).toContain('<meta charset="UTF-8">')
      expect(html).toContain('<title>Pagemaker 导出页面</title>')
      expect(html).toContain('<meta name="generator" content="Pagemaker CMS">')
    })

    it('应该在fullDocument=true时包含默认CSS样式', () => {
      const html = HtmlExportService.generateHTML([mockTitleModule], { fullDocument: true })

      expect(html).toContain('<style>')
      expect(html).toContain('/* Pagemaker CMS 导出样式 */')
      expect(html).toContain('.pagemaker-content')
      expect(html).toContain('@media (max-width: 768px)')
    })

    it('应该支持自定义选项', () => {
      const options = {
        title: '自定义标题',
        description: '自定义描述',
        language: 'en',
        includeStyles: false,
        minify: true,
        fullDocument: true
      }

      const html = HtmlExportService.generateHTML([mockTitleModule], options)

      expect(html).toContain('<title>自定义标题</title>')
      expect(html).toContain('content="自定义描述"')
      expect(html).toContain('<html lang="en">')
      expect(html).not.toContain('<style>')
    })

    it('应该在纯内容模式下忽略CSS样式选项', () => {
      const options = {
        includeStyles: true,
        fullDocument: false
      }

      const html = HtmlExportService.generateHTML([mockTitleModule], options)

      expect(html).not.toContain('<style>')
      expect(html).not.toContain('<!DOCTYPE html>')
      expect(html).toContain('<h1 class="pm-title"')
    })

    it('应该处理空模块数组', () => {
      const html = HtmlExportService.generateHTML([])

      expect(html).toBe('') // 纯内容模式下空模块数组返回空字符串
    })

    it('应该在完整文档模式下处理空模块数组', () => {
      const html = HtmlExportService.generateHTML([], { fullDocument: true })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<div class="pagemaker-content">')
      expect(html).toContain('</div>')
    })
  })

  describe('模块HTML生成', () => {
    it('应该正确生成标题模块HTML', () => {
      const html = HtmlExportService.generateHTML([mockTitleModule])

      expect(html).toContain('<h1 class="pm-title"')
      expect(html).toContain('text-align: center')
      expect(html).toContain('color: #1975B0')
      expect(html).toContain('测试标题')
    })

    it('应该正确生成文本模块HTML', () => {
      const html = HtmlExportService.generateHTML([mockTextModule])

      expect(html).toContain('<div class="pm-text"')
      expect(html).toContain('text-align: left')
      expect(html).toContain('font-size: 16px')
      expect(html).toContain('测试文本<br>包含换行符')
    })

    it('应该正确生成图片模块HTML', () => {
      const imageModule: PageModule = {
        id: 'image-test',
        type: PageModuleType.IMAGE,
        src: 'https://example.com/image.jpg',
        alt: '测试图片',
        width: '400px',
        alignment: 'center'
      }

      const html = HtmlExportService.generateHTML([imageModule])

      expect(html).toContain('<div class="pm-image"')
      expect(html).toContain('<img src="https://example.com/image.jpg"')
      expect(html).toContain('alt="测试图片"')
      expect(html).toContain('width: 400px')
      expect(html).toContain('text-align: center')
    })

    it('应该处理没有图片源的图片模块', () => {
      const imageModule: PageModule = {
        id: 'image-empty',
        type: PageModuleType.IMAGE,
        src: '',
        alt: '空图片'
      }

      const html = HtmlExportService.generateHTML([imageModule])

      expect(html).toContain('<div class="pm-image-placeholder"')
      expect(html).toContain('图片未设置')
      expect(html).not.toContain('<img')
    })

    it('应该处理未知模块类型', () => {
      const unknownModule: PageModule = {
        id: 'unknown-test',
        type: 'unknown' as any
      }

      const html = HtmlExportService.generateHTML([unknownModule])

      // 未知模块应该被忽略，不生成任何HTML（纯内容模式下返回空字符串）
      expect(html).toBe('')
    })
  })

  describe('HTML转义', () => {
    it('应该正确转义HTML特殊字符', () => {
      // Mock document to force manual escaping path
      const originalDocument = global.document
      // @ts-ignore
      global.document = undefined

      const textModule: PageModule = {
        id: 'escape-test',
        type: PageModuleType.TEXT,
        content: '<script>alert("XSS")</script> & "quotes"'
      }

      const html = HtmlExportService.generateHTML([textModule])

      expect(html).toContain('&lt;script&gt;')
      expect(html).toContain('&amp;')
      expect(html).toContain('&quot;')
      expect(html).not.toContain('<script>')
      expect(html).not.toContain('alert("XSS")')

      // Restore original document
      global.document = originalDocument
    })
  })

  describe('便捷函数', () => {
    it('generateHTML 函数应该正常工作', () => {
      const html = generateHTML([mockTitleModule], { title: '便捷函数测试', fullDocument: true })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<title>便捷函数测试</title>')
    })

    it('generatePreviewHTML 函数应该只返回模块HTML', () => {
      const html = generatePreviewHTML([mockTitleModule, mockTextModule])

      expect(html).not.toContain('<!DOCTYPE html>')
      expect(html).not.toContain('<head>')
      expect(html).not.toContain('<body>')
      expect(html).toContain('<h1 class="pm-title"')
      expect(html).toContain('<div class="pm-text"')
    })
  })

  describe('边界情况', () => {
    it('应该处理空的或无效的模块数据', () => {
      const invalidModules: PageModule[] = [
        { id: '', type: PageModuleType.TITLE },
        { id: 'null-content', type: PageModuleType.TEXT, content: null },
        { id: 'undefined-props', type: PageModuleType.IMAGE }
      ]

      const html = HtmlExportService.generateHTML(invalidModules)

      // 纯内容模式下应该生成模块HTML
      expect(html).toContain('<h2 class="pm-title"')
      expect(html).toContain('<div class="pm-text"')
      expect(html).toContain('<div class="pm-image-placeholder"')
    })

    it('应该在完整文档模式下处理空的或无效的模块数据', () => {
      const invalidModules: PageModule[] = [
        { id: '', type: PageModuleType.TITLE },
        { id: 'null-content', type: PageModuleType.TEXT, content: null },
        { id: 'undefined-props', type: PageModuleType.IMAGE }
      ]

      const html = HtmlExportService.generateHTML(invalidModules, { fullDocument: true })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<div class="pagemaker-content">')
    })
  })
})
