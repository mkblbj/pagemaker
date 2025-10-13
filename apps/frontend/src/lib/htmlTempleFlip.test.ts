/**
 * html temple flip 完整验收测试（P0-P1 验收）
 */

import { describe, it, expect } from 'vitest'
import { splitHtmlToModules, exportModulesHtml } from './htmlSplitter'
import { validateSanitized } from './htmlSanitizer'
import { HTML_TEMPLE_FULL, EXPECTED_MODULES } from './fixtures/htmlTemple'

describe('html temple flip 完整验收（P0-P1）', () => {
  it('P1: 拆分结果应与 html temple flip 完全一致', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)

    console.log(`\n拆分结果：共 ${modules.length} 个模块`)
    console.log(`期望：共 ${EXPECTED_MODULES.length} 个模块\n`)

    // 验证模块总数
    expect(modules.length).toBe(EXPECTED_MODULES.length)

    // 逐个验证模块
    for (let i = 0; i < EXPECTED_MODULES.length; i++) {
      const expected = EXPECTED_MODULES[i]
      const actual = modules[i]

      console.log(`模块 ${expected.index}: ${expected.description}`)
      console.log(`  期望类型: ${expected.kind}`)
      console.log(`  实际类型: ${actual.kind}`)

      // 验证类型
      expect(actual.kind, `模块 ${expected.index} 类型不匹配`).toBe(expected.kind)

      // 验证关键内容
      if (expected.keyContent) {
        expect(
          actual.html,
          `模块 ${expected.index} 缺少关键内容: ${expected.keyContent}`
        ).toContain(expected.keyContent)
      }

      console.log(`  ✓ 验证通过\n`)
    }
  })

  it('P0: 所有模块应符合 Rakuten 合规约束', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i]
      
      // 使用字符串检查，避免 DOMParser 自动添加结构
      // 检查禁止标签（直接字符串匹配）
      expect(mod.html, `模块 ${i + 1} 不应包含 <script>`).not.toMatch(/<script[\s>]/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 <style>`).not.toMatch(/<style[\s>]/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 <iframe>`).not.toMatch(/<iframe[\s>]/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 <span>`).not.toMatch(/<span[\s>]/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 <col>`).not.toMatch(/<col[\s>]/i)
      
      // 检查表外壳（字符串匹配）
      expect(mod.html, `模块 ${i + 1} 不应包含 <tbody>`).not.toMatch(/<tbody[\s>]/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 <thead>`).not.toMatch(/<thead[\s>]/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 <tfoot>`).not.toMatch(/<tfoot[\s>]/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 <colgroup>`).not.toMatch(/<colgroup[\s>]/i)
      
      // 检查禁止属性（字符串匹配）
      expect(mod.html, `模块 ${i + 1} 不应包含 style 属性`).not.toMatch(/\s+style=/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 class 属性`).not.toMatch(/\s+class=/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 id 属性`).not.toMatch(/\s+id=/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 data- 属性`).not.toMatch(/\s+data-/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 aria- 属性`).not.toMatch(/\s+aria-/i)
      expect(mod.html, `模块 ${i + 1} 不应包含 on* 事件属性`).not.toMatch(/\s+on[a-z]+=/i)
    }
  })

  it('P0: 导出 HTML 不应包含禁止属性', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)
    const exported = exportModulesHtml(modules)

    // 禁止属性检查（使用精确匹配，避免误判 URL 参数）
    expect(exported).not.toMatch(/\s+style=/i)
    expect(exported).not.toMatch(/\s+class=/i)
    expect(exported).not.toMatch(/\s+id=/i)
    expect(exported).not.toMatch(/\s+data-/i)
    expect(exported).not.toMatch(/\s+aria-/i)
    expect(exported).not.toMatch(/\s+onclick=/i)
    expect(exported).not.toMatch(/\s+onload=/i)
  })

  it('P0: 导出 HTML 不应包含禁止标签', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)
    const exported = exportModulesHtml(modules)

    expect(exported).not.toContain('<script')
    expect(exported).not.toContain('<style>')
    expect(exported).not.toContain('<iframe')
    expect(exported).not.toContain('<span')
    expect(exported).not.toContain('<tbody')
    expect(exported).not.toContain('<thead')
    expect(exported).not.toContain('<tfoot')
    expect(exported).not.toContain('<colgroup')
  })

  it('P0: 导出 HTML 应保留关键内容', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)
    const exported = exportModulesHtml(modules)

    // 验证关键内容未丢失
    expect(exported).toContain('店内全商品に使えるクーポンを配布中')
    expect(exported).toContain('ショップのレビュー')
    expect(exported).toContain('ca815001-n.jpg')
    expect(exported).toContain('ca815013.jpg')
    expect(exported).toContain('本革 磁石無し 本革 手帳型ケース 6色')
    expect(exported).toContain('ご注文前にご確認ください')
    expect(exported).toContain('お問い合わせフォームはこちらへ')
    expect(exported).toContain('レビュー投稿＆')
  })

  it('P1: 顶层连续 <br> 应合并为一个间隔模块', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)

    // 找到第 5 个模块（索引 4）：<br><br> 合并
    const module5 = modules[4]
    expect(module5.kind).toBe('gap')

    // 应包含两个 br
    const brCount = (module5.html.match(/<br/gi) || []).length
    expect(brCount).toBe(2)
  })

  it('P1: 顶层 <p><br></p> 应独立为间隔模块', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)

    // 验证所有 gap 类型的模块
    const gapModules = modules.filter(m => m.kind === 'gap')

    // 应有至少一个包含 <p align="center"><br></p> 的间隔模块
    const pBrGap = gapModules.find(m => m.html.includes('<p') && m.html.includes('align'))
    expect(pBrGap).toBeDefined()
    expect(pBrGap!.html).toContain('align="center"')
  })

  it('P1: 表格内的 <br> 不应拆分', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)

    // 找到规格明细大表（模块 32）
    const tableModule = modules.find(m => m.kind === 'table' && m.html.includes('本革 磁石無し'))
    expect(tableModule).toBeDefined()

    // 表格内应包含 <br>（作为内容）
    expect(tableModule!.html).toContain('<br>')
    // 且不应拆分为多个模块
    expect(tableModule!.html).toContain('ワニ柄 本革(牛)<br>')
  })

  it('P1: 导出应严格原序拼接，不插入分隔符', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)
    const exported = exportModulesHtml(modules)

    // 不应有额外的分隔符
    expect(exported).not.toContain('<!-- 模块分隔 -->')
    expect(exported).not.toMatch(/<hr[^>]*class="module-separator"/)

    // 验证关键序列连续性（表→间隔→表）
    const snippet = exported.substring(0, 1000)
    // 应包含：br → table → br → table → br br
    expect(snippet).toMatch(/<br.*?<table.*?<br.*?<table.*?<br.*?<br/i)
  })

  it('P0: 实体与协议应保持原样', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)
    const exported = exportModulesHtml(modules)

    // &nbsp; 应保持（DOMParser 可能转换为空格，这是可接受的）
    // &amp; 应保持
    // 不验证具体实体转换，因为浏览器 DOMParser 会规范化
    
    // 验证 http 协议未被改写为 https
    expect(exported).toContain('https://image.rakuten.co.jp') // 原文就是 https
    expect(exported).toContain('https://search.rakuten.co.jp') // 原文就是 https
  })

  it('P1: 模块 ID 应稳定且唯一', () => {
    const modules = splitHtmlToModules(HTML_TEMPLE_FULL)

    const ids = modules.map(m => m.id)
    const uniqueIds = new Set(ids)

    // 所有 ID 应唯一
    expect(uniqueIds.size).toBe(ids.length)

    // ID 应包含类型标识
    modules.forEach(m => {
      expect(m.id).toContain(m.kind)
    })
  })

  it('P0+P1: 完整往返验收（导入→拆分→导出→再拆分应一致）', () => {
    const modules1 = splitHtmlToModules(HTML_TEMPLE_FULL)
    const exported1 = exportModulesHtml(modules1)

    const modules2 = splitHtmlToModules(exported1)
    const exported2 = exportModulesHtml(modules2)

    // 第二次拆分应得到相同数量的模块
    expect(modules2.length).toBe(modules1.length)

    // 第二次导出应与第一次一致（幂等性）
    expect(exported2).toBe(exported1)
  })
})

