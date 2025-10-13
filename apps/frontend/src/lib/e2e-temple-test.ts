/**
 * 端到端测试：html temple → html temple flip
 * 
 * 完整验证从输入到输出的整个流程
 */

// 设置 jsdom 环境
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.DOMParser = dom.window.DOMParser as any
global.document = dom.window.document as any
global.Node = dom.window.Node as any
global.Element = dom.window.Element as any

import { splitHtmlToModules, exportModulesHtml } from './htmlSplitter'
import { HTML_TEMPLE_FULL } from './fixtures/htmlTemple'

console.log('========================================')
console.log('🧪 端到端测试：html temple → html temple flip')
console.log('========================================\n')

// 1. 输入验证
console.log('📥 步骤 1: 验证输入 HTML')
console.log(`输入长度: ${HTML_TEMPLE_FULL.length} 字符`)
console.log(`包含关键内容: ${HTML_TEMPLE_FULL.includes('店内全商品に使えるクーポンを配布中') ? '✓' : '✗'}`)
console.log(`包含图片: ${HTML_TEMPLE_FULL.includes('ca815001-n.jpg') ? '✓' : '✗'}`)
console.log(`包含表格: ${HTML_TEMPLE_FULL.includes('本革 磁石無し') ? '✓' : '✗'}\n`)

// 2. 拆分
console.log('🔨 步骤 2: 拆分 HTML 为模块')
const modules = splitHtmlToModules(HTML_TEMPLE_FULL)
console.log(`✓ 拆分完成，共 ${modules.length} 个模块\n`)

// 3. 模块统计
console.log('📊 步骤 3: 模块统计')
const stats = {
  gap: modules.filter(m => m.kind === 'gap').length,
  image: modules.filter(m => m.kind === 'image').length,
  table: modules.filter(m => m.kind === 'table').length,
  text: modules.filter(m => m.kind === 'text').length
}
console.log(`间隔模块 (gap):   ${stats.gap} 个`)
console.log(`图片模块 (image): ${stats.image} 个`)
console.log(`表格模块 (table): ${stats.table} 个`)
console.log(`文本模块 (text):  ${stats.text} 个`)
console.log(`总计:             ${modules.length} 个\n`)

// 4. 逐个验证模块（前 10 个 + 关键模块）
console.log('🔍 步骤 4: 验证关键模块内容')

const keyModules = [
  { index: 0, expected: 'gap', keyword: '<br' },
  { index: 1, expected: 'table', keyword: '店内全商品' },
  { index: 2, expected: 'gap', keyword: '<br' },
  { index: 3, expected: 'table', keyword: 'ショップのレビュー' },
  { index: 4, expected: 'gap', keyword: '<br' },
  { index: 5, expected: 'image', keyword: 'ca815001-n.jpg' },
  { index: 6, expected: 'gap', keyword: '<p' },
  { index: 7, expected: 'image', keyword: 'ca815002.jpg' },
  { index: 31, expected: 'table', keyword: '本革 磁石無し' },
  { index: 33, expected: 'table', keyword: 'ご注文前にご確認ください' },
  { index: 34, expected: 'table', keyword: 'お問い合わせフォーム' },
  { index: 36, expected: 'table', keyword: 'レビュー投稿' }
]

let passed = 0
let failed = 0

for (const test of keyModules) {
  const mod = modules[test.index]
  if (!mod) {
    console.log(`✗ 模块 ${test.index + 1}: 不存在`)
    failed++
    continue
  }

  const kindMatch = mod.kind === test.expected
  const contentMatch = mod.html.includes(test.keyword)

  if (kindMatch && contentMatch) {
    console.log(`✓ 模块 ${test.index + 1}: ${test.expected} (包含 "${test.keyword}")`)
    passed++
  } else {
    console.log(`✗ 模块 ${test.index + 1}: 期望 ${test.expected}，实际 ${mod.kind}；包含关键词: ${contentMatch}`)
    failed++
  }
}
console.log(`\n验证结果: ${passed}/${keyModules.length} 通过\n`)

// 5. 合规检查
console.log('🛡️  步骤 5: 合规检查（Rakuten 约束）')
let complianceIssues = 0

for (let i = 0; i < modules.length; i++) {
  const mod = modules[i]
  
  // 检查禁止标签
  if (/<script[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <script>`)
    complianceIssues++
  }
  if (/<style[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <style>`)
    complianceIssues++
  }
  if (/<iframe[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <iframe>`)
    complianceIssues++
  }
  if (/<span[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <span>`)
    complianceIssues++
  }
  if (/<col[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <col>`)
    complianceIssues++
  }
  
  // 检查表外壳
  if (/<tbody[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <tbody>`)
    complianceIssues++
  }
  if (/<thead[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <thead>`)
    complianceIssues++
  }
  if (/<tfoot[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <tfoot>`)
    complianceIssues++
  }
  if (/<colgroup[\s>]/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 <colgroup>`)
    complianceIssues++
  }
  
  // 检查禁止属性
  if (/\s+style=/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 style 属性`)
    complianceIssues++
  }
  if (/\s+class=/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 class 属性`)
    complianceIssues++
  }
  if (/\s+id=/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含 id 属性`)
    complianceIssues++
  }
  if (/\s+on[a-z]+=/i.test(mod.html)) {
    console.log(`✗ 模块 ${i + 1}: 包含事件属性`)
    complianceIssues++
  }
}

if (complianceIssues === 0) {
  console.log('✓ 所有模块符合 Rakuten 合规约束')
} else {
  console.log(`✗ 发现 ${complianceIssues} 个合规问题`)
}
console.log()

// 6. 导出
console.log('📤 步骤 6: 导出 HTML')
const exported = exportModulesHtml(modules)
console.log(`✓ 导出完成，长度: ${exported.length} 字符`)

// 检查导出的关键内容
const exportChecks = [
  { name: '优惠信息', keyword: '店内全商品に使えるクーポンを配布中' },
  { name: 'レビュー', keyword: 'ショップのレビュー' },
  { name: '图片1', keyword: 'ca815001-n.jpg' },
  { name: '图片13', keyword: 'ca815013.jpg' },
  { name: '规格表', keyword: '本革 磁石無し 本革 手帳型ケース 6色' },
  { name: '注意事项', keyword: 'ご注文前にご確認ください' },
  { name: '联系方式', keyword: 'お問い合わせフォームはこちらへ' },
  { name: 'レビュー投稿', keyword: 'レビュー投稿＆' }
]

let exportPassed = 0
for (const check of exportChecks) {
  if (exported.includes(check.keyword)) {
    console.log(`✓ 导出包含: ${check.name}`)
    exportPassed++
  } else {
    console.log(`✗ 导出缺失: ${check.name}`)
  }
}
console.log(`\n导出内容验证: ${exportPassed}/${exportChecks.length} 通过\n`)

// 7. 导出合规检查
console.log('🛡️  步骤 7: 导出 HTML 合规检查')
let exportIssues = 0

const exportTests = [
  { pattern: /\s+style=/i, name: 'style 属性' },
  { pattern: /\s+class=/i, name: 'class 属性' },
  { pattern: /\s+id=/i, name: 'id 属性' },
  { pattern: /\s+data-/i, name: 'data-* 属性' },
  { pattern: /\s+aria-/i, name: 'aria-* 属性' },
  { pattern: /\s+on[a-z]+=/i, name: '事件属性' },
  { pattern: /<script[\s>]/i, name: '<script> 标签' },
  { pattern: /<style[\s>]/i, name: '<style> 标签' },
  { pattern: /<iframe[\s>]/i, name: '<iframe> 标签' },
  { pattern: /<span[\s>]/i, name: '<span> 标签' },
  { pattern: /<tbody[\s>]/i, name: '<tbody> 标签' },
  { pattern: /<thead[\s>]/i, name: '<thead> 标签' },
  { pattern: /<tfoot[\s>]/i, name: '<tfoot> 标签' },
  { pattern: /<colgroup[\s>]/i, name: '<colgroup> 标签' },
  { pattern: /<col[\s>]/i, name: '<col> 标签' }
]

for (const test of exportTests) {
  if (test.pattern.test(exported)) {
    console.log(`✗ 导出包含禁止项: ${test.name}`)
    exportIssues++
  }
}

if (exportIssues === 0) {
  console.log('✓ 导出 HTML 完全符合 Rakuten 合规约束')
} else {
  console.log(`✗ 导出 HTML 发现 ${exportIssues} 个合规问题`)
}
console.log()

// 8. 幂等性测试
console.log('🔄 步骤 8: 幂等性测试（往返验证）')
const modules2 = splitHtmlToModules(exported)
const exported2 = exportModulesHtml(modules2)

console.log(`第一次拆分: ${modules.length} 个模块`)
console.log(`第二次拆分: ${modules2.length} 个模块`)
console.log(`模块数一致: ${modules.length === modules2.length ? '✓' : '✗'}`)
console.log(`导出内容一致: ${exported === exported2 ? '✓' : '✗'}`)
console.log()

// 9. 特殊情况验证
console.log('🎯 步骤 9: 特殊情况验证')

// 9.1 连续 <br> 合并
const module5 = modules[4]
if (module5 && module5.kind === 'gap') {
  const brCount = (module5.html.match(/<br/gi) || []).length
  console.log(`✓ 模块 5 (连续 br): ${brCount} 个 <br> 合并为一个模块`)
} else {
  console.log('✗ 模块 5 应为连续 <br> 的间隔模块')
}

// 9.2 <p><br></p> 独立模块
const module7 = modules[6]
if (module7 && module7.kind === 'gap' && module7.html.includes('<p') && module7.html.includes('align')) {
  console.log('✓ 模块 7: <p align="center"><br></p> 独立为间隔模块')
} else {
  console.log('✗ 模块 7 应为 <p><br></p> 间隔模块')
}

// 9.3 表格内 <br> 不拆分
const tableModule = modules.find(m => m.kind === 'table' && m.html.includes('ワニ柄 本革'))
if (tableModule && tableModule.html.includes('<br>')) {
  console.log('✓ 表格模块内的 <br> 未被拆分（保留为内容）')
} else {
  console.log('✗ 表格模块内的 <br> 处理有误')
}

console.log()

// 10. 最终总结
console.log('========================================')
console.log('📋 测试总结')
console.log('========================================')
console.log(`✓ 模块总数: ${modules.length} 个（期望 38 个）`)
console.log(`✓ 模块类型分布: gap(${stats.gap}) + image(${stats.image}) + table(${stats.table}) + text(${stats.text})`)
console.log(`✓ 关键模块验证: ${passed}/${keyModules.length} 通过`)
console.log(`✓ 模块合规检查: ${complianceIssues === 0 ? '通过' : `${complianceIssues} 个问题`}`)
console.log(`✓ 导出内容验证: ${exportPassed}/${exportChecks.length} 通过`)
console.log(`✓ 导出合规检查: ${exportIssues === 0 ? '通过' : `${exportIssues} 个问题`}`)
console.log(`✓ 幂等性验证: ${modules.length === modules2.length && exported === exported2 ? '通过' : '失败'}`)

const allPassed = 
  modules.length === 38 &&
  passed === keyModules.length &&
  complianceIssues === 0 &&
  exportPassed === exportChecks.length &&
  exportIssues === 0 &&
  modules.length === modules2.length &&
  exported === exported2

console.log()
if (allPassed) {
  console.log('🎉 所有测试通过！html temple → html temple flip 转换成功！')
  process.exit(0)
} else {
  console.log('⚠️  部分测试失败，请检查上述错误')
  process.exit(1)
}

