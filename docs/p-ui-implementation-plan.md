# P-UI 前端集成实施方案

> 版本：v1.0  
> 日期：2025-10-13  
> 状态：🔄 进行中

---

## 1. 目标

在现有 Editor 中集成 HTML 拆分功能，替换自定义 HTML 模块的逻辑，提供完整的"导入 → 拆分 → 编辑 → 导出"工作流。

---

## 2. 集成位置

### 2.1 入口点：`Canvas.tsx`

**现有流程**：
1. 用户点击"代码"按钮（`Code` 图标）
2. 打开 `CodeDialog`，显示模块的导出 HTML
3. 用户可编辑 HTML，点击"应用"后转为自定义模块

**新增流程**：
1. 用户点击"代码"按钮
2. 打开 `CodeDialog`，显示模块的导出 HTML
3. **新增**："拆分为模块"按钮（仅自定义模块或新建时显示）
4. 点击"拆分为模块" → 打开 `SplitPreviewDialog`
5. 预览拆分结果（模块数量、类型分布）
6. 确认 → 替换当前模块为拆分后的多个模块

### 2.2 渲染点：`ModuleRenderer.tsx`

**现有逻辑**：
- `PageModuleType.CUSTOM` → 使用 `EditableCustomHTMLRenderer`（iframe 渲染）

**新增逻辑**：
- 检测模块是否为"拆分后的模块"（通过 `metadata.isSplitModule` 标识）
- 如果是拆分模块 → 使用 `HtmlSplitEditor` 渲染（就地编辑）
- 如果是普通自定义模块 → 保持原有 iframe 渲染

---

## 3. 新增组件

### 3.1 `HtmlSplitEditor.tsx`

**职责**：集成 P0-P3 的核心功能，提供就地编辑界面

**Props**：
```ts
interface HtmlSplitEditorProps {
  modules: HtmlModule[]           // 拆分后的模块列表
  onUpdate: (modules: HtmlModule[]) => void  // 模块更新回调
  onExport: () => string          // 导出 HTML
}
```

**功能**：
- 使用 `moduleRenderer.ts` 渲染模块
- 集成 `textEditor.ts` 提供文本编辑
- 管理模块选择、删除、重排序
- 提供导出功能

**实现要点**：
```tsx
import { mountEditor } from '@/lib/moduleRenderer'
import { exportModulesHtml } from '@/lib/htmlSplitter'

export function HtmlSplitEditor({ modules, onUpdate, onExport }: HtmlSplitEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<ModuleState | null>(null)

  useEffect(() => {
    if (!editorRef.current) return
    
    // 挂载编辑器
    const state = mountEditor(editorRef.current, modules)
    stateRef.current = state
    
    return () => {
      // 清理
      if (stateRef.current) {
        stateRef.current.editCleanups.forEach(cleanup => cleanup())
      }
    }
  }, [modules])

  const handleExport = () => {
    if (!stateRef.current) return ''
    return exportModulesHtml(stateRef.current.list)
  }

  return (
    <div className="html-split-editor">
      <div ref={editorRef} className="pm-editor-root" />
      <div className="editor-toolbar">
        <Button onClick={() => onExport(handleExport())}>导出 HTML</Button>
      </div>
    </div>
  )
}
```

### 3.2 `SplitPreviewDialog.tsx`

**职责**：显示拆分预览，让用户确认后再替换模块

**Props**：
```ts
interface SplitPreviewDialogProps {
  open: boolean
  html: string                    // 待拆分的 HTML
  onConfirm: (modules: HtmlModule[]) => void
  onCancel: () => void
}
```

**功能**：
- 调用 `splitHtmlToModules` 拆分 HTML
- 显示拆分统计：总数、各类型数量
- 显示前 10 个模块的预览（类型 + 内容摘要）
- 确认按钮 → 返回拆分后的模块

**实现要点**：
```tsx
import { splitHtmlToModules } from '@/lib/htmlSplitter'

export function SplitPreviewDialog({ open, html, onConfirm, onCancel }: SplitPreviewDialogProps) {
  const [modules, setModules] = useState<HtmlModule[]>([])
  const [stats, setStats] = useState({ total: 0, gap: 0, image: 0, table: 0, text: 0 })

  useEffect(() => {
    if (!open || !html) return
    
    try {
      const splitModules = splitHtmlToModules(html)
      setModules(splitModules)
      
      // 统计
      const stats = splitModules.reduce((acc, m) => {
        acc[m.kind]++
        acc.total++
        return acc
      }, { total: 0, gap: 0, image: 0, table: 0, text: 0 })
      setStats(stats)
    } catch (error) {
      console.error('拆分失败:', error)
    }
  }, [open, html])

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>拆分预览</DialogTitle>
        </DialogHeader>
        
        <div className="split-stats">
          <p>总计：{stats.total} 个模块</p>
          <ul>
            <li>间隔：{stats.gap} 个</li>
            <li>图片：{stats.image} 个</li>
            <li>表格：{stats.table} 个</li>
            <li>文本：{stats.text} 个</li>
          </ul>
        </div>

        <div className="module-preview">
          <h4>前 10 个模块预览：</h4>
          {modules.slice(0, 10).map((m, i) => (
            <div key={m.id} className="preview-item">
              <span className="module-index">{i + 1}.</span>
              <span className="module-type">[{m.kind}]</span>
              <span className="module-content">{m.html.substring(0, 50)}...</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button onClick={() => onConfirm(modules)}>确认拆分</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 4. 修改现有组件

### 4.1 `Canvas.tsx`

**修改点 1**：在代码对话框中添加"拆分为模块"按钮

```tsx
// 在 CodeDialog 的 footer 中添加
<DialogFooter>
  {/* 现有按钮 */}
  <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>
    {tEditor('取消')}
  </Button>
  <Button onClick={resetCode} disabled={!hasCodeChanges}>
    {tEditor('重置')}
  </Button>
  <Button onClick={applyCodeChanges} disabled={!hasCodeChanges}>
    {tEditor('应用')}
  </Button>
  
  {/* 新增：拆分按钮（仅自定义模块显示） */}
  {currentModuleForCode?.type === PageModuleType.CUSTOM && (
    <Button 
      variant="secondary" 
      onClick={() => {
        setSplitPreviewOpen(true)
        setCodeDialogOpen(false)
      }}
    >
      拆分为模块
    </Button>
  )}
</DialogFooter>
```

**修改点 2**：添加拆分预览对话框

```tsx
const [splitPreviewOpen, setSplitPreviewOpen] = useState(false)

// 处理拆分确认
const handleSplitConfirm = (modules: HtmlModule[]) => {
  if (!currentModuleForCode) return
  
  // 1. 删除当前模块
  const currentIndex = currentPage.modules.findIndex(m => m.id === currentModuleForCode.id)
  deleteModule(currentModuleForCode.id)
  
  // 2. 在相同位置插入拆分后的模块
  modules.forEach((htmlModule, i) => {
    const newModule = {
      type: PageModuleType.CUSTOM,
      customHTML: htmlModule.html,
      metadata: {
        isSplitModule: true,
        splitModuleKind: htmlModule.kind,
        splitModuleId: htmlModule.id
      },
      name: `${htmlModule.kind} 模块`
    }
    
    // 插入到正确位置
    addModule(newModule, currentIndex + i)
  })
  
  markUnsaved()
  setSplitPreviewOpen(false)
}

// 在 return 中添加
<SplitPreviewDialog
  open={splitPreviewOpen}
  html={moduleCode}
  onConfirm={handleSplitConfirm}
  onCancel={() => setSplitPreviewOpen(false)}
/>
```

### 4.2 `ModuleRenderer.tsx`

**修改点**：检测拆分模块并使用不同的渲染器

```tsx
case PageModuleType.CUSTOM: {
  const customHTML = module.customHTML || ''
  const isSplitModule = module.metadata?.isSplitModule === true
  
  // 如果是拆分模块，使用就地编辑器
  if (isSplitModule) {
    return (
      <div className="split-module-container">
        <HtmlSplitEditor
          modules={[{
            id: module.metadata.splitModuleId,
            kind: module.metadata.splitModuleKind,
            html: customHTML,
            rawFragment: customHTML
          }]}
          onUpdate={(modules) => {
            if (modules[0]) {
              onUpdate?.({ customHTML: modules[0].html })
            }
          }}
          onExport={() => customHTML}
        />
      </div>
    )
  }
  
  // 否则使用原有的 iframe 渲染
  return (
    <div className="custom-html-module">
      {/* 原有逻辑 */}
      <EditableCustomHTMLRenderer
        html={customHTML}
        isEditing={isEditing}
        onUpdate={html => onUpdate?.({ customHTML: html })}
      />
    </div>
  )
}
```

---

## 5. 数据流

```
用户输入 HTML
    ↓
点击"拆分为模块"
    ↓
splitHtmlToModules(html) → HtmlModule[]
    ↓
SplitPreviewDialog 显示统计
    ↓
用户确认
    ↓
转换为 PageModule[] (type: CUSTOM, metadata: { isSplitModule: true })
    ↓
插入到 Canvas
    ↓
ModuleRenderer 检测 isSplitModule
    ↓
使用 HtmlSplitEditor 渲染
    ↓
用户编辑（文本/图片/源码）
    ↓
exportModulesHtml() → 纯 HTML
    ↓
保存到 PageModule.customHTML
```

---

## 6. 验收标准

### 6.1 功能验收

- [ ] **拆分入口**：自定义模块的代码对话框中显示"拆分为模块"按钮
- [ ] **拆分预览**：点击后显示拆分统计和前 10 个模块预览
- [ ] **模块插入**：确认后在原位置插入拆分后的多个模块
- [ ] **就地渲染**：拆分后的模块使用 `HtmlSplitEditor` 渲染，显示 overlay
- [ ] **文本编辑**：单击文本/表格模块激活编辑，显示工具条
- [ ] **模块操作**：可选择、删除、重排序拆分后的模块
- [ ] **导出一致**：导出的 HTML 与输入一致（仅净化差异）

### 6.2 集成验收

- [ ] **与现有模块共存**：拆分模块与其他模块类型可以混合排列
- [ ] **保存/加载**：拆分模块可正常保存到数据库并重新加载
- [ ] **撤销/重做**：拆分操作支持撤销和重做
- [ ] **性能**：拆分 38 个模块的 `html temple` 无明显卡顿

### 6.3 边界情况

- [ ] **空 HTML**：输入空 HTML 时提示错误
- [ ] **无效 HTML**：输入无效 HTML 时显示解析错误
- [ ] **单模块**：只拆分出 1 个模块时也能正常处理
- [ ] **大量模块**：拆分出 100+ 模块时性能可接受

---

## 7. 实施步骤

### Step 1: 创建基础组件（~2 小时）

1. 创建 `HtmlSplitEditor.tsx`（基础版，只渲染不编辑）
2. 创建 `SplitPreviewDialog.tsx`
3. 添加必要的样式文件

### Step 2: 集成到 Canvas（~2 小时）

1. 修改 `Canvas.tsx`，添加拆分按钮和对话框
2. 实现 `handleSplitConfirm` 逻辑
3. 测试拆分流程

### Step 3: 修改 ModuleRenderer（~1 小时）

1. 添加拆分模块检测逻辑
2. 集成 `HtmlSplitEditor`
3. 测试渲染切换

### Step 4: 完善编辑功能（~2 小时）

1. 在 `HtmlSplitEditor` 中集成 `textEditor.ts`
2. 实现模块选择、删除、重排序
3. 实现导出功能

### Step 5: 测试与优化（~1 小时）

1. 使用 `html temple` 进行端到端测试
2. 修复发现的问题
3. 性能优化

**总计：~8 小时（1 个工作日）**

---

## 8. 后续集成（P4-P7）

### P4: 图片选择器

- 在 `HtmlSplitEditor` 中监听图片点击事件
- 调用现有 `ImagePicker` 组件
- 更新模块的 `<img src>`

### P5: 源码抽屉

- 为每个模块添加"源码"按钮
- 打开 `ModuleSourceDrawer`，显示模块 HTML
- 保存时调用 `sanitizeHtml` 并更新模块

### P6: 选择/导出

- 支持多选模块（Ctrl+Click）
- 添加"导出所选"按钮
- 调用 `exportModulesHtml` 导出选中的模块

### P7: 对照验收

- 创建自动化测试脚本
- 对比拆分结果与 `html temple flip`
- 性能基准测试

---

## 9. 注意事项

### 9.1 数据模型兼容性

- 拆分后的模块存储为 `PageModule` 类型（`type: CUSTOM`）
- 使用 `metadata.isSplitModule` 标识拆分模块
- 保持与现有数据库 schema 兼容

### 9.2 样式隔离

- `HtmlSplitEditor` 的样式不能影响其他模块
- 使用 CSS Modules 或 scoped styles
- 确保 overlay 样式不污染导出 HTML

### 9.3 性能考虑

- 大量模块时使用虚拟滚动（可选）
- 仅激活当前编辑的模块
- 导出时批量处理，避免多次 DOM 操作

### 9.4 用户体验

- 拆分前显示预览，避免意外操作
- 提供撤销功能
- 拆分进度提示（如果耗时较长）
- 清晰的视觉反馈（选中、hover、编辑中）

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 与现有模块系统冲突 | 高 | 使用 metadata 标识，保持向后兼容 |
| 性能问题（大量模块） | 中 | 虚拟滚动、懒加载、仅激活当前模块 |
| 样式污染 | 中 | CSS Modules、严格的样式隔离 |
| 数据丢失（拆分失败） | 高 | 拆分前备份、提供撤销功能 |
| 用户误操作 | 中 | 拆分预览、二次确认 |

---

## 11. 成功指标

- ✅ 用户可从代码对话框拆分 HTML
- ✅ 拆分后的模块可正常编辑和导出
- ✅ 导出的 HTML 与输入一致（仅净化差异）
- ✅ 性能：拆分 38 个模块 < 1 秒，编辑流畅无卡顿
- ✅ 与现有模块系统无冲突
- ✅ 通过 `html temple` 端到端测试

---

**下一步**：开始实施 Step 1，创建基础组件 🚀

