## High-Level Goal:
Create a responsive page management dashboard layout for a CMS. The design should feature a left sidebar for organization and a main content area with a data table for listing pages, using Next.js and shadcn/ui.

## Detailed, Step-by-Step Instructions:

1.  **Overall Layout**:
    * Create a full-height layout with two main columns: a fixed-width sidebar on the left and a flexible main content area on the right.

2.  **Sidebar (Left Column)**:
    * Set a fixed width of `250px` and a subtle background color (e.g., `bg-muted/40`).
    * At the top, include a simple logo or project name area.
    * Below the logo, use the shadcn/ui `Nav` component structure to build a list of organizational folders.
    * Create a few example navigation links with Lucide Icons. For instance:
        * Icon: `Folder`, Label: "店铺 A 的页面"
        * Icon: `Folder`, Label: "店铺 B 的页面"
        * Icon: `Archive`, Label: "已归档模板"

3.  **Main Content Area (Right Column)**:
    * This area should fill the remaining space. Add some padding (e.g., `p-6`).
    * At the top, create a header. On the left of the header, add a `h1` title: "页面管理".
    * On the right of the header, place a primary shadcn/ui `Button` with a `Plus` icon from Lucide, labeled "创建新页面".

4.  **Data Table**:
    * Below the main content header, implement a shadcn/ui `Table`.
    * Define the table columns (`TableHead`): "名称" (with a sub-description column), "类型", "最后修改日期", and an empty column for "操作".
    * Populate the `TableBody` with 3-4 rows of hardcoded placeholder data.
    * In the "名称" column (`TableCell`), make the title bold and add a non-bold description line below it. (e.g., **2025夏季促销主页** <br> /shop-a/summer-sale)
    * In the "类型" column, use the shadcn/ui `Badge` component. Use different variants for "页面" and "模板".
    * In the "操作" column, for each row, add a shadcn/ui `DropdownMenu`. The trigger should be a `Button` with `variant="ghost"` containing only a `MoreHorizontal` Lucide icon.
    * The `DropdownMenuContent` should include `DropdownMenuItem`s for "编辑", "复制", and a `DropdownMenuSeparator` followed by a destructive-styled `DropdownMenuItem` for "删除".

## Code Examples, Data Structures & Constraints:

* **Tech Stack**: Next.js 15.3, TypeScript, Tailwind CSS 4.1, shadcn/ui 2.6.
* **Font**: Use the Inter font.
* **Icons**: Use `lucide-react` for all icons.
* **Primary Color**: Use the hex code `#1975B0` for the primary "+ 创建新页面" button.
* **CRITICAL CONSTRAINT**: STATIC UI ONLY. The table data must be hardcoded. Do not implement any functionality for buttons, links, or dropdowns. Do not add state management or data fetching. The goal is a static, presentational page.

## Strict Scope:

* Generate the code within a single React Server Component file, for example `(routes)/management/page.tsx`.
* Do not create or modify any other files.