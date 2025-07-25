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

  const mockSeparatorModule: PageModule = {
    id: 'separator-1',
    type: PageModuleType.SEPARATOR,
    separatorType: 'line',
    lineStyle: 'solid',
    lineColor: '#e5e7eb',
    lineThickness: 1
  }

  const mockSpaceSeparatorModule: PageModule = {
    id: 'separator-2',
    type: PageModuleType.SEPARATOR,
    separatorType: 'space',
    spaceHeight: 'medium'
  }

  const mockKeyValueModule: PageModule = {
    id: 'keyvalue-1',
    type: PageModuleType.KEY_VALUE,
    rows: [
      { key: '产品名称', value: '测试产品' },
      { key: '价格', value: '¥999' }
    ],
    labelBackgroundColor: '#f3f4f6',
    textColor: '#374151'
  }

  const mockMultiColumnModule: PageModule = {
    id: 'multicolumn-1',
    type: PageModuleType.MULTI_COLUMN,
    layout: 'imageLeft',
    imageConfig: {
      src: 'https://example.com/image.jpg',
      alt: '测试图片',
      alignment: 'center',
      width: '50%',
      link: {
        type: 'url',
        value: 'https://example.com'
      }
    },
    textConfig: {
      content: '<p>这是测试文本内容</p>',
      alignment: 'left',
      font: 'Arial',
      fontSize: '16px',
      color: '#333333',
      backgroundColor: 'transparent'
    }
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

    it('应该正确处理键值对模块', () => {
      const html = HtmlExportService.generateHTML([mockKeyValueModule])

      expect(html).toContain('<table class="pm-key-value"')
      expect(html).toContain('产品名称')
      expect(html).toContain('测试产品')
      expect(html).toContain('价格')
      expect(html).toContain('¥999')
      expect(html).toContain('background-color: #f3f4f6')
      expect(html).toContain('color: #374151')
    })

    it('应该在移动端模式下正确处理键值对模块', () => {
      const html = HtmlExportService.generateHTML([mockKeyValueModule], { mobileMode: true })

      expect(html).toContain('<table width="100%" cellpadding="8" cellspacing="1" border="0">')
      expect(html).toContain('bgcolor="#f3f4f6"')
      expect(html).toContain('bgcolor="#ffffff"')
      expect(html).toContain('<font color="#374151">')
      expect(html).toContain('width="30%"')
      expect(html).toContain('width="70%"')
      expect(html).toContain('align="left"')
      expect(html).toContain('valign="top"')
      expect(html).toContain('产品名称')
      expect(html).toContain('测试产品')
      // 确保没有不被允许的style属性
      expect(html).not.toContain('style=')
    })

    it('应该处理空的键值对模块', () => {
      const emptyKeyValueModule = {
        ...mockKeyValueModule,
        rows: []
      }

      const html = HtmlExportService.generateHTML([emptyKeyValueModule])

      expect(html).toContain('<!-- 键值对模块：无数据 -->')
    })

    it('应该向后兼容items属性', () => {
      const { rows, ...moduleWithoutRows } = mockKeyValueModule
      const legacyModule = {
        ...moduleWithoutRows,
        items: [{ key: '旧键', value: '旧值' }]
      }

      const html = HtmlExportService.generateHTML([legacyModule as any])

      expect(html).toContain('旧键')
      expect(html).toContain('旧值')
    })

    it('应该正确处理多行文本在键值对中', () => {
      const multilineModule = {
        ...mockKeyValueModule,
        rows: [{ key: '描述', value: '第一行\n第二行\n第三行' }]
      }

      const html = HtmlExportService.generateHTML([multilineModule])

      expect(html).toContain('第一行<br>第二行<br>第三行')
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

    it('应该正确生成线条分隔模块的HTML', () => {
      const html = HtmlExportService.generateHTML([mockSeparatorModule])

      expect(html).toContain('<hr class="pm-separator-line"')
      expect(html).toContain('border-top: 1px solid #e5e7eb')
      expect(html).toContain('width: 100%')
      expect(html).toContain('margin: 16px 0')
    })

    it('应该正确生成空白间距分隔模块的HTML', () => {
      const html = HtmlExportService.generateHTML([mockSpaceSeparatorModule])

      expect(html).toContain('<div class="pm-separator-space"')
      expect(html).toContain('height: 40px')
      expect(html).toContain('width: 100%')
    })

    it('应该在移动端模式下正确生成线条分隔模块', () => {
      const html = HtmlExportService.generateHTML([mockSeparatorModule], { mobileMode: true })

      // 实线应该使用hr标签
      expect(html).toContain('<hr color="#e5e7eb" size="1">')
    })

    it('应该在移动端模式下正确生成虚线分隔模块', () => {
      const dashedSeparatorModule = {
        ...mockSeparatorModule,
        lineStyle: 'dashed',
        lineColor: '#ff0000',
        lineThickness: 2
      }

      const html = HtmlExportService.generateHTML([dashedSeparatorModule], { mobileMode: true })

      // 虚线应该使用table+border实现
      expect(html).toContain('<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">')
      expect(html).toContain('border-top: 2px dashed #ff0000')
      expect(html).toContain('height: 0; line-height: 0; font-size: 0;')
    })

    it('应该在移动端模式下正确生成点线分隔模块', () => {
      const dottedSeparatorModule = {
        ...mockSeparatorModule,
        lineStyle: 'dotted',
        lineColor: '#0000ff',
        lineThickness: 3
      }

      const html = HtmlExportService.generateHTML([dottedSeparatorModule], { mobileMode: true })

      // 点线应该使用table+border实现
      expect(html).toContain('<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">')
      expect(html).toContain('border-top: 3px dotted #0000ff')
      expect(html).toContain('height: 0; line-height: 0; font-size: 0;')
    })

    it('应该在移动端模式下正确生成空白间距分隔模块', () => {
      const html = HtmlExportService.generateHTML([mockSpaceSeparatorModule], { mobileMode: true })

      expect(html).toContain('<table width="100%" cellpadding="0" cellspacing="0" border="0" align="center">')
      expect(html).toContain('<td height="40px">&nbsp;</td>')
      expect(html).not.toContain('<div')
    })

    it('应该支持不同的分隔模块配置', () => {
      const customSeparatorModule = {
        ...mockSeparatorModule,
        lineStyle: 'dashed',
        lineColor: '#ff0000',
        lineThickness: 3
      }

      const html = HtmlExportService.generateHTML([customSeparatorModule])

      expect(html).toContain('border-top: 3px dashed #ff0000')
    })

    it('应该支持不同的空白间距高度', () => {
      const testCases = [
        { spaceHeight: 'small', expectedHeight: '20px' },
        { spaceHeight: 'medium', expectedHeight: '40px' },
        { spaceHeight: 'large', expectedHeight: '60px' },
        { spaceHeight: 'extra-large', expectedHeight: '80px' }
      ]

      testCases.forEach(({ spaceHeight, expectedHeight }) => {
        const spaceModule = {
          ...mockSpaceSeparatorModule,
          spaceHeight
        }

        const html = HtmlExportService.generateHTML([spaceModule])
        expect(html).toContain(`height: ${expectedHeight}`)
      })
    })

    it('应该正确生成多列图文模块的HTML（标准版本）', () => {
      const html = HtmlExportService.generateHTML([mockMultiColumnModule])

      expect(html).toContain('<style>')
      expect(html).toContain('.pm-multi-column')
      expect(html).toContain('flex-direction: row')
      expect(html).toContain('@media (max-width: 768px)')
      expect(html).toContain('<div class="pm-multi-column">')
      expect(html).toContain('<div class="pm-multi-column-image"')
      expect(html).toContain('<div class="pm-multi-column-text"')
      expect(html).toContain('src="https://example.com/image.jpg"')
      expect(html).toContain('alt="测试图片"')
      expect(html).toContain('href="https://example.com"')
      expect(html).toContain('<p>这是测试文本内容</p>')
    })

    it('应该正确生成多列图文模块的HTML（移动端版本）', () => {
      const html = HtmlExportService.generateHTML([mockMultiColumnModule], { mobileMode: true })

      expect(html).toContain('<table width="100%" cellspacing="0" cellpadding="10"')
      expect(html).toContain('src="https://example.com/image.jpg"')
      expect(html).toContain('alt="测试图片"')
      expect(html).toContain('href="https://example.com"')
      expect(html).toContain('<font size="4" color="#333333">')
      expect(html).toContain('width="49%"') // 水平布局应该有列宽
      expect(html).not.toContain('<style>')
      expect(html).not.toContain('flex-direction')
    })

    it('应该正确处理不同的多列布局类型', () => {
      const textLeftModule: PageModule = {
        ...mockMultiColumnModule,
        layout: 'textLeft'
      }
      const imageTopModule: PageModule = {
        ...mockMultiColumnModule,
        layout: 'imageTop'
      }

      const textLeftHtml = HtmlExportService.generateHTML([textLeftModule])
      const imageTopHtml = HtmlExportService.generateHTML([imageTopModule])

      expect(textLeftHtml).toContain('flex-direction: row')
      expect(imageTopHtml).toContain('flex-direction: column')
    })

    it('应该正确处理移动端不同布局类型', () => {
      const imageLeftModule: PageModule = {
        ...mockMultiColumnModule,
        layout: 'imageLeft'
      }
      const textLeftModule: PageModule = {
        ...mockMultiColumnModule,
        layout: 'textLeft'
      }
      const imageTopModule: PageModule = {
        ...mockMultiColumnModule,
        layout: 'imageTop'
      }
      const textTopModule: PageModule = {
        ...mockMultiColumnModule,
        layout: 'textTop'
      }

      const imageLeftHtml = HtmlExportService.generateHTML([imageLeftModule], { mobileMode: true })
      const textLeftHtml = HtmlExportService.generateHTML([textLeftModule], { mobileMode: true })
      const imageTopHtml = HtmlExportService.generateHTML([imageTopModule], { mobileMode: true })
      const textTopHtml = HtmlExportService.generateHTML([textTopModule], { mobileMode: true })

      // 水平布局（图左文右）应该使用单行双列表格
      expect(imageLeftHtml).toContain('<tr align="center">')
      expect(imageLeftHtml).toContain('width="49%"')
      // 不应该包含乐天不支持的tbody标签
      expect(imageLeftHtml).not.toContain('<tbody>')
      expect(imageLeftHtml).not.toContain('</tbody>')
      // 默认情况下不应该有背景色
      expect(imageLeftHtml).not.toContain('bgcolor="#fff"')
      expect(imageLeftHtml).not.toContain('bgcolor="#f5f5f5"')

      // 水平布局（文左图右）应该交换位置
      expect(textLeftHtml).toContain('<tr align="center">')
      expect(textLeftHtml).toContain('width="49%"')

      // 垂直布局应该使用多行表格
      expect(imageTopHtml).not.toContain('width="49%"')
      expect(imageTopHtml).toContain('<tr>')
      expect(textTopHtml).not.toContain('width="49%"')
      expect(textTopHtml).toContain('<tr>')
    })

    it('应该正确处理移动端背景色设置', () => {
      const moduleWithBgColor: PageModule = {
        ...mockMultiColumnModule,
        layout: 'imageLeft',
        textConfig: {
          ...(mockMultiColumnModule as any).textConfig,
          backgroundColor: '#ffeeee'
        }
      }

      const moduleWithoutBgColor: PageModule = {
        ...mockMultiColumnModule,
        layout: 'imageLeft',
        textConfig: {
          ...(mockMultiColumnModule as any).textConfig,
          backgroundColor: 'transparent'
        }
      }

      const htmlWithBg = HtmlExportService.generateHTML([moduleWithBgColor], { mobileMode: true })
      const htmlWithoutBg = HtmlExportService.generateHTML([moduleWithoutBgColor], { mobileMode: true })

      // 有背景色时应该显示
      expect(htmlWithBg).toContain('bgcolor="#ffeeee"')

      // 透明背景时不应该有bgcolor属性
      expect(htmlWithoutBg).not.toContain('bgcolor=')
    })

    it('应该正确处理多列图文模块的空内容', () => {
      const emptyModule: PageModule = {
        ...mockMultiColumnModule,
        imageConfig: { src: '', alt: '', alignment: 'center', width: '50%' },
        textConfig: {
          content: '',
          alignment: 'left',
          font: 'inherit',
          fontSize: '14px',
          color: '#000000',
          backgroundColor: 'transparent'
        }
      }

      const html = HtmlExportService.generateHTML([emptyModule])
      const mobileHtml = HtmlExportService.generateHTML([emptyModule], { mobileMode: true })

      expect(html).toContain('多列图文模块：内容未设置')
      expect(mobileHtml).toContain('多列图文模块：内容未设置')
    })

    it('应该正确处理多列图文模块的图片链接类型', () => {
      const emailLinkModule: PageModule = {
        ...mockMultiColumnModule,
        imageConfig: {
          ...(mockMultiColumnModule as any).imageConfig,
          link: {
            type: 'email',
            value: 'test@example.com'
          }
        }
      }

      const phoneLinkModule: PageModule = {
        ...mockMultiColumnModule,
        imageConfig: {
          ...(mockMultiColumnModule as any).imageConfig,
          link: {
            type: 'phone',
            value: '+86 138 0013 8000'
          }
        }
      }

      const emailHtml = HtmlExportService.generateHTML([emailLinkModule])
      const phoneHtml = HtmlExportService.generateHTML([phoneLinkModule])

      expect(emailHtml).toContain('href="mailto:test@example.com"')
      expect(phoneHtml).toContain('href="tel:+86 138 0013 8000"')
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
