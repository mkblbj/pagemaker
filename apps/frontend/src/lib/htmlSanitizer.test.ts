/**
 * HTML 净化工具测试
 */

import { describe, it, expect } from 'vitest'
import { sanitizeHtml, validateSanitized } from './htmlSanitizer'

describe('htmlSanitizer', () => {
  describe('P0: 基本净化', () => {
    it('应移除 style 属性', () => {
      const input = '<p style="color: red;">测试</p>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('style')
      expect(output).toContain('<p>测试</p>')
    })

    it('应移除 class 属性', () => {
      const input = '<div class="test">测试</div>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('class')
    })

    it('应移除 id 属性', () => {
      const input = '<span id="test">测试</span>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('id')
    })

    it('应移除 data-* 属性', () => {
      const input = '<p data-test="value">测试</p>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('data-')
    })

    it('应移除 aria-* 属性', () => {
      const input = '<button aria-label="test">测试</button>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('aria-')
    })

    it('应移除 on* 事件属性', () => {
      const input = '<button onclick="alert()">测试</button>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('onclick')
    })
  })

  describe('P0: 禁止标签移除', () => {
    it('应移除 script 标签并保留内容', () => {
      const input = '<p>测试<script>alert()</script>内容</p>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<script')
      expect(output).toContain('测试')
      expect(output).toContain('内容')
    })

    it('应移除 style 标签', () => {
      const input = '<style>.test{}</style><p>测试</p>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<style')
      expect(output).toContain('<p>测试</p>')
    })

    it('应移除 iframe 标签', () => {
      const input = '<iframe src="test"></iframe><p>测试</p>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<iframe')
    })

    it('应移除 span 标签但保留内容', () => {
      const input = '<p><span>测试</span>内容</p>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<span')
      expect(output).toContain('测试内容')
    })
  })

  describe('P0: 表格外壳提升', () => {
    it('应提升 tbody 的行到 table', () => {
      const input = '<table><tbody><tr><td>测试</td></tr></tbody></table>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<tbody')
      expect(output).toContain('<table>')
      expect(output).toContain('<tr>')
    })

    it('应提升 thead 的行到 table', () => {
      const input = '<table><thead><tr><th>标题</th></tr></thead></table>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<thead')
      expect(output).toContain('<table>')
      expect(output).toContain('<tr>')
    })

    it('应提升 tfoot 的行到 table', () => {
      const input = '<table><tfoot><tr><td>脚注</td></tr></tfoot></table>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<tfoot')
    })

    it('应移除 colgroup', () => {
      const input = '<table><colgroup><col /></colgroup><tr><td>测试</td></tr></table>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<colgroup')
      expect(output).not.toContain('<col')
    })
  })

  describe('P0: 白名单标签保留', () => {
    it('应保留 table/tr/td/th', () => {
      const input = '<table><tr><th>标题</th><td>内容</td></tr></table>'
      const output = sanitizeHtml(input)
      expect(output).toContain('<table>')
      expect(output).toContain('<tr>')
      expect(output).toContain('<th>')
      expect(output).toContain('<td>')
    })

    it('应保留 p/br/font/b', () => {
      const input = '<p><font color="red"><b>测试</b></font><br></p>'
      const output = sanitizeHtml(input)
      expect(output).toContain('<p>')
      expect(output).toContain('<font')
      expect(output).toContain('<b>')
      expect(output).toContain('<br>')
    })

    it('应保留 img 及其白名单属性', () => {
      const input = '<img src="test.jpg" alt="测试" width="100%" class="test" />'
      const output = sanitizeHtml(input)
      expect(output).toContain('<img')
      expect(output).toContain('src="test.jpg"')
      expect(output).toContain('alt="测试"')
      expect(output).toContain('width="100%"')
      expect(output).not.toContain('class')
    })

    it('应保留 a 标签及其白名单属性', () => {
      const input = '<a href="test.html" target="_blank" class="link">链接</a>'
      const output = sanitizeHtml(input)
      expect(output).toContain('<a')
      expect(output).toContain('href="test.html"')
      expect(output).toContain('target="_blank"')
      expect(output).not.toContain('class')
    })
  })

  describe('P0: 实体与协议不改写', () => {
    it('应保持实体原样', () => {
      const input = '<p>&nbsp;&amp;lt;&gt;</p>'
      const output = sanitizeHtml(input)
      expect(output).toContain('&nbsp;')
    })

    it('应保持 http 协议原样', () => {
      const input = '<a href="http://example.com">链接</a>'
      const output = sanitizeHtml(input)
      expect(output).toContain('http://example.com')
    })
  })

  describe('P0: 验证函数', () => {
    it('合规 HTML 应返回空错误列表', () => {
      const html = '<p><b>测试</b></p>'
      const errors = validateSanitized(html)
      expect(errors).toHaveLength(0)
    })

    it('应检测禁止标签', () => {
      const html = '<p><span>测试</span></p>'
      const errors = validateSanitized(html)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('span')
    })

    it('应检测禁止属性', () => {
      const html = '<p style="color: red;">测试</p>'
      const errors = validateSanitized(html)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('style')
    })

    it('应检测表外壳', () => {
      const html = '<table><tbody><tr><td>测试</td></tr></tbody></table>'
      const errors = validateSanitized(html)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('tbody')
    })
  })

  describe('全角空格保留', () => {
    it('应该保留全角空格（U+3000）', () => {
      const html = '<font size="3">3911　test</font>'
      const result = sanitizeHtml(html)
      
      expect(result).toContain('\u3000')
      expect(result).toContain('3911　test')
    })

    it('应该保留表格中的全角空格', () => {
      const html = '<table><tr><td>3911　</td></tr></table>'
      const result = sanitizeHtml(html)
      
      expect(result).toContain('\u3000')
      expect(result).toContain('3911　')
    })

    it('应该保留多个全角空格', () => {
      const html = '<p>test　space　multiple</p>'
      const result = sanitizeHtml(html)
      
      const originalCount = (html.match(/\u3000/g) || []).length
      const resultCount = (result.match(/\u3000/g) || []).length
      
      expect(resultCount).toBe(originalCount)
      expect(resultCount).toBe(2)
    })
  })
})

