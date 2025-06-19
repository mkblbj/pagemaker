# 部署架构 (Deployment Architecture)

## 14.1 部署策略 (Deployment Strategy)

* **开发环境 (Vercel + 云服务器):**
    * **前端**: 任何推送到GitHub主开发分支的代码，都会触发 **GitHub Actions**。该Action会自动将Next.js应用部署到 **Vercel**。
    * **后端**: 后端的部署将采用手动或半自动化的脚本，通过SSH将最新的代码部署到云服务器上。

* **生产环境 (内网服务器):**
    * **部署流程**: 生产部署将是一个严格、受控的过程，涉及构建产物的部署。
    * **零停机部署**: 为了在更新时服务不中断，我们将采用**蓝绿部署 (Blue-Green Deployment)** 策略。

## 14.2 CI/CD 管道 (CI/CD Pipeline)

我们将使用 **GitHub Actions** 作为我们的CI/CD工具。

* **CI (持续集成) 流程 - 针对所有提交:**
    1.  代码检出
    2.  依赖安装
    3.  代码检查 (ESLint, Flake8)
    4.  自动化测试 (Vitest, Pytest)
    5.  构建检查

* **CD (持续部署) 流程 - 仅针对主开发分支:**
    1.  执行所有CI步骤。
    2.  如果成功，自动将前端部署到Vercel。 