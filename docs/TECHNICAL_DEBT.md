# 技术债务清单 (Technical Debt Backlog)

## 概述
本文档记录项目中的技术债务项目，包括已知问题、待优化项目和需要关注的技术更新。

---

## 🔴 高优先级 (High Priority)

*暂无*

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

### 2. CI/CD 流程问题 🔧

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

### 2. Pydantic V2迁移警告
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

- **总计**: 3个活跃技术债务项目
- **高优先级**: 0个
- **中优先级**: 2个
- **低优先级**: 2个
- **已解决**: 2个

---

## 🔄 更新日志

- **2025-01-23**: 创建技术债务清单，记录React 19兼容性问题和测试相关问题 