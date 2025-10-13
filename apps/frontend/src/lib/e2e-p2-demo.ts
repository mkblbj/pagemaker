/**
 * P2 端到端演示：渲染与导出
 * 
 * 演示从 html temple 到渲染再到导出的完整流程
 */

// 设置 jsdom 环境
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.DOMParser = dom.window.DOMParser as any
global.document = dom.window.document as any
global.Node = dom.window.Node as any
global.Element = dom.window.Element as any
global.HTMLElement = dom.window.HTMLElement as any
global.MouseEvent = dom.window.MouseEvent as any

import { splitHtmlToModules } from './htmlSplitter'
import { mountEditor, exportSelectedModules, selectAllModules } from './moduleRenderer'
import { HTML_TEMPLE_FULL } from './fixtures/htmlTemple'

console.log('========================================')
console.log('🎨 P2 端到端演示：渲染与导出')
console.log('========================================\n')

// 1. 拆分
console.log('📥 步骤 1: 拆分 HTML')
const modules = splitHtmlToModules(HTML_TEMPLE_FULL)
console.log(`✓ 拆分完成：${modules.length} 个模块\n`)

// 2. 创建容器并渲染
console.log('🎨 步骤 2: 渲染模块（就地 + Overlay）')
const container = document.createElement('div')
document.body.appendChild(container)

const state = mountEditor(container, modules, {
  enableSelection: true,
  enableHover: true
})

console.log(`✓ 渲染完成`)
console.log(`  - 容器类名: ${container.className}`)
console.log(`  - 模块宿主数: ${container.querySelectorAll('.pm-module-host').length}`)
console.log(`  - Overlay 数: ${container.querySelectorAll('.pm-module-overlay').length}`)
console.log()

// 3. 验证渲染结构
console.log('🔍 步骤 3: 验证渲染结构')

const hosts = container.querySelectorAll('.pm-module-host')
let structureValid = true

for (let i = 0; i < Math.min(5, hosts.length); i++) {
  const host = hosts[i] as HTMLElement
  const moduleId = host.dataset.moduleId
  const moduleKind = host.dataset.moduleKind
  const hasOverlay = host.querySelector('.pm-module-overlay') !== null

  if (!moduleId || !moduleKind || !hasOverlay) {
    console.log(`✗ 模块 ${i + 1}: 结构不完整`)
    structureValid = false
  } else {
    console.log(`✓ 模块 ${i + 1}: ${moduleKind} (id: ${moduleId.substring(0, 20)}...)`)
  }
}

if (hosts.length > 5) {
  console.log(`  ... 及其他 ${hosts.length - 5} 个模块`)
}
console.log()

// 4. 验证 Overlay 组件
console.log('🎯 步骤 4: 验证 Overlay 组件')

const firstHost = hosts[0] as HTMLElement
const firstOverlay = firstHost.querySelector('.pm-module-overlay')

if (firstOverlay) {
  const hasTypeLabel = firstOverlay.querySelector('.pm-module-type-label') !== null
  const hasActions = firstOverlay.querySelector('.pm-module-actions') !== null
  const hasSourceBtn = firstOverlay.querySelector('.pm-source-btn') !== null
  const hasDeleteBtn = firstOverlay.querySelector('.pm-delete-btn') !== null

  console.log(`✓ Overlay 组件完整:`)
  console.log(`  - 类型标签: ${hasTypeLabel ? '✓' : '✗'}`)
  console.log(`  - 操作按钮容器: ${hasActions ? '✓' : '✗'}`)
  console.log(`  - 源码按钮: ${hasSourceBtn ? '✓' : '✗'}`)
  console.log(`  - 删除按钮: ${hasDeleteBtn ? '✓' : '✗'}`)
} else {
  console.log('✗ 未找到 Overlay')
}
console.log()

// 5. 导出（未选中 = 全部导出）
console.log('📤 步骤 5: 导出 HTML（全部模块）')
const exported1 = exportSelectedModules(container, state)
console.log(`✓ 导出完成：${exported1.length} 字符`)

// 验证导出纯净性
const hasOverlayInExport = exported1.includes('pm-module-overlay')
const hasHostInExport = exported1.includes('pm-module-host')
const hasDataModule = exported1.includes('data-module')

console.log(`\n导出纯净性检查:`)
console.log(`  - 无 overlay: ${!hasOverlayInExport ? '✓' : '✗'}`)
console.log(`  - 无宿主容器: ${!hasHostInExport ? '✓' : '✗'}`)
console.log(`  - 无 data-module: ${!hasDataModule ? '✓' : '✗'}`)
console.log()

// 6. 部分选择导出
console.log('📤 步骤 6: 部分选择导出')
state.selectedIds.clear()
// 选择前 5 个模块
for (let i = 0; i < Math.min(5, modules.length); i++) {
  state.selectedIds.add(modules[i].id)
}

const exported2 = exportSelectedModules(container, state)
console.log(`✓ 选中 ${state.selectedIds.size} 个模块`)
console.log(`✓ 导出完成：${exported2.length} 字符`)
console.log(`✓ 长度比例：${((exported2.length / exported1.length) * 100).toFixed(1)}%`)
console.log()

// 7. 导出一致性验证
console.log('🔄 步骤 7: 导出一致性验证')

// 全选后导出
selectAllModules(state)
const exported3 = exportSelectedModules(container, state)

const consistent = exported1 === exported3
console.log(`全部导出 vs 全选导出: ${consistent ? '✓ 一致' : '✗ 不一致'}`)
console.log(`  - 长度: ${exported1.length} vs ${exported3.length}`)
console.log()

// 8. 往返测试
console.log('🔄 步骤 8: 往返测试（导出→拆分→渲染→导出）')

const modules2 = splitHtmlToModules(exported1)
console.log(`✓ 第二次拆分：${modules2.length} 个模块`)

const container2 = document.createElement('div')
const state2 = mountEditor(container2, modules2)
const exported4 = exportSelectedModules(container2, state2)

console.log(`✓ 第二次导出：${exported4.length} 字符`)
console.log(`模块数一致: ${modules.length === modules2.length ? '✓' : '✗'}`)
console.log(`导出一致: ${exported1 === exported4 ? '✓' : '✗'}`)
console.log()

// 9. 内容完整性检查
console.log('✅ 步骤 9: 内容完整性检查')

const keyContents = [
  '店内全商品に使えるクーポンを配布中',
  'ショップのレビュー',
  'ca815001-n.jpg',
  'ca815013.jpg',
  '本革 磁石無し',
  'ご注文前にご確認ください',
  'お問い合わせフォーム',
  'レビュー投稿'
]

let contentPassed = 0
for (const content of keyContents) {
  if (exported1.includes(content)) {
    contentPassed++
  } else {
    console.log(`✗ 缺失: ${content}`)
  }
}

console.log(`内容完整性: ${contentPassed}/${keyContents.length} 通过`)
console.log()

// 10. 最终总结
console.log('========================================')
console.log('📋 P2 演示总结')
console.log('========================================')
console.log(`✓ 拆分: ${modules.length} 个模块`)
console.log(`✓ 渲染: ${hosts.length} 个宿主容器 + ${hosts.length} 个 Overlay`)
console.log(`✓ 结构验证: ${structureValid ? '通过' : '失败'}`)
console.log(`✓ 导出纯净性: ${!hasOverlayInExport && !hasHostInExport && !hasDataModule ? '通过' : '失败'}`)
console.log(`✓ 部分导出: 支持`)
console.log(`✓ 导出一致性: ${consistent ? '通过' : '失败'}`)
console.log(`✓ 往返测试: ${modules.length === modules2.length && exported1 === exported4 ? '通过' : '失败'}`)
console.log(`✓ 内容完整性: ${contentPassed}/${keyContents.length}`)

const allPassed = 
  structureValid &&
  !hasOverlayInExport &&
  !hasHostInExport &&
  !hasDataModule &&
  consistent &&
  modules.length === modules2.length &&
  exported1 === exported4 &&
  contentPassed === keyContents.length

console.log()
if (allPassed) {
  console.log('🎉 P2 所有验证通过！渲染与导出功能正常！')
  process.exit(0)
} else {
  console.log('⚠️  部分验证失败，请检查上述错误')
  process.exit(1)
}

