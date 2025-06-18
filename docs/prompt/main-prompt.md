## High-Level Goal:
Create a responsive, three-column layout for a "Pagemaker" CMS editor interface using Next.js, TypeScript, and shadcn/ui.

## Detailed, Step-by-Step Instructions:

1.  **Overall Layout**:
    * Use Next.js 15.3 with the App Router.
    * Implement a full-height, three-column layout using Flexbox.
    * Above the three columns, create a main header bar.

2.  **Main Header Bar**:
    * On the left, display breadcrumb navigation: "页面管理 / 我正在编辑的页面标题".
    * On the right, place two shadcn/ui Buttons:
        * A primary action button styled with the brand's primary color, labeled "导出页面HTML".
        * A secondary (variant="outline") button labeled "保存并退出".

3.  **Left Column (Module Panel)**:
    * Make it a fixed width of `280px`.
    * Give it a header that says "模块选择".
    * Below the header, create a scrollable list.
    * Populate the list with several placeholder "module" items using shadcn/ui `Card` components. Each card should contain a Lucide Icon and a label. For example:
        * Icon: `Heading1`, Label: "标题模块"
        * Icon: `Pilcrow`, Label: "文本模块"
        * Icon: `Image`, Label: "图片模块"
        * Icon: `Minus`, Label: "分隔模块"

4.  **Center Column (Canvas Area)**:
    * This column should be the main flexible area (`flex-1`).
    * Set a light background color, for example `bg-slate-100`.
    * In the center of this area, display the placeholder text: "将模块拖拽至此处".

5.  **Right Column (Properties Panel)**:
    * Make it a fixed width of `320px`.
    * Give it a header that says "属性配置".
    * Below the header, create a form-like structure with various shadcn/ui components to act as placeholders for properties:
        * A `Select` component for "对齐方式" with options: "居左", "居中", "居右".
        * An `Input` component for a property like "图片链接".
        * A `Switch` component for a boolean option like "是否加粗".
        * A `Label` for each component.

## Code Examples, Data Structures & Constraints:

* **Tech Stack**: Next.js 15.3, TypeScript, Tailwind CSS 4.1, shadcn/ui 2.6.
* **Font**: Use the Inter font, which should be set up via `next/font`.
* **Icons**: Use `lucide-react` for all icons.
* **Primary Color**: Use the hex code `#1975B0` for the primary button and any other key brand highlights.
* **CRITICAL CONSTRAINT**: This prompt is for generating a **STATIC, PRESENTATIONAL UI ONLY**. Do NOT add any `useState`, `useEffect`, or any other state management hooks. Do NOT implement any functionality for drag-and-drop, API calls, or data handling. The goal is purely the visual layout and structure.

## Strict Scope:

* Generate the code within a single React Server Component file, for example `(routes)/editor/page.tsx`.
* Do not create or modify any other files.