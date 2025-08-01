# 史诗和用户故事 (Epic Overview)

## **史诗 0: 项目基础设施设置**
* **目标 (Goal):** 建立完整的开发环境、项目结构和基础设施，确保开发团队能够高效协作，并为后续功能开发奠定坚实的技术基础。

### **用户故事 (User Stories - Epic 0)**

#### **Story 0.1: Monorepo项目结构创建**
* **用户故事:** 作为开发者，我希望有一个标准化的Monorepo项目结构，以便前后端代码能够统一管理，共享类型定义，并支持高效的开发工作流。
* **验收标准 (ACs):**
    1. 创建符合架构文档的Monorepo目录结构（frontend/, backend/, packages/types/）。
    2. 配置根级package.json支持workspace管理。
    3. 建立基础的.gitignore和环境变量模板文件。
    4. 创建项目根目录README.md，包含项目概述和快速开始指南。

#### **Story 0.2: 前端Next.js项目初始化**
* **用户故事:** 作为前端开发者，我希望有一个预配置的Next.js项目环境，以便能够立即开始UI组件开发，无需花时间在基础配置上。
* **验收标准 (ACs):**
    1. 使用Next.js 15.3初始化前端项目，配置App Router。
    2. 集成并配置Tailwind CSS 4.1、shadcn/ui 2.6、ahooks。
    3. 设置ESLint、Prettier代码格式化规则。
    4. 配置TypeScript严格模式和路径别名。
    5. 创建基础的布局组件和路由结构。

#### **Story 0.3: 后端Django项目初始化**
* **用户故事:** 作为后端开发者，我希望有一个结构化的Django项目环境，以便能够立即开始API开发，并确保代码质量和安全性。
* **验收标准 (ACs):**
    1. 使用Django 5.x创建项目，按功能划分apps（users, pages, media, api）。
    2. 配置MySQL 8.4+数据库连接和基础设置。
    3. 集成Django REST Framework和JWT认证。
    4. 配置CORS、安全中间件和环境变量管理。
    5. 设置black、flake8代码质量工具。

#### **Story 0.4: 共享类型包设置**
* **用户故事:** 作为开发团队，我希望有一个共享的TypeScript类型定义包，以便前后端能够保持数据结构的一致性，减少集成错误。
* **验收标准 (ACs):**
    1. 创建packages/types包，定义API请求/响应接口。
    2. 定义PageTemplate、User等核心数据模型类型。
    3. 配置类型包的构建和发布流程。
    4. 在前后端项目中正确引用共享类型。

#### **Story 0.5: 开发环境配置和文档**
* **用户故事:** 作为新加入的开发者，我希望有清晰的开发环境设置指南，以便能够快速搭建本地开发环境并开始贡献代码。
* **验收标准 (ACs):**
    1. 创建详细的开发环境设置文档（Node.js、Python、MySQL版本要求）。
    2. 提供一键启动脚本（pnpm run dev, python manage.py runserver）。
    3. 配置开发环境的热重载和调试功能。
    4. 创建开发者贡献指南和代码规范文档。

#### **Story 0.6: v0.dev工具链验证原型**
* **用户故事:** 作为前端开发者，我希望验证v0.dev工具链的可行性和代码质量，以便确保它能够满足我们的UI开发需求并与项目技术栈兼容。
* **验收标准 (ACs):**
    1. 使用v0.dev生成2-3个核心UI组件原型（编辑器布局、模块列表、属性面板）。
    2. 评估生成代码的质量、可维护性和与shadcn/ui的兼容性。
    3. 测试生成组件的响应式设计和无障碍访问性。
    4. 文档化v0.dev最佳实践和限制，制定使用指南。
    5. 如发现重大问题，准备备用UI开发策略。

#### **Story 0.7: GitHub Actions基础配置**
* **用户故事:** 作为开发团队，我希望有自动化的CI/CD管道，以便代码提交时能够自动运行测试、代码检查和部署流程，确保代码质量。
* **验收标准 (ACs):**
    1. 配置GitHub Actions工作流，支持前后端代码检查（lint、format）。
    2. 设置自动化测试运行（前端Jest/Vitest，后端pytest）。
    3. 配置开发环境自动部署（前端到Vercel，后端到云服务器）。
    4. 设置代码覆盖率报告和质量门禁。
    5. 配置安全扫描和依赖漏洞检查。

#### **Story 0.8: 乐天API访问验证和文档整理**
* **用户故事:** 作为后端开发者，我希望验证乐天API的访问方式并整理相关文档，以便为后续的R-Cabinet集成做好准备，降低集成风险。
* **验收标准 (ACs):**
    1. 研究并验证乐天API文档的访问方式（登录要求、权限等）。
    2. 创建乐天API集成的技术文档和最佳实践。
    3. 实现基础的R-Cabinet连接测试和错误处理。
    4. 识别API限制、配额和潜在的技术风险。
    5. 制定API集成的备用方案和降级策略。

#### **Story 0.9: R-Cabinet集成原型和错误处理**
* **用户故事:** 作为开发者，我希望建立稳定的R-Cabinet集成机制，以便图片上传功能能够可靠工作，并有完善的错误处理和用户反馈。
* **验收标准 (ACs):**
    1. 实现R-Cabinet API的基础连接和认证机制。
    2. 创建图片上传的原型功能，包含进度显示和错误处理。
    3. 实现文件格式验证和大小限制检查。
    4. 设计用户友好的错误提示和重试机制。
    5. 建立R-Cabinet服务的健康检查和降级策略。
    6. 文档化R-Cabinet集成的最佳实践和限制。

## **史诗 1: CMS核心编辑与基础模块实现**
* **目标 (Goal):** 搭建Pagemaker的核心可视化编辑器框架，实现所有基础内容模块的创建、编辑和HTML导出功能，确保运营团队能够用基础模块搭建和导出简单的页面内容。
* **前置依赖:** Epic 0完成（项目基础设施、开发环境、技术验证）

### **用户故事 (User Stories - Epic 1)**

#### **Story 1.1: 可视化编辑器基本框架**
* **用户故事:** 作为运营专员，我希望能在一个可视化的编辑界面中搭建页面布局，以便直观地安排内容模块，并能实时预览大致效果。
* **验收标准 (ACs):**
    1. CMS界面包含清晰划分的模块列表区、编辑画布区、属性编辑区。
    2. 用户能将注意力集中在画布区进行编排。
    3. 画布区能大致反映页面的实时预览效果，并随配置更改而更新。
    4. 编辑器界面在主流桌面浏览器上能正确显示和操作。
    5. 用户能清晰地选择或看到当前正在编辑的乐天店铺"目标区域"。

#### **Story 1.2: 模块基本操作**
* **用户故事:** 作为运营专员，我希望能够从模块列表中将内容模块拖拽到编辑区域，并能调整它们的顺序和删除它们，以便灵活地构建页面。
* **验收标准 (ACs):**
    1. 编辑器界面展示一个包含所有可用基础内容模块的列表。
    2. 用户能通过拖拽将模块放置到画布区。
    3. 拖拽过程中有清晰的视觉指示。
    4. 用户能通过拖拽改变已在画布区中模块的顺序。
    5. 用户能通过明确的二级菜单操作将模块从画布中移除。
    6. 本故事专注于模块的添加、排序和删除等容器级操作。

#### **Story 1.3: 页面HTML导出**
* **用户故事:** 作为运营专员，我希望能够一键导出当前在编辑器中构建的页面的完整、干净的HTML代码，以便将其手动粘贴到乐天店铺后台。
* **验收标准 (ACs):**
    1. 编辑器界面提供清晰的"导出页面HTML"入口。
    2. 点击后，系统能将画布内容准确转换为一个完整的HTML文档结构。
    3. 生成的HTML代码应相对纯净，减少CMS编辑器自身相关的辅助代码。
    4. 导出时，系统应允许用户方便地将生成的完整页面HTML代码**复制到剪贴板**，无需下载文件功能。

#### **Story 1.4: 标题模块集成与配置**
* **用户故事:** 作为运营专员，我希望能够在Pagemaker编辑器中使用"标题模块"，并能设置其文本内容、标题级别、对齐方式、字体和加粗，以便在页面中添加和定制各种标题。
* **验收标准 (ACs):**
    1. 用户能将"标题模块"添加到画布上。
    2. 用户能直接编辑模块内的文本内容。
    3. 用户能在属性面板中选择HTML标题级别 (H1-H6)。
    4. 用户能在属性面板中设置文本对齐方式。
    5. 用户能在属性面板中选择预设字体和设置是否加粗。
    6. 导出的HTML能正确反映所有配置。
    7. 编辑器中的预览能实时更新。

#### **Story 1.5: 文本模块集成与配置**
* **用户故事:** 作为运营专员，我希望能够在Pagemaker编辑器中使用"文本模块"，并能编辑其文本内容、进行基础格式化、设置对齐方式、大小、字体、颜色以及文本块背景色，以便在页面中添加和排版段落文字。
* **验收标准 (ACs):**
    1. 用户能将"文本模块"添加到画布上。
    2. 用户能编辑模块内的多段文本内容。
    3. 用户能对选中文本进行格式化（加粗、下划线、超链接）。
    4. 用户能设置文本的整体对齐方式。
    5. 用户能选择预设字体、文本颜色，文字大小，并能设置文本块背景色。
    6. 导出的HTML能正确反映所有配置。
    7. 编辑器中的预览能实时更新。

#### **Story 1.6: 单张图片模块集成与配置**
* **用户故事:** 作为运营专员，我希望能够在Pagemaker编辑器中使用"单张图片模块"，并能从R-Cabinet上传/选择图片、设置alt文本、对齐方式、添加链接和调整显示尺寸，以便在页面中灵活地展示图片。
* **验收标准 (ACs):**
    1. 用户能将"单张图片模块"添加到画布上。
    2. 用户能从本地上传新图片到R-Cabinet，或从R-Cabinet中选择已有图片。
    3. 用户能为图片设置"alt"文本。
    4. 用户能为图片设置对齐方式。
    5. 用户能为图片添加多种类型的超链接（URL、Email、Phone、Anchor）。
    6. 用户能通过预设选项或百分比调整图片显示尺寸。
    7. 导出的HTML能正确反映所有配置。
    8. 编辑器中的预览能实时更新。

#### **Story 1.7: 分隔模块集成与配置**
* **用户故事:** 作为运营专员，我希望能够在Pagemaker编辑器中使用"分隔模块"，并能选择其类型（线条或空白间距）以及配置其基本样式，以便在页面中分隔内容或创建视觉间距。
* **验收标准 (ACs):**
    1. 用户能将"分隔模块"添加到画布上。
    2. 用户能在属性面板中选择类型：线条分隔或空白间距。
    3. 当类型为线条时，用户能配置其样式、颜色和粗细。
    4. 当类型为空白时，用户能选择其预设高度。
    5. MVP阶段，模块默认撑满容器宽度。
    6. 导出的HTML能正确反映所有配置。
    7. 编辑器中的预览能实时更新。

#### **Story 1.8: 两列式键值对/表格模块集成与配置**
* **用户故事:** 作为运营专员，我希望能够在Pagemaker编辑器中使用"两列式键值对/表格模块"，并能输入/管理键值对行、设置标签列背景色和文本颜色，以便在页面中清晰地展示商品属性等信息。
* **验收标准 (ACs):**
    1. 用户能将"两列式键值对/表格模块"添加到画布上。
    2. 用户能在属性面板中输入多组成对的"标签/键"和"内容/值"。
    3. 用户能方便地增加或删除键值对行。
    4. 用户能在属性面板中为文本选择颜色，并为标签列设置背景色。
    5. 导出的HTML能正确反映所有配置。
    6. 编辑器中的预览能实时更新。
    7. 选中模块后，用户可以在属性面板中方便地输入和管理键值对行，这些数据将作为页面内容JSON结构的一部分，通过`PUT /api/v1/pages/{id}/ `接口进行统一保存。



## **史诗 2: 高级内容模块与页面管理MVP功能**
* **目标 (Goal):** 在核心编辑器基础上，集成选定的高级内容模块，并实现MVP版本的页面/模板管理功能，以提升页面内容表达的丰富性和Pagemaker CMS的整体可用性。
* **前置依赖:** Epic 1完成（核心编辑器、基础模块、HTML导出）
* **并行开发机会:** Story 2.1（高级模块）可与Story 2.3-2.6（页面管理）并行开发

### **用户故事 (User Stories - Epic 2)**

#### **Story 2.1: 多列图文模块集成与配置**
* **用户故事:** 作为运营专员，我希望能在Pagemaker编辑器中使用"多列图文模块"，并能从四种预设布局中选择，以及方便地配置其中的图片和文本内容，以创建更丰富的图文组合。
* **验收标准 (ACs):**
    1. 用户能将"多列图文模块"添加到画布上。
    2. 用户能在属性面板中选择四种预设布局之一。
    3. 模块中的图片区域配置能力与Story 1.6一致。
    4. 模块中的文本区域配置能力与Story 1.5一致。
    5. 导出的HTML能支持响应式堆叠。
    6. MVP阶段，两列布局的列宽比例采用固定的预设值。
    7. 编辑器中的预览能实时更新。

#### **Story 2.3: 页面/模板管理视图框架**
* **用户故事:** 作为运营专员，我希望能有一个"页面管理"视图，可以列表形式清晰地查看我所有创建的页面或自定义布局模板，并能按文件夹/店铺进行组织，以便我能有效地管理我的工作成果。
* **验收标准 (ACs):**
    1. CMS中应有清晰的入口进入"页面/模板管理"视图。
    2. 视图以列表形式展示所有已创建的页面/模板。
    3. 列表至少显示名称、类型、最后修改日期。
    4. 视图提供按文件夹或店铺名称进行筛选或分组的功能。
    5. 列表中的每一行为后续的管理操作预留UI占位符。
    6. 视图中应包含"创建新页面"的按钮。

#### **Story 2.4: 创建与打开编辑页面/模板**
* **用户故事:** 作为运营专员，我希望能在管理视图中发起"创建新页面"的操作来打开一个空白的编辑器，并且能点击列表中已有的页面，进入其对应的编辑器进行修改，以便我开始新的创作或更新已有内容。
* **验收标准 (ACs):**
    1. 点击"创建新页面"按钮后，系统跳转到新的、空白的编辑器界面。
    2. 创建时，系统提示用户为新页面命名并指定乐天"目标区域"。
    3. 点击列表中已有的页面/模板，系统能正确加载其内容并跳转到编辑器界面。
    4. 在编辑器界面有"保存"按钮。点击后, **前端应调用 `PUT /api/v1/pages/{id}/` API** 将页面数据（注意：模块配置信息将作为统一的JSON结构保存在`PageTemplate`模型的`content`字段中）发送到后端进行保存。
    5. 保存并退出编辑器后，用户能返回管理视图，并看到更新信息。

#### **Story 2.5: 复制与删除页面/模板**
* **用户故事:** 作为运营专员，我希望能在管理视图中对已有的页面或布局模板执行"复制"（克隆）和"删除"操作，以便我高效复用现有设计或清理不再需要的草稿。
* **验收标准 (ACs):**
    1. 点击"复制"操作后，系统在列表中即时创建一个该页面/模板的完整副本。
    2. 新创建的副本有明确的标识（如名称添加"- 副本"后缀），修改日期为当前时间。
    3. 点击"删除"操作后，系统必须弹出二次确认对话框以防误删。
    4. 当用户在确认对话框中确认删除后，前端应调用 **`DELETE /api/v1/pages/{id}/` API**，成功后该页面/模板条目从列表中被移除。

#### **Story 2.6: 店铺API与FTP凭据配置管理**
* **用户故事:** 作为管理员(administrator)，我希望有一个"店铺配置"页面，可以在其中为每个店铺安全地输入、保存和管理乐天API的serviceSecret、licenseKey以及FTP的连接凭据，以便Pagemaker系统能够成功与乐天服务进行认证和数据交换，从而启用图片上传等核心功能。
* **验收标准 (ACs):**
    1. 在CMS主导航区域，应有一个仅对admin角色用户可见的"店铺配置"入口。
    2. 配置页面以列表形式展示所有已创建的店铺配置，列表项应显示店铺名称和目标区域。
    3. 页面提供"新增配置"功能，点击后弹出表单。
    4. 表单中包含所有必要字段：店铺名称、目标区域、API Service Secret、API License Key、FTP主机、FTP端口、FTP用户和FTP密码。
    5. 所有密钥和密码输入框在输入时必须以密文（●●●●●●）形式显示，以防旁人窥视。
    6. 提交保存后，凭据信息通过API安全地发送到后端进行加密存储。
    7. 在编辑一个已存在的配置时，页面应能显示其"API密钥到期日"，并提供一个"刷新"按钮来触发调用 POST /api/v1/shop-configurations/{id}/refresh-expiry 接口，以更新此日期。
    8. 任何保存或更新操作后，界面都应提供清晰的成功或失败提示。

# Epic依赖关系与并行开发策略 (Epic Dependencies & Parallel Development Strategy)

## 依赖关系图
```
Epic 0 (基础设施) → Epic 1 (核心编辑器) → Epic 2 (高级功能)
     ↓                    ↓                    ↓
Story 0.1-0.8        Story 1.1-1.9        Story 2.1, 2.3-2.6
     ↓                    ↓                    ↓
项目脚手架           编辑器框架           高级模块 + 页面管理
技术验证             基础模块             
CI/CD设置            HTML导出             
```

## 关键依赖点
- **Epic 1 → Epic 0:** 所有Epic 1故事依赖Epic 0的项目基础设施完成
- **Epic 2 → Epic 1:** Epic 2依赖Epic 1的核心编辑器框架（Story 1.1-1.3）
- **Story 1.6, 1.9 → Story 0.8:** 图片模块依赖R-Cabinet集成验证

## 并行开发机会
- **Epic 0内部:** Story 0.1-0.5可并行进行，Story 0.6-0.8可在基础设施完成后并行
- **Epic 1内部:** Story 1.4-1.7（基础模块）可在编辑器框架（Story 1.1-1.3）完成后并行开发
- **Epic 2内部:** Story 2.1（高级模块）与Story 2.3-2.6（页面管理）可完全并行

## 关键路径
Epic 0 → Story 1.1-1.3 → Story 2.3-2.6（页面管理功能为MVP核心价值）

# 测试策略补充 (Enhanced Testing Strategy)

## 前端测试策略（已定义）
- **组件测试:** Vitest + React Testing Library
- **集成测试:** 模拟store和API（msw）
- **E2E测试:** Playwright覆盖核心用户旅程

## 后端测试策略（新增）
- **单元测试:** pytest覆盖所有模型、视图和工具函数
- **API测试:** Django REST Framework测试客户端，覆盖所有端点
- **集成测试:** 真实数据库环境下的完整API流程测试
- **性能测试:** 大量页面数据的CRUD操作性能验证

## 测试覆盖率目标
- **前端:** 组件覆盖率 ≥ 80%，关键业务逻辑 ≥ 90%
- **后端:** 代码覆盖率 ≥ 85%，API端点覆盖率 100%

## 测试数据管理
- **前端:** 使用MSW模拟API响应，维护标准测试数据集
- **后端:** Django fixtures提供一致的测试数据，每个测试独立的数据库状态 