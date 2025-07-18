import { describe, it, expect } from 'vitest'
import { HtmlExportService, generateHTML, generatePreviewHTML } from './htmlExportService'
import type { PageModule } from '@pagemaker/shared-types'
import { PageModuleType } from '@pagemaker/shared-types'

describe('HtmlExportService', () => {
  const mockTitleModule: PageModule = {
    id: 'title-1',
    type: PageModuleType.TITLE,
    text: '测试标题',
    level: 1,
    alignment: 'center',
    color: '#1975B0',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold'
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

    it('应该正确处理标题模块的新属性', () => {
      const html = HtmlExportService.generateHTML([mockTitleModule])

      expect(html).toContain('<h1 class="pm-title"')
      expect(html).toContain('text-align: center')
      expect(html).toContain('color: #1975B0')
      expect(html).toContain('font-family: Arial, sans-serif')
      expect(html).toContain('font-weight: bold')
      expect(html).toContain('测试标题')
    })

    it('应该处理不同的标题级别', () => {
      const h2Module = { ...mockTitleModule, level: 2 }
      const h3Module = { ...mockTitleModule, level: 3 }

      const h2Html = HtmlExportService.generateHTML([h2Module])
      const h3Html = HtmlExportService.generateHTML([h3Module])

      expect(h2Html).toContain('<h2 class="pm-title"')
      expect(h3Html).toContain('<h3 class="pm-title"')
    })

    it('应该处理不同的对齐方式', () => {
      const leftModule = { ...mockTitleModule, alignment: 'left' }
      const rightModule = { ...mockTitleModule, alignment: 'right' }

      const leftHtml = HtmlExportService.generateHTML([leftModule])
      const rightHtml = HtmlExportService.generateHTML([rightModule])

      expect(leftHtml).toContain('text-align: left')
      expect(rightHtml).toContain('text-align: right')
    })

    it('应该处理自定义字体', () => {
      const customFontModule = {
        ...mockTitleModule,
        fontFamily: 'Times New Roman, serif',
        fontWeight: 'normal'
      }

      const html = HtmlExportService.generateHTML([customFontModule])

      expect(html).toContain('font-family: Times New Roman, serif')
      expect(html).toContain('font-weight: normal')
    })

    it('应该处理inherit字体时不输出font-family', () => {
      const inheritFontModule = {
        ...mockTitleModule,
        fontFamily: 'inherit'
      }

      const html = HtmlExportService.generateHTML([inheritFontModule])

      expect(html).not.toContain('font-family:')
    })

    it('应该正确转义HTML特殊字符', () => {
      const specialCharsModule = {
        ...mockTitleModule,
        text: '标题 <script>alert("XSS")</script> & 特殊字符'
      }

      const html = HtmlExportService.generateHTML([specialCharsModule])

      expect(html).toContain('&lt;script&gt;')
      expect(html).toContain('&amp;')
      expect(html).not.toContain('<script>')
    })

    it('应该处理多个模块的组合', () => {
      const modules = [mockTitleModule, mockTextModule]
      const html = HtmlExportService.generateHTML(modules)

      expect(html).toContain('<h1 class="pm-title"')
      expect(html).toContain('测试标题')
      expect(html).toContain('<div class="pm-text"')
      expect(html).toContain('这是一段测试文本')
    })

    it('应该正确处理标题模块中的换行符', () => {
      const multiLineTitleModule = {
        ...mockTitleModule,
        text: 'タイトルテキスト'
      }

      const html = HtmlExportService.generateHTML([multiLineTitleModule])

      expect(html).toContain('タイトルテキスト')
      expect(html).not.toContain('タイトルテキスト\n')
    })
  })

  describe('generatePreviewHTML', () => {
    it('应该生成预览HTML', () => {
      const html = generatePreviewHTML([mockTitleModule])

      expect(html).toContain('<h1 class="pm-title"')
      expect(html).toContain('测试标题')
      expect(html).not.toContain('<!DOCTYPE html>')
    })
  })

  describe('便捷函数', () => {
    it('generateHTML函数应该工作正常', () => {
      const html = generateHTML([mockTitleModule])

      expect(html).toContain('<h1 class="pm-title"')
      expect(html).toContain('测试标题')
    })
  })
})
