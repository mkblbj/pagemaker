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
    content: '这是一段测试文本',
    alignment: 'left',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    textColor: '#333333',
    backgroundColor: 'transparent'
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

    it('应该在移动端模式下生成乐天约束的HTML', () => {
      const html = HtmlExportService.generateHTML([mockTitleModule], { mobileMode: true })

      expect(html).toContain('<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">')
      expect(html).toContain('<font size="5" color="#1975B0">') // 标题默认24px对应size="5"
      expect(html).toContain('<b>测试标题</b>')
      expect(html).not.toContain('class=')
      expect(html).not.toContain('style=')
    })

    it('应该在移动端模式下正确处理文本模块', () => {
      const html = HtmlExportService.generateHTML([mockTextModule], { mobileMode: true })

      expect(html).toContain('<p><font size="4" color="#333333">这是一段测试文本</font></p>')
      expect(html).not.toContain('<table')
      expect(html).not.toContain('<div')
      expect(html).not.toContain('class=')
    })

    it('应该正确转换CSS字体大小为HTML font size', () => {
      const testCases = [
        { css: '10px', expected: '1' },
        { css: '12px', expected: '2' },
        { css: '14px', expected: '3' },
        { css: '18px', expected: '4' },
        { css: '24px', expected: '5' },
        { css: '36px', expected: '6' },
        { css: '48px', expected: '7' }
      ]

      testCases.forEach(({ css, expected }) => {
        const titleModule = { ...mockTitleModule, fontSize: css }
        const html = HtmlExportService.generateHTML([titleModule], { mobileMode: true })
        expect(html).toContain(`<font size="${expected}"`)
      })
    })

    it('应该清理HTML内容以符合乐天约束', () => {
      const textModuleWithRichContent = {
        ...mockTextModule,
        content: '<div><strong>加粗文本</strong><span style="color: red;">红色文本</span><u>下划线</u></div>'
      }

      const html = HtmlExportService.generateHTML([textModuleWithRichContent], { mobileMode: true })

      expect(html).toContain('<font size="4" color="#333333"><p><b>加粗文本</b>红色文本下划线</p></font>')
      expect(html).not.toContain('<div>')
      expect(html).not.toContain('<span>')
      expect(html).not.toContain('<strong>')
      expect(html).not.toContain('<u>')
      expect(html).not.toContain('style=')
      expect(html).not.toContain('class=')
    })

    it('应该在移动端模式下正确处理文本对齐', () => {
      const centerTextModule = { ...mockTextModule, alignment: 'center' }
      const rightTextModule = { ...mockTextModule, alignment: 'right' }

      const centerHtml = HtmlExportService.generateHTML([centerTextModule], { mobileMode: true })
      const rightHtml = HtmlExportService.generateHTML([rightTextModule], { mobileMode: true })

      expect(centerHtml).toContain('<p align="center">')
      expect(rightHtml).toContain('<p align="right">')
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
