# 技术债务清单 (Technical Debt Backlog)

## 概述
本文档记录项目中的技术债务项目，包括已知问题、待优化项目和需要关注的技术更新。

---

## 🔴 高优先级 (High Priority)

### 1. 文本模块XSS安全漏洞 🚨
- **问题描述**: TextModule组件允许HTML内容但缺乏内容清理机制
- **具体表现**: 
  - `content: string` 字段支持HTML格式化但未进行安全过滤
  - 存在跨站脚本攻击(XSS)风险
- **影响范围**: 所有使用文本模块的页面，安全风险高
- **当前状态**: 生产环境存在安全风险
- **解决方案**: 
  - 立即：实现DOMPurify或类似HTML清理库
  - 配置HTML白名单，只允许安全标签
  - 添加内容长度限制防止DoS攻击
- **预计解决时间**: 1周内（紧急）
- **负责人**: 前端团队
- **创建时间**: 2025-01-23
- **相关文件**: 
  - `apps/frontend/src/components/modules/TextModule.tsx`
  - `packages/shared-types/src/modules.ts`

---

## 🟡 中优先级 (Medium Priority)

### 1. React 19与@testing-library兼容性问题
- **问题描述**: React 19.1.0与@testing-library/react 14.3.1存在类型兼容性问题
- **具体表现**: 
  - `act`函数在TypeScript中显示为deprecated警告
  - @types/react 19.1.8与@testing-library/react类型定义不匹配
- **影响范围**: 开发体验（IDE警告），不影响功能运行
- **当前状态**: 非阻塞，测试正常运行
- **解决方案**: 
  - 短期：继续使用，等待社区更新
  - 中期：升级@testing-library/react到兼容版本
  - 长期：使用React原生`act`函数替代
- **预计解决时间**: 1-2个月内（等待社区更新）
- **负责人**: 前端团队
- **创建时间**: 2025-06-23
- **相关链接**: 
  - [GitHub Issue #1316](https://github.com/testing-library/react-testing-library/issues/1316)
  - [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

### 2. 文本模块性能优化需求 ⚡
- **问题描述**: TextModule在大规模使用场景下存在性能问题
- **具体表现**: 
  - 文本编辑时频繁触发状态更新，未实现防抖
  - 大量文本模块同时渲染可能影响页面性能
  - 缺乏内容大小限制，可能导致内存溢出
- **影响范围**: 包含大量文本模块的页面性能
- **当前状态**: 功能正常，性能待优化
- **解决方案**: 
  - 实现文本编辑防抖机制（300ms延迟）
  - 添加虚拟化或懒加载支持
  - 设置文本内容大小限制（如10MB）
- **预计解决时间**: 2周内
- **负责人**: 前端团队
- **创建时间**: 2025-01-23
- **相关文件**: 
  - `apps/frontend/src/components/modules/TextModule.tsx`
  - `apps/frontend/src/stores/usePageStore.ts`

### 3. 文本模块无障碍访问性改进 ♿
- **问题描述**: TextModule缺乏完整的无障碍访问性支持
- **具体表现**: 
  - 富文本编辑器键盘导航待验证
  - 颜色对比度未进行检查
  - 屏幕阅读器兼容性待测试
- **影响范围**: 视障用户和使用辅助技术的用户
- **当前状态**: 基础功能可用，无障碍性待完善
- **解决方案**: 
  - 添加ARIA标签和角色定义
  - 实现完整的键盘导航支持
  - 颜色对比度检查和优化
  - 屏幕阅读器测试和优化
- **预计解决时间**: 3周内
- **负责人**: 前端团队
- **创建时间**: 2025-01-23
- **相关文件**: 
  - `apps/frontend/src/components/modules/TextModule.tsx`
  - `apps/frontend/src/components/ui/TextFormatToolbar.tsx`

### 4. CI/CD 流程问题 🔧

#### 安全检查问题
- **问题**: Safety工具需要注册登录才能使用
- **影响**: 安全扫描工作流无法在CI环境中自动运行
- **临时方案**: 回退依赖版本避免已知漏洞
- **建议解决**: 
  - 使用pip-audit替代safety（免费且功能强大）
  - 或配置Safety API密钥到GitHub Secrets
- **优先级**: 中等

#### 覆盖率报告问题  
- **问题**: Coverage Report工作流JSON解析或计算异常
- **影响**: 无法在PR中显示测试覆盖率报告
- **临时方案**: 手动运行测试检查覆盖率
- **建议解决**:
  - 检查coverage.py输出格式
  - 修复JSON解析逻辑
  - 添加更好的错误处理
- **优先级**: 低

#### 依赖版本回退
- **当前状态**: 
  - gunicorn: 23.0.0 → 21.2.0
  - PyJWT: 2.10.1 → 2.9.0
- **原因**: 避免安全扫描工具报告的漏洞
- **注意**: 需要定期检查是否有安全更新

---

## 🟢 低优先级 (Low Priority)

### 1. Pytest警告标记注册
- **问题描述**: 后端测试中存在未注册的pytest标记警告
- **具体表现**: 
  - `pytest.mark.unit` - Unknown pytest.mark warning
  - `pytest.mark.integration` - Unknown pytest.mark warning
- **影响范围**: 测试运行时警告信息，不影响测试结果
- **解决方案**: 在`pytest.ini`中注册自定义标记
- **预计解决时间**: 1周内
- **负责人**: 后端团队
- **创建时间**: 2025-06-23

### 2. 文本模块边界测试用例补充 🧪
- **问题描述**: TextModule缺乏边界情况和异常场景的测试覆盖
- **具体表现**: 
  - 缺少极长文本内容的处理测试
  - 缺少恶意HTML输入的验证测试
  - 缺少并发编辑冲突的测试场景
- **影响范围**: 测试覆盖完整性，潜在bug风险
- **解决方案**: 
  - 添加大文本内容性能测试
  - 添加XSS攻击向量测试
  - 添加并发编辑场景测试
  - 添加网络异常情况下的状态恢复测试
- **预计解决时间**: 1周内
- **负责人**: 前端团队
- **创建时间**: 2025-01-23
- **相关文件**: 
  - `apps/frontend/src/components/modules/TextModule.test.tsx`

### 3. 文本模块集成测试完善 🔗
- **问题描述**: 缺乏TextModule与其他系统组件的集成测试
- **具体表现**: 
  - 缺少页面保存/加载周期中格式保持的测试
  - 缺少撤销/重做操作状态一致性测试
  - 缺少HTML导出在乐天环境兼容性的自动化测试
- **影响范围**: 系统集成稳定性
- **解决方案**: 
  - 添加端到端的数据持久化测试
  - 添加状态管理集成测试
  - 添加HTML导出兼容性自动化测试
- **预计解决时间**: 2周内
- **负责人**: 前端团队
- **创建时间**: 2025-01-23
- **相关文件**: 
  - `apps/frontend/src/components/modules/TextModule.test.tsx`
  - `apps/frontend/src/services/htmlExportService.test.ts`

### 4. Pydantic V2迁移警告
- **问题描述**: 使用了Pydantic V1的class-based config语法
- **具体表现**: `Support for class-based config is deprecated, use ConfigDict instead`
- **影响范围**: 11个警告，未来版本兼容性
- **解决方案**: 迁移到Pydantic V2的ConfigDict语法
- **预计解决时间**: 2周内
- **负责人**: 后端团队
- **创建时间**: 2025-06-23

---

## 📋 待评估项目 (To Be Evaluated)

*暂无*

---

## ✅ 已解决项目 (Resolved)

### 1. 数据库测试权限问题 ✅
- **问题描述**: 测试用户缺少创建测试数据库的权限
- **解决方案**: 修改测试配置使用现有数据库，设置`CREATE_DB = False`
- **解决时间**: 2025-01-23
- **解决人**: 后端团队

### 2. 项目结构测试路径错误 ✅
- **问题描述**: 项目结构测试期望路径与实际结构不匹配
- **解决方案**: 修正测试中的目录结构验证逻辑
- **解决时间**: 2025-01-23
- **解决人**: 前端团队

---

## 📊 统计信息

- **总计**: 8个活跃技术债务项目
- **高优先级**: 1个
- **中优先级**: 4个
- **低优先级**: 4个
- **已解决**: 2个

---

## 🔄 更新日志

- **2025-01-23**: 基于Story 1.5 QA审查，新增文本模块相关技术债务项目
  - 新增高优先级XSS安全漏洞
  - 新增中优先级性能优化和无障碍性改进需求
  - 新增低优先级测试覆盖完善需求
- **2025-01-23**: 创建技术债务清单，记录React 19兼容性问题和测试相关问题 