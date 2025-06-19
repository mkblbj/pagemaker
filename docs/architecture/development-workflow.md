# 开发工作流 (Development Workflow)

## 13.1 环境准备 (Prerequisites)

在开始之前，开发者的本地计算机需要安装以下工具：

* **Node.js**: `v20.11.0` 或更高版本。
* **pnpm**: `v9.x` 或更高版本 (我们的Monorepo包管理器)。
* **Python**: `v3.12` 或更高版本。
* **MySQL**: `v8.4` 或更高版本，或通过 **Docker** 运行。
* **Git**: 版本控制系统。

## 13.2 首次设置 (Initial Setup)

当开发者第一次克隆项目代码库后，需要执行以下一次性设置步骤：

1.  **安装所有Node.js依赖**:
    ```bash
    pnpm install
    ```

2.  **创建并激活Python虚拟环境**:
    ```bash
    # 进入后端目录
    cd apps/backend
    # 创建虚拟环境
    python -m venv venv
    # 激活虚拟环境 (macOS/Linux)
    source venv/bin/activate
    # 或者 (Windows)
    # venv\Scripts\activate
    ```

3.  **安装Python依赖**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **配置环境变量**:
    ```bash
    cp .env.example .env
    ```

5.  **初始化数据库**:
    ```bash
    # 确保你仍在 apps/backend 目录且虚拟环境已激活
    python pagemaker/manage.py migrate
    ```

## 13.3 日常开发命令 (Development Commands)

* **一键启动所有服务 (推荐)**:
    ```bash
    pnpm run dev
    ```

* **单独启动服务**:
    ```bash
    # 仅启动前端Next.js开发服务器
    pnpm --filter frontend dev

    # 仅启动后端Django开发服务器
    pnpm --filter backend dev
    ```

* **运行测试**:
    ```bash
    pnpm test
    ``` 