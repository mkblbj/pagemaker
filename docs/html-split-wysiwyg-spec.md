# 自定义整页 HTML 拆分与就地编辑规范（Rakuten SP 合规版）

> 版本：v1.0  最后更新：2025-10-13  维护人：Pagemaker 团队

---

## 0. 目标与范围
- 目标：将整页 HTML 一键拆分为“模块”，支持就地所见即所得（WYSIWYG）编辑与源码视图，导出“纯 HTML”（符合乐天 SP 约束）以便粘贴到 RMS。
- 范围：仅对导入 HTML 进行“拆分/编辑/净化/导出”。不引入项目私有模块结构，不新增 iframe，不改变原有视觉语义。

---

## 1. 合规约束（Rakuten 模式）
资料来源：`docs/rakutendocs/スマートフォン デザイン設定.md`、`docs/rakutendocs/[スマートフォン デザイン設定] スマートフォン用説明文の参考HTMLタグ.md`

- 允许的标签（白名单）
  - 结构：`table, tr, td, th`
  - 文本：`p, br, font, b, strong, i, u, center`
  - 媒体：`img`
  - 分隔：`hr`（仅当原文存在时保留，不新增）
- 允许的属性（白名单）
  - `a`: `href, target`
  - `img`: `src, alt, width, height, border`
  - `table`: `align, bgcolor, border, bordercolor, cellpadding, cellspacing, frame, height, rules, width`
  - `tr/td/th`: `align, bgcolor, bordercolor, height, valign, width, colspan, rowspan, axis, headers`
  - `p`: `align`
  - `font`: `color, size`
- 强制移除
  - 全部：`style, class, id, data-*, aria-*, on*`
  - 标签：`script, style, iframe, span`
  - 表外壳：`thead, tbody, tfoot, colgroup`（其子节点“提升/展开”，不改变模块边界）
- 其他
  - 不自动将 `http` 转为 `https`，不提示、不改写。
  - 仅使用 `<font>` 表达颜色/字号；加粗用 `<b>`；链接用 `<a>`；不输出 `style` 属性。

---

## 2. 交互与编辑（就地所见即所得）
- 形式：就地编辑（无左右分栏）。模块外层以高亮/描边标识，浮动工具条在需要时出现。
- 文本编辑：
  - 使用 `contenteditable`；支持加粗、颜色、字号、超链接（输出 `<b>`、`<font color|size>`、`<a href|target>`）。
  - 回车插入 `<br>`；不生成 `div/span style`；不更改原有块级结构。
- 图片编辑：
  - 点击图片 → 调用现有“图片选择器” → 仅替换 `src`；不更改 `width/height/alt`（原文有则保留，无则不新增）。
- 源码视图：
  - 模块级“源码”抽屉，查看与编辑该模块 HTML；保存时再次净化，确保合规。
- 导出/复制：
  - 单模块导出：输出净化后的“纯 HTML”。
  - 多选导出：严格按当前顺序拼接，不插入任何额外分隔（不新增 `hr` 等）。
- 不污染导出：
  - 编辑辅助的高亮/句柄/覆盖层通过外层 overlay 或并列 DOM 实现，不写入模块 DOM；导出不包含任何编辑辅助节点或属性。

---

## 3. 拆分规则（以“html temple flip”为权威）
> 注：本节对齐 Notepad: `html temple flip` 的示例排序与粒度。

- 顶层节点序：在“拆分根容器”的直接子节点级别按顺序遍历并生成模块。
- 模块类型与判定：
  1) 间隔模块（顶层换行）
    - 顶层 `<br>` / `<br />`：
      - 连续若干个 `<br>` 合并为一个“间隔模块”，模块内容中保留多个 `<br>` 原样（例如：`<br><br>` 作为一个模块）。
      - 不统一 `<br>` 与 `<br />` 的写法，保持输入原样。
    - 顶层仅包含换行的段落：`<p ...><br></p>` 作为独立的间隔模块，按原样保留属性与大小写。
    - 模块内部（尤其 `table/tr/td` 内部）的 `<br>`：作为内容保留，不拆分成独立模块。
  2) 图片模块（顶层图片）
    - 顶层 `<img>`：每个 `<img>` 独立成一个模块；内部编辑仅替换 `src`。
  3) 表格模块（顶层表格）
    - 顶层 `<table>`：一张表为一个模块；其内部嵌套结构（包括嵌套表格与 `<font>` 等）不再拆分。
    - 导出时清除 `thead/tbody/tfoot/colgroup`，提升其行到 `table` 下；不影响模块边界。
  4) 文本模块（顶层内联/文本序列）
    - 连续的顶层内联/文本（`font/p/br/a/b/center/...` 且不含表/图独立节点）聚合为一个文本模块；其中的 `<br>` 保留在模块内，除非其本身就是“顶层独立换行”（见 1)。
- 不改变标签结构：不将 `table` 拆成多模块；若顶层仅为“包装 + 单表格”（如 `font`→`table`），按“整体模块”处理。

---

## 4. 与示例（html temple / html temple flip）的对应
- 输入样例：Notepad: `html temple`
- 目标拆分：严格对齐 Notepad: `html temple flip` 顺序与粒度（数字仅为序列标识）。
  - 示例起始序列：
    1) `<br>`
    2) 顶部红底优惠 `table`
    3) `<br>`
    4) 红底“ショップのレビュー” `table`
    5) `<br><br>`（一个间隔模块，包含两个 `<br>` 原样）
    6) 顶层 `<img src=...ca815001-n.jpg>`（图片模块）
    7) `<p align="center"><br></p>`（间隔模块）
    8) 顶层 `<img src=...ca815002.jpg>`（图片模块）
    9) `<p align="center"><br></p>`
    10) 顶层 `<img src=...ca815003.jpg>`
    ...（中间若干“图片/间隔”交替，保持原序）...
    32) 规格明细大表 `table`（导出时去除 `tbody` 等外壳，但内容不变）
    33) `<p align="center"><br></p>`
    34) 红色注意事项大表 `table`
    35) 橙色联系表 `table`
    36) `<p align="center"><br></p>`
    37) 红底“レビュー投稿＆あんしん保証90日”区块（多表组合的一个顶层表模块）
    38) `<p align="center"><br></p>`
- 验收要点：对同一输入再运行拆分，模块列表与 `html temple flip` 的顺序与模块边界完全一致。

---

## 5. 净化（Sanitize）
- 处理流程（概述）：
  1) 解析 DOM；移除不允许的标签（`script/style/iframe`）
  2) 表格外壳提升：将 `thead/tbody/tfoot/colgroup` 的行提升为 `table` 直接子节点，并删除外壳
  3) 属性清洗：移除 `style/class/id/data-*/aria-*/on*`
  4) 属性白名单过滤：仅保留第 1 节列出的属性；超出一律移除
  5) 标签白名单过滤：仅保留第 1 节列出的标签；超出标签整体移除或展开文本
- 注意：不更改实体与协议（如 `&amp;` / `http://`），保持原样。

---

## 6. 编辑与输出行为
- 文本：
  - 加粗→`<b>`；颜色/字号→`<font color|size>`；链接→`<a href|target>`；不写入 `style`。
  - 回车→插入 `<br>`；不自动创建 `div/span`。
- 图片：
  - 仅替换 `src`；`width/height/alt` 不变（原文有就保留，无则不新增）。
- 源码：
  - 模块级编辑保存时再次执行净化流程，保证导出合规。
- 导出：
  - 单模块：输出净化后的 HTML 片段。
  - 多模块：按当前模块顺序拼接，不插入分隔，不改写任何内容（除净化规则外）。

---

## 7. 非功能约束
- 性能：大页面按模块懒渲染；编辑区仅激活当前模块。
- 安全：严格白名单，清除事件与脚本；不引入 iframe。
- 兼容：不依赖外链样式；仅使用基础 HTML 与允许属性。

---

## 8. 示例（导出形态片段）
- 间隔模块（合并的两个换行作为一个模块）：
```html
<br><br>
```
- 顶层表格模块（导出时去除 tbody）：
```html
<table width="100%" border="0" cellspacing="2" cellpadding="8" bgcolor="#999999">
  <tr>
    <td colspan="6" bgcolor="#efefef" width="20%" align="center"><font size="2">商品名</font></td>
    <td bgcolor="#FFFFFF" width="80%"><font size="3"><b>本革 磁石無し 本革 手帳型ケース 6色</b></font></td>
  </tr>
  <!-- ... 后续行保持原样，仅清除不允许的属性/外壳 ... -->
</table>
```
- 图片模块（仅替换 src）：
```html
<img src="https://image.rakuten.co.jp/.../ca815002.jpg" width="100%" alt="ca815002">
```

---

## 9. 实施接口（供前端参考）
```ts
export type HtmlModule = {
  id: string
  kind: 'gap' | 'image' | 'table' | 'text'
  html: string       // 净化后的模块 HTML
  rawFragment: string // 原始片段（内部用，不对外导出）
}

export type SplitOptions = {
  treatTopTableAsAtomic?: boolean // 默认 true
  mergeConsecutiveBrAsOneGap?: boolean // 默认 true（对齐 html temple flip）
}

export type SanitizeOptions = {
  disableStyleAttr?: true // 固定 true（Rakuten 模式）
}

export function splitHtmlToModules(pageHtml: string, opts?: SplitOptions): HtmlModule[]
export function sanitizeModuleHtml(html: string, opts?: SanitizeOptions): string
export function exportModulesHtml(mods: HtmlModule[]): string
```

---

## 10. 验收标准（Checklist）
- [ ] 导入 `html temple` 拆分结果与 `html temple flip` 完全一致（顺序/粒度/内容）
- [ ] 任意导出不包含 `style/class/id/data-*/aria-*/on*`，且无 `thead/tbody/tfoot/colgroup`、`script/style/iframe`
- [ ] 顶层连续 `<br>` 合并为一个“间隔模块”，模块内保留多个 `<br>` 原样
- [ ] 图片仅替换 `src`；`width/height/alt` 保持
- [ ] 不新增任何分隔符；多模块导出严格原序拼接
- [ ] 所有富文本编辑生成标签均在白名单内

---

## 11. 参考
- `docs/rakutendocs/スマートフォン デザイン設定.md`
- `docs/rakutendocs/[スマートフォン デザイン設定] スマートフォン用説明文の参考HTMLタグ.md`
- Notepad: `html temple` / `html temple flip`

---

## 12. 用户视角交互流（前端）

### 集成方案（基于现有 Editor）

**入口**：Canvas 编辑器中的"代码"按钮（现有功能扩展）

**完整流程**：

1. **导入与拆分**
   - 用户在 Canvas 中点击"代码"按钮 → 打开代码编辑对话框
   - 粘贴整页 HTML 到输入框
   - 点击"拆分为模块"按钮 → 显示拆分预览对话框
   - 预览显示：总计 38 个模块（19 间隔 + 13 图片 + 6 表格）
   - 确认拆分 → 替换当前模块为多个可编辑模块

2. **模块呈现**（就地渲染，带 overlay 高亮）
   - 顶层 `<table>`：以整张表为一个模块，外框高亮，可直接编辑单元格文本
   - 顶层 `<img>`：每张图片一个模块，悬停显示可替换提示，点击仅更换 `src`
   - 顶层换行：`<br>` / `<br />` 连续若干个合并为"一个间隔模块"，以轻描边占位显示
   - `<p><br></p>` 顶层段落作为独立间隔模块显示

3. **文本编辑**（所见即所得，单击激活）
   - 单击文本/表格模块 → 激活编辑模式（`contenteditable`）
   - 显示浮动工具条：加粗、颜色、字号、链接
   - 回车插入 `<br>`；不生成 `div/span style`
   - 失焦自动保存 → 调用 `sanitizeHtml` 净化
   - 工具条操作：
     - 加粗 → 生成/移除 `<b>`
     - 颜色/字号 → 生成/更新 `<font color|size>`
     - 超链接 → 包裹 `<a href target>`（保持 https/非强制）

4. **图片编辑**（P4）
   - 点击图片 → 打开"图片选择器"（现有组件）
   - 仅替换 `src`；不改 `width/height/alt`

5. **源码编辑**（P5，模块级）
   - 点击模块右上角"源码"按钮 → 打开抽屉
   - 显示该模块的 HTML 源码
   - 编辑后保存 → 自动执行"净化" → 回填预览

6. **选择与导出**（P6）
   - 勾选一个或多个模块 → "复制所选 HTML"或"导出"
   - 严格按当前顺序拼接，不插入任何分隔符
   - 导出纯 HTML，无编辑辅助结构

7. **视觉与可用性**
   - 高亮/占位/工具条使用外层 overlay/并列 DOM
   - 不写入模块 DOM；导出不包含任何编辑辅助

---

## 13. 前端实现任务清单 / 里程碑
- M1 拆分与模型
  - 实现 `splitHtmlToModules(pageHtml)`（对齐本规范的模块边界规则）
  - 支持顶层 `<br>` 连续合并为“一个间隔模块”；`<p><br></p>` 顶层段落独立为间隔模块
- M2 净化管线（Rakuten 模式）
  - 白名单标签/属性；移除 `style/class/id/data-*/aria-*/on*` 与 `script/style/iframe`
  - 表外壳提升：移除 `thead/tbody/tfoot/colgroup`，保留行到 `table`
- M3 就地渲染与编辑
  - 模块渲染组件：`table`/`image`/`text`/`gap` 四类
  - 文本 `contenteditable` 与工具条（仅 `<b>/<font>/<a>`）
  - 图片点击集成现有“图片选择器”，仅替换 `src`
- M4 源码抽屉
  - 模块级源码查看/编辑；保存前后走净化，预览同步
- M5 复制/导出
  - 单/多模块导出；原序拼接；不新增分隔符
- M6 验收与回归
  - 以 Notepad: `html temple` / `html temple flip` 做对照验收
  - XSS/性能/兼容性检查（不引入 iframe，不输出 `style`）

进度建议：M1-M2（0.5 天）→ M3（0.5-1 天）→ M4-M5（0.5 天）→ M6（0.5 天）。

---

## 14. 接口伪代码（前端集成）
```ts
// 模块类型
export type HtmlModule = {
  id: string
  kind: 'gap' | 'image' | 'table' | 'text'
  html: string          // 净化后模块 HTML
  rawFragment: string   // 原始片段（内部使用）
}

// 拆分与净化（实现见本规范第 9 节）
declare function splitHtmlToModules(pageHtml: string): HtmlModule[]
declare function sanitizeModuleHtml(html: string): string

type ModuleState = {
  list: HtmlModule[]
  selectedIds: Set<string>
}

// 1) 初始化
export function mountEditor(root: HTMLElement, pageHtml: string) {
  const modules = splitHtmlToModules(pageHtml)
  const state: ModuleState = { list: modules, selectedIds: new Set() }
  renderModules(root, state)
  return { state, getHtmlForExport: () => exportSelected(state) }
}

// 2) 渲染（就地，不改模块 DOM 结构；编辑辅助走 overlay）
function renderModules(root: HTMLElement, state: ModuleState) {
  root.innerHTML = ''
  for (const mod of state.list) {
    const host = document.createElement('div')
    host.dataset.moduleId = mod.id
    host.className = 'pm-module-host'
    host.appendChild(htmlToNode(mod.html)) // 不包裹多余结构

    attachModuleOverlay(host, mod, state)  // 高亮/工具条等（不写入导出 DOM）
    root.appendChild(host)
  }
}

// 3) 文本编辑（仅输出 <b>/<font>/<a>；回车 → <br>）
function enableTextEditing(host: HTMLElement) {
  host.addEventListener('dblclick', (e) => {
    const el = e.target as HTMLElement
    if (!el) return
    el.setAttribute('contenteditable', 'true')
    el.focus()
  })
  host.addEventListener('blur', (e) => {
    const el = e.target as HTMLElement
    if (!el?.isContentEditable) return
    el.removeAttribute('contenteditable')
  }, true)
}

// 4) 图片替换（仅替换 src）
async function onImageClick(img: HTMLImageElement) {
  const picked = await openImagePicker() // 已有图片选择器
  if (!picked) return
  img.src = picked.url // 仅替换 src
}

// 5) 源码抽屉保存
function onSourceSave(moduleId: string, newHtml: string, state: ModuleState) {
  const mod = state.list.find(m => m.id === moduleId)
  if (!mod) return
  mod.html = sanitizeModuleHtml(newHtml)
  // 重新渲染该模块
  const host = document.querySelector(`[data-module-id="${moduleId}"]`) as HTMLElement
  if (host) {
    host.innerHTML = ''
    host.appendChild(htmlToNode(mod.html))
  }
}

// 6) 导出（严格原序，不插入分隔）
function exportSelected(state: ModuleState): string {
  const seq = state.list.filter(m => state.selectedIds.size ? state.selectedIds.has(m.id) : true)
  return seq.map(m => m.html).join('')
}

// 7) 工具条动作（示例：加粗/颜色/字号/链接）
function applyBold(range: Range) { wrapOrToggle(range, 'b') }
function applyColor(range: Range, color: string) { wrapOrSetFont(range, { color }) }
function applyFontSize(range: Range, size: string) { wrapOrSetFont(range, { size }) }
function applyLink(range: Range, href: string, target: string = '_top') {
  wrapWithAnchor(range, { href, target })
}

// 8) 间隔模块的渲染
// kind === 'gap' 时，mod.html 形如 '<br>' 或 '<br><br>'；
// 渲染时附加 overlay 细线占位，导出只输出原样的 br 片段。
```

实现注意：
- 编辑辅助只存在于 overlay/并列 DOM；不得写入模块 DOM，以免污染导出。
- `image` 模块只允许更换 `src`；不修改 `width/height/alt`。
- `text` 模块工具条仅生成白名单标签；回车强制转 `<br>`。
- 源码保存前后均需通过“净化”流程，确保导出合规。

---

## 15. 标签纯净策略（严格禁止擅自新增）
- 禁止新增：任何不在白名单中的标签、属性、节点结构（含包装性 `div/span` 等）一律禁止生成与导出。
- 标签保持：
  - 不将 `<br />` 统一为 `<br>`，全部保持输入原样。
  - 不将 `<p><br></p>` 改写为其他形式，按间隔模块原样保留。
- 结构不变：
  - 不为模块外再套一层容器用于导出；编辑辅助使用 overlay/并列 DOM，不写入模块 DOM。
- 表格外壳：仅在净化时“提升/删除” `thead/tbody/tfoot/colgroup`，不新增任何其他结构。
- 仅允许的格式化：
  - 粗体：`<b>`；颜色/字号：`<font color|size>`；链接：`<a href target>`。
  - 绝不写 `style` 属性，绝不写 `class/id/data-*/aria-*/on*`。

---

## 16. 工具条 → HTML 映射与禁止操作
- 允许的操作（及对应输出）：
  - 加粗：选区 → 包裹/切换 `<b>`。
  - 颜色：选区 → 包裹/更新 `<font color="#RRGGBB">`。
  - 字号：选区 → 包裹/更新 `<font size="N">`（N 可用 `2/3/4/...` 等）。
  - 链接：选区 → 包裹 `<a href target="_top">`；不强制 https，不自动更改协议。
- 禁止的操作（均不提供入口）：
  - 不生成 `<span>`、不添加 `style`、不插入 `div/section` 等结构。
  - 不添加非白名单属性（如 `class/id/data-*` 等）。
  - 不对 `img` 修改 `width/height/alt`（只换 `src`）。
  - 不对 `table` 结构进行增删列/行（超出当前阶段）。

---

## 17. 边界与异常处理清单
- 顶层连续 `<br>`：合并为一个“间隔模块”，模块内容保留多个 `<br>` 原样（`<br><br>`）。
- 顶层 `<p><br></p>`：独立间隔模块，导出按原样保留（含 `align`）。
- 表格中 `<br>`：作为内容保留，不拆分。
- 非白名单标签/属性：净化时移除；文本内容若存在则尽量保留为纯文本。
- 发现 `span`：统一移除，保留其子内容；不插入替代标签。
- 链接嵌套异常：遇到 `<a>` 嵌套 `<a>` 的非法结构，内层 `a` 展开为文本并保留文字，移除多余的 `a`。
- 图片计数/协议：不限制、不提示；保持原样。
- 实体与编码：保持原输入（例如 `&nbsp;`、`﹠amp;` 等不改写）。
- 空单元格：不补充占位；保持空。

---

## 18. QA / 验收补充
- 拆分一致性：同一输入多次拆分，模块边界与顺序稳定、可复现（对齐 `html temple flip`）。
- 合规抽检：随机抽取 10 个模块校验仅含白名单标签/属性，无 `style/class/id/data-*/aria-*/on*`，无 `span`，无 `thead/tbody/tfoot/colgroup/script/style/iframe`。
- 编辑幂等性：
  - 文本加粗/改色/字号/链接多次切换不产生嵌套污染（应复用或清理已有 `<b>/<font>/<a>`）。
  - 源码保存后再次导出，净化仍满足合规。
- 导出拼接：多模块选中导出的 HTML 按顺序无缝拼接，粘贴 RMS 预览一致。
- 性能：100+ 模块页面编辑流畅；仅当前模块激活编辑监听；无明显卡顿。

---

## 19. 阶段性实施清单（按段交付）
> 原则（强制）：严格遵守"标签纯净策略"（第 15 节）与合规白名单（第 1、5 节）。绝不新增非白名单标签/属性/结构；禁止 `style/class/id/data-*/aria-*/on*`；移除 `span`；不写入 iframe；仅允许 `<b>/<font>/<a>` 与图片仅换 `src`。

### 前端集成入口设计

**集成位置**：`Canvas.tsx` 中的自定义 HTML 模块（`PageModuleType.CUSTOM`）

**交互流程**：
1. 用户点击"代码"按钮 → 打开代码编辑对话框
2. 输入/粘贴整页 HTML → 点击"拆分为模块"按钮
3. 显示预览：拆分后的模块数量和类型分布
4. 用户确认 → 替换当前自定义模块为拆分后的多个模块
5. 进入就地编辑模式：可编辑文本、替换图片、查看源码

**关键改动**：
- `Canvas.tsx`：添加"拆分为模块"功能入口
- `ModuleRenderer.tsx`：自定义 HTML 模块支持拆分预览
- 新增 `HtmlSplitEditor.tsx`：拆分编辑器组件
- 新增 `SplitPreviewDialog.tsx`：拆分预览对话框

---

### 实施阶段

- **P0 基座与合规工具（~0.5 天）✅ 已完成**
  - 目标：搭建净化（Sanitize）能力与白名单配置；准备对照用例与快照。
  - 产出：`htmlSanitizer.ts`（244 行）+ 测试（24 个）
  - 验收：✅ 24/24 测试通过

- **P1 拆分引擎（~0.5 天）✅ 已完成**
  - 目标：基于"顶层节点序"产出四类模块：`gap/image/table/text`。
  - 产出：`htmlSplitter.ts`（282 行）+ 测试（26 个）
  - 验收：✅ 26/26 测试通过，与 `html temple flip` 完全一致

- **P2 就地渲染与 Overlay（~0.5 天）✅ 已完成**
  - 目标：模块就地渲染；高亮/选取等编辑辅助仅用 overlay/并列 DOM（不写入模块 DOM）。
  - 产出：`moduleRenderer.ts`（455 行）+ 样式 + 测试（42 个）
  - 验收：✅ 42/42 测试通过，导出 HTML 与输入一致

- **P3 文本编辑最小闭环（~0.5–1 天）✅ 已完成**
  - 目标：文本 `contenteditable` 与工具条；仅产出 `<b>/<font>/<a>`；回车 → `<br>`。
  - 产出：`textEditor.ts`（440 行）+ 样式 + 测试（13 个）
  - 验收：✅ 13/13 测试通过，单击激活、失焦保存

- **P-UI 前端集成入口（~1 天）🔄 进行中**
  - 目标：在现有 Editor 中集成拆分功能；替换自定义 HTML 模块逻辑。
  - 产出：
    - `HtmlSplitEditor.tsx`：拆分编辑器组件（集成 P0-P3）
    - `SplitPreviewDialog.tsx`：拆分预览对话框
    - 更新 `Canvas.tsx`：添加"拆分为模块"入口
    - 更新 `ModuleRenderer.tsx`：支持拆分后的模块渲染
  - 交互流程：
    1. 点击"代码"按钮 → 输入整页 HTML
    2. 点击"拆分为模块"→ 预览拆分结果（38 个模块：19 间隔 + 13 图片 + 6 表格）
    3. 确认拆分 → 替换为多个可编辑模块
    4. 单击文本/表格 → 激活编辑（工具条）
    5. 点击图片 → 替换 src（P4）
    6. 点击"源码"→ 查看/编辑模块源码（P5）
  - 验收：
    - [ ] 可从代码对话框输入 HTML 并拆分
    - [ ] 拆分后显示正确的模块数量和类型
    - [ ] 拆分后的模块可正常编辑
    - [ ] 导出时按序拼接所有模块

- **P4 图片选择器集成（~0.5 天）**
  - 目标：点击图片仅更换 `src`；不改动 `width/height/alt`。
  - 产出：集成现有 `ImagePicker` 组件到 `HtmlSplitEditor`
  - 验收：任意图片替换后导出 diff 仅 `src` 变化，其余属性不变。

- **P5 源码抽屉（~0.5 天）**
  - 目标：模块级源码查看/编辑；保存时净化并回填。
  - 产出：`ModuleSourceDrawer.tsx`；保存调用净化管线；预览同步。
  - 验收：粘贴任意外部 HTML 后保存，导出合规且渲染一致。

- **P6 选择/导出（~0.5 天）**
  - 目标：多选模块导出；原序拼接，不插入分隔符。
  - 产出：选择器与复制/导出（剪贴板/下载）。
  - 验收：`html temple` 全量导出与拆分前视觉一致；拼接中不含任何编辑辅助结构。

- **P7 对照验收与回归（~0.5 天）**
  - 目标：以 `html temple` / `html temple flip` 做最终对照；性能与安全检查。
  - 产出：逐模块 diff 报告；性能记录（100+ 模块）与 XSS 向量清单。
  - 验收：顺序/粒度完全一致；100+ 模块编辑无明显卡顿；XSS 片段被净化。

里程碑建议：
- **里程碑 A：P0–P3（基础能力）✅ 已完成** - 净化、拆分、渲染、文本编辑
- **里程碑 B：P-UI + P4–P5（前端集成）🔄 进行中** - UI 入口、图片选择、源码编辑
- **里程碑 C：P6–P7（导出与验收）** - 多选导出、对照验收

---

## 20. 任务清单（执行粒度）
- 合规/净化（P0, P5）
  - 定义允许标签/属性白名单与禁止列表（含移除 `span`）。
  - 实现净化：移除 `style/class/id/data-*/aria-*/on*` 与 `script/style/iframe/span`；表外壳提升。
  - 单元测试：实体/协议不改写；外壳提升后的 DOM 等价。

- 拆分引擎（P1）
  - DOM 解析到顶层节点列表；按规则分类为 `gap/image/table/text`。
  - 合并顶层连续 `<br>` → 一个“间隔模块”；识别顶层 `<p><br></p>` 为间隔模块。
  - 生成稳定模块 `id`（顺序 + 片段哈希）。

- 渲染与 Overlay（P2）
  - 渲染每个模块为宿主容器 + 片段 DOM；禁止将辅助结构写入模块 DOM。
  - 交互：模块 hover/选中高亮；选中集管理。

- 文本编辑（P3）
  - `contenteditable`：拦截回车 → `<br>`。
  - 工具条：加粗/颜色/字号/链接 → 产出 `<b>/<font>/<a>`；包装/合并/去重逻辑。
  - 源码校验：编辑后片段再净化，确保仅白名单输出。

- 图片编辑（P4）
  - 集成现有图片选择器；点击 `img` → 仅替换 `src`。
  - 更新对应模块并重渲染。

- 源码抽屉（P5）
  - 模块级源码查看与编辑；保存 → 净化 → 回填。
  - 异常处理：非法标签/属性移除与提示（非阻断）。

- 选择/导出（P6）
  - 勾选模块集合；导出严格按序拼接；复制/下载两路径。
  - 剪贴板降级策略（若需要，参考项目剪贴板指南）。

- 对照与回归（P7）
  - 自动对照 `html temple flip`：序列长度、每项类型、HTML 片段一致性。
  - 性能脚本：100+ 模块的编辑与导出耗时统计。
  - 安全脚本：常见 XSS 载荷应被净化移除。

依赖与前置：
- P1 依赖 P0；P2 依赖 P1；P3/4 依赖 P2；P5 依赖 P0、P2；P6 依赖 P2；P7 收尾。

备注（强制重申）：任何阶段都不得擅自新增标签/属性/结构；仅在白名单范围内工作，确保导出为"纯 HTML"。

---

## 20. 实施进度更新

### 已完成阶段

- **P0（HTML 净化器）**：✅ 完成
  - 严格白名单验证
  - 禁用标签移除（`script`, `style`, `iframe`, `span`, `col`）
  - 表格包装层提升（`thead`, `tbody`, `tfoot`, `colgroup`）
  - 全角空格保护机制

- **P1（HTML 拆分引擎）**：✅ 完成
  - 4 种模块类型识别：`gap`, `image`, `table`, `text`
  - 连续 `<br>` 与 `<p><br></p>` 识别为间隔模块
  - 每个 `<p>` 标签拆分为独立文本模块
  - 全角空格保护机制

- **P2（模块渲染器）**：✅ 完成
  - iframe 隔离渲染
  - 模块类型图标显示
  - 编辑叠加层与内容分离
  - HTML 导出清洁处理

- **P3（文本编辑器）**：✅ 完成
  - `contenteditable` 实现
  - 单击激活，失焦保存
  - 浮动工具栏（`<b>`, `<font>`, `<a>`）
  - 输出严格控制
  - 全角空格保护

- **P-UI（前端集成）**：✅ 完成
  - **流程优化**：
    1. 点击顶部工具栏"导入 HTML"按钮
    2. 粘贴 HTML 代码并确认
    3. 创建自定义 HTML 模块（显示在 Canvas 中）
    4. 点击模块标题栏的"拆分"按钮
    5. 预览所有拆分后的模块（iframe 渲染）
    6. 二次确认后拆分成功
  - **UI 改动**：
    - `EditorLayout.tsx`：在第二行工具栏添加"导入 HTML"按钮
    - `ModuleRenderer.tsx`：为自定义 HTML 模块标题栏添加"拆分"按钮（非已拆分模块）
    - `SplitPreviewDialog.tsx`：使用 iframe 渲染所有模块预览，自动调整高度
  - **关键功能**：
    - 拆分预览显示完整的、无样式的原始 HTML
    - Canvas 预览使用 iframe 渲染，确保样式隔离
    - 全角空格在整个流程中正确保留（包括导入、拆分、编辑、导出）
    - 模块顺序正确保持（拆分后在原位置插入）

### 待实施阶段

- **P4（图片选择器）**：未开始
- **P5（源码编辑器）**：未开始
- **P6（选择/导出）**：未开始
- **P7（对照与回归测试）**：未开始
