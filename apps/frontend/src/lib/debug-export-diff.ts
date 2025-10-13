/**
 * 调试：分析导出长度差异
 */

import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.DOMParser = dom.window.DOMParser as any
global.document = dom.window.document as any
global.Node = dom.window.Node as any
global.Element = dom.window.Element as any
global.HTMLElement = dom.window.HTMLElement as any

import { splitHtmlToModules, exportModulesHtml } from './htmlSplitter'
import { mountEditor, exportSelectedModules } from './moduleRenderer'
import { HTML_TEMPLE_FULL } from './fixtures/htmlTemple'

console.log('========================================')
console.log('🔍 导出长度差异分析')
console.log('========================================\n')

// 1. 原始输入
console.log('📥 原始输入')
console.log(`长度: ${HTML_TEMPLE_FULL.length} 字符\n`)

// 2. P1 拆分后直接导出
console.log('📤 P1 直接导出（splitHtmlToModules + exportModulesHtml）')
const modules = splitHtmlToModules(HTML_TEMPLE_FULL)
const p1Export = exportModulesHtml(modules)
console.log(`长度: ${p1Export.length} 字符`)
console.log(`差异: ${p1Export.length - HTML_TEMPLE_FULL.length} 字符\n`)

// 3. P2 渲染后导出
console.log('📤 P2 渲染后导出（mountEditor + exportSelectedModules）')
const container = document.createElement('div')
const state = mountEditor(container, modules)
const p2Export = exportSelectedModules(container, state)
console.log(`长度: ${p2Export.length} 字符`)
console.log(`差异: ${p2Export.length - HTML_TEMPLE_FULL.length} 字符\n`)

// 4. 对比分析
console.log('🔍 差异分析')
console.log(`P1 vs 原始: ${p1Export.length - HTML_TEMPLE_FULL.length}`)
console.log(`P2 vs 原始: ${p2Export.length - HTML_TEMPLE_FULL.length}`)
console.log(`P2 vs P1: ${p2Export.length - p1Export.length}\n`)

// 5. 详细检查
console.log('📊 详细检查')

// 检查 img 标签
const inputImg = (HTML_TEMPLE_FULL.match(/<img[^>]*>/g) || []).length
const p1Img = (p1Export.match(/<img[^>]*>/g) || []).length
const p2Img = (p2Export.match(/<img[^>]*>/g) || []).length
console.log(`\nimg 标签数量:`)
console.log(`  原始: ${inputImg}`)
console.log(`  P1: ${p1Img}`)
console.log(`  P2: ${p2Img}`)

// 检查自闭合标签格式
const inputImgSelfClose = (HTML_TEMPLE_FULL.match(/<img[^>]*\/>/g) || []).length
const p1ImgSelfClose = (p1Export.match(/<img[^>]*\/>/g) || []).length
const p2ImgSelfClose = (p2Export.match(/<img[^>]*\/>/g) || []).length
console.log(`\nimg 自闭合格式 (/>):`)
console.log(`  原始: ${inputImgSelfClose}`)
console.log(`  P1: ${p1ImgSelfClose}`)
console.log(`  P2: ${p2ImgSelfClose}`)

// 检查 br 标签
const inputBr = (HTML_TEMPLE_FULL.match(/<br>/g) || []).length
const p1Br = (p1Export.match(/<br>/g) || []).length
const p2Br = (p2Export.match(/<br>/g) || []).length
console.log(`\nbr 标签 (<br>):`)
console.log(`  原始: ${inputBr}`)
console.log(`  P1: ${p1Br}`)
console.log(`  P2: ${p2Br}`)

// 采样对比
console.log('\n📝 采样对比（前 500 字符）')
console.log('\n原始:')
console.log(HTML_TEMPLE_FULL.substring(0, 500))
console.log('\nP1 导出:')
console.log(p1Export.substring(0, 500))
console.log('\nP2 导出:')
console.log(p2Export.substring(0, 500))

// 找出第一个差异点
console.log('\n🎯 查找第一个差异点')
let firstDiff = -1
const maxLen = Math.max(HTML_TEMPLE_FULL.length, p2Export.length)
for (let i = 0; i < maxLen; i++) {
  if (HTML_TEMPLE_FULL[i] !== p2Export[i]) {
    firstDiff = i
    break
  }
}

if (firstDiff >= 0) {
  console.log(`第一个差异在位置 ${firstDiff}`)
  console.log(`原始: "${HTML_TEMPLE_FULL.substring(firstDiff, firstDiff + 50)}"`)
  console.log(`P2: "${p2Export.substring(firstDiff, firstDiff + 50)}"`)
} else {
  console.log('内容完全一致！')
}

