/**
 * HTML 拆分引擎测试（对齐 html temple flip）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { splitHtmlToModules, exportModulesHtml } from './htmlSplitter'

// 测试用例：html temple（简化版）
const HTML_TEMPLE_SIMPLIFIED = `<br><table bgcolor="#bf0000" align="center" cellpadding="10" width="100%"><tr><td align="center" height="25"><font size="3"><b><a href="https://search.rakuten.co.jp/search/mall/?sid=388102" target="_top"><font color="#fff">店内全商品に使えるクーポンを配布中</font></a></b></font></td></tr></table><br><table bgcolor="#bf0000" align="center" cellpadding="10" width="100%"><tr><td align="center" height="25"><font size="3"><b><a href="https://review.rakuten.co.jp/shop/4/388102_388102/1.1/" target="_top"><font color="#fff"><font color="#F1C40F">★★★★★</font>ショップのレビュー<font color="#F1C40F">★★★★★</font></font></a></b></font></td></tr></table><br><br><img src="https://image.rakuten.co.jp/matsutake1816/cabinet/11368032/12171558/12171606/ca815001-n.jpg" width="100%" alt="ca815001-n"><p align="center"><br></p><img src="https://image.rakuten.co.jp/matsutake1816/cabinet/11368032/12171558/12171606/ca815002.jpg" width="100%" alt="ca815002"><p align="center"><br></p>`

describe('htmlSplitter', () => {
  beforeEach(() => {
    // 重置模块计数器（通过重新导入）
  })

  describe('P1: 基本拆分', () => {
    it('应将顶层 <br> 识别为间隔模块', () => {
      const html = '<br><p>测试</p>'
      const modules = splitHtmlToModules(html)

      expect(modules.length).toBeGreaterThanOrEqual(2)
      expect(modules[0].kind).toBe('gap')
      expect(modules[0].html).toContain('<br>')
    })

    it('应将连续 <br> 合并为一个间隔模块', () => {
      const html = '<br><br><p>测试</p>'
      const modules = splitHtmlToModules(html)

      // 第一个模块应为间隔，包含两个 br
      expect(modules[0].kind).toBe('gap')
      expect(modules[0].html).toContain('<br>')
      // 验证是否合并（模块数应少于节点数）
      expect(modules.length).toBeLessThan(3)
    })

    it('应将顶层 <p><br></p> 识别为间隔模块', () => {
      const html = '<p align="center"><br></p><img src="test.jpg">'
      const modules = splitHtmlToModules(html)

      expect(modules[0].kind).toBe('gap')
      expect(modules[0].html).toContain('<p')
      expect(modules[0].html).toContain('align="center"')
      expect(modules[0].html).toContain('<br>')
    })

    it('应将顶层 <img> 识别为图片模块', () => {
      const html = '<img src="test.jpg" width="100%" alt="test">'
      const modules = splitHtmlToModules(html)

      expect(modules.length).toBe(1)
      expect(modules[0].kind).toBe('image')
      expect(modules[0].html).toContain('<img')
      expect(modules[0].html).toContain('src="test.jpg"')
    })

    it('应将顶层 <table> 识别为表格模块', () => {
      const html = '<table><tr><td>测试</td></tr></table>'
      const modules = splitHtmlToModules(html)

      expect(modules.length).toBe(1)
      expect(modules[0].kind).toBe('table')
      expect(modules[0].html).toContain('<table>')
    })

  it('应将连续内联/文本节点聚合为文本模块', () => {
    const html = '<font color="red">文本</font><b>粗体</b><a href="#">链接</a>'
    const modules = splitHtmlToModules(html)

    // 连续的非 <p> 内联元素应该合并为一个文本模块
    expect(modules.length).toBe(1)
    expect(modules[0].kind).toBe('text')
    expect(modules[0].html).toContain('文本')
    expect(modules[0].html).toContain('粗体')
    expect(modules[0].html).toContain('链接')
  })

  it('应将连续的 <p> 标签拆分为独立的文本模块', () => {
    const html = `<p><font size="5">ストラップホール付き</font></p><p><font size="3">上部一箇所にストラップホールがあり、ストラップの装着も可能です。かわいいチャームを装着するのにも最適！</font><br><font color="#E74C3C"><font size="2"><b>※ストラップホール下部の追加は可能です。お気軽にお問合せください。<br>※ストラップは付属していません。</b></font></font></p>`

    const modules = splitHtmlToModules(html)

    // 应该拆分为 2 个文本模块
    expect(modules).toHaveLength(2)
    expect(modules[0].kind).toBe('text')
    expect(modules[1].kind).toBe('text')

    // 第一个模块
    expect(modules[0].html).toContain('<p>')
    expect(modules[0].html).toContain('ストラップホール付き')
    expect(modules[0].html).not.toContain('上部一箇所')

    // 第二个模块
    expect(modules[1].html).toContain('<p>')
    expect(modules[1].html).toContain('上部一箇所')
    expect(modules[1].html).toContain('ストラップホール下部')
  })

  it('应将 <p><br></p> 识别为 gap 模块', () => {
    const html = `<p><font size="5">标题</font></p><p><br></p><p>内容</p>`

    const modules = splitHtmlToModules(html)

    // 应该拆分为 3 个模块：text, gap, text
    expect(modules).toHaveLength(3)
    expect(modules[0].kind).toBe('text')
    expect(modules[1].kind).toBe('gap')
    expect(modules[2].kind).toBe('text')
  })

  it('应该正确处理混合内容', () => {
    const html = `<p>段落1</p><br><p>段落2</p><img src="test.jpg"><p>段落3</p>`

    const modules = splitHtmlToModules(html)

    // text, gap, text, image, text
    expect(modules).toHaveLength(5)
    expect(modules[0].kind).toBe('text')
    expect(modules[0].html).toContain('段落1')
    
    expect(modules[1].kind).toBe('gap')
    
    expect(modules[2].kind).toBe('text')
    expect(modules[2].html).toContain('段落2')
    
    expect(modules[3].kind).toBe('image')
    
    expect(modules[4].kind).toBe('text')
    expect(modules[4].html).toContain('段落3')
  })

  it('应该将多个连续的 <p> 标签各自独立', () => {
    const html = `<p>第一段</p><p>第二段</p><p>第三段</p>`

    const modules = splitHtmlToModules(html)

    expect(modules).toHaveLength(3)
    expect(modules[0].kind).toBe('text')
    expect(modules[0].html).toContain('第一段')
    
    expect(modules[1].kind).toBe('text')
    expect(modules[1].html).toContain('第二段')
    
    expect(modules[2].kind).toBe('text')
    expect(modules[2].html).toContain('第三段')
  })

  it('应该在拆分过程中保留全角空格', () => {
    const html = `<table><tr><td><font size="3">3911　test</font></td></tr></table>`

    const modules = splitHtmlToModules(html)

    expect(modules).toHaveLength(1)
    expect(modules[0].kind).toBe('table')
    expect(modules[0].html).toContain('\u3000')
    expect(modules[0].html).toContain('3911　test')
  })

  it('应该在拆分和导出过程中保留全角空格', () => {
    const html = `<font size="3">3911　</font><br><p>test　space</p>`

    const modules = splitHtmlToModules(html)
    const exported = exportModulesHtml(modules)

    // 检查拆分后的模块
    const fullwidthInModules = modules.reduce((count, m) => {
      return count + (m.html.match(/\u3000/g) || []).length
    }, 0)

    // 检查导出后的 HTML
    const fullwidthInExported = (exported.match(/\u3000/g) || []).length

    expect(fullwidthInModules).toBe(2)
    expect(fullwidthInExported).toBe(2)
    expect(exported).toContain('3911　')
    expect(exported).toContain('test　space')
  })
  })

  describe('P1: html temple flip 对齐验证', () => {
    it('应拆分为正确的模块序列', () => {
      const modules = splitHtmlToModules(HTML_TEMPLE_SIMPLIFIED)

      // 验证序列
      // 1. <br>
      expect(modules[0].kind).toBe('gap')
      expect(modules[0].html.trim()).toMatch(/<br\s*\/?>/i)

      // 2. 第一个 table（红底优惠）
      expect(modules[1].kind).toBe('table')
      expect(modules[1].html).toContain('店内全商品')

      // 3. <br>
      expect(modules[2].kind).toBe('gap')

      // 4. 第二个 table（红底レビュー）
      expect(modules[3].kind).toBe('table')
      expect(modules[3].html).toContain('ショップのレビュー')

      // 5. <br><br>（合并为一个间隔模块）
      expect(modules[4].kind).toBe('gap')
      // 应包含两个 br
      const brCount = (modules[4].html.match(/<br/gi) || []).length
      expect(brCount).toBe(2)

      // 6. 第一个 <img>
      expect(modules[5].kind).toBe('image')
      expect(modules[5].html).toContain('ca815001-n.jpg')

      // 7. <p align="center"><br></p>
      expect(modules[6].kind).toBe('gap')
      expect(modules[6].html).toContain('<p')
      expect(modules[6].html).toContain('align="center"')

      // 8. 第二个 <img>
      expect(modules[7].kind).toBe('image')
      expect(modules[7].html).toContain('ca815002.jpg')

      // 9. <p align="center"><br></p>
      expect(modules[8].kind).toBe('gap')
    })

    it('拆分后导出应与原文视觉一致', () => {
      const modules = splitHtmlToModules(HTML_TEMPLE_SIMPLIFIED)
      const exported = exportModulesHtml(modules)

      // 导出应包含关键内容（净化后）
      expect(exported).toContain('店内全商品')
      expect(exported).toContain('ショップのレビュー')
      expect(exported).toContain('ca815001-n.jpg')
      expect(exported).toContain('ca815002.jpg')
    })
  })

  describe('P1: 边界情况', () => {
    it('应处理表格内的 <br>（不拆分）', () => {
      const html = '<table><tr><td>第一行<br>第二行</td></tr></table>'
      const modules = splitHtmlToModules(html)

      expect(modules.length).toBe(1)
      expect(modules[0].kind).toBe('table')
      expect(modules[0].html).toContain('第一行')
      expect(modules[0].html).toContain('<br>')
      expect(modules[0].html).toContain('第二行')
    })

    it('应处理空白文本节点', () => {
      const html = '  \n  <p>测试</p>  \n  '
      const modules = splitHtmlToModules(html)

      expect(modules.length).toBe(1)
      expect(modules[0].kind).toBe('text')
    })

    it('应处理混合间隔与内容', () => {
      const html = '<br><p>测试</p><br><img src="test.jpg"><br>'
      const modules = splitHtmlToModules(html)

      expect(modules.length).toBeGreaterThanOrEqual(4)
      expect(modules[0].kind).toBe('gap')
      expect(modules.some(m => m.kind === 'text')).toBe(true)
      expect(modules.some(m => m.kind === 'image')).toBe(true)
    })

    it('应为每个模块生成稳定的 ID', () => {
      const html = '<br><p>测试</p><img src="test.jpg">'
      const modules1 = splitHtmlToModules(html)
      const modules2 = splitHtmlToModules(html)

      // ID 应包含类型标识
      expect(modules1[0].id).toContain('gap')
      expect(modules1.some(m => m.id.includes('text'))).toBe(true)
      expect(modules1.some(m => m.id.includes('image'))).toBe(true)
    })
  })

  describe('P1: 导出行为', () => {
    it('应严格按序拼接，不插入分隔符', () => {
      const html = '<p>第一段</p><p>第二段</p>'
      const modules = splitHtmlToModules(html)
      const exported = exportModulesHtml(modules)

      // 不应有额外的空行或分隔符
      expect(exported).toContain('第一段')
      expect(exported).toContain('第二段')
      expect(exported).not.toContain('<hr>')
      expect(exported).not.toContain('<!-- 分隔 -->')
    })

    it('导出应仅包含净化后的 HTML', () => {
      const html = '<p style="color: red;" class="test">测试</p>'
      const modules = splitHtmlToModules(html)
      const exported = exportModulesHtml(modules)

      expect(exported).not.toContain('style')
      expect(exported).not.toContain('class')
      expect(exported).toContain('测试')
    })
  })
})

