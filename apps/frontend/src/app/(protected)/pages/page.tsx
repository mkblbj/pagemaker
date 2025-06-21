import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PagesPage() {
  const mockPages = [
    {
      id: "1",
      title: "首页",
      status: "已发布",
      lastModified: "2024-01-15",
      author: "管理员",
    },
    {
      id: "2",
      title: "关于我们",
      status: "草稿",
      lastModified: "2024-01-14",
      author: "管理员",
    },
    {
      id: "3",
      title: "产品介绍",
      status: "已发布",
      lastModified: "2024-01-13",
      author: "管理员",
    },
    {
      id: "4",
      title: "联系我们",
      status: "已发布",
      lastModified: "2024-01-12",
      author: "管理员",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">页面管理</h1>
          <p className="text-muted-foreground">
            管理您的所有页面内容
          </p>
        </div>
        <Button>创建新页面</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>搜索和筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索页面标题..."
              className="flex-1"
            />
            <select className="px-3 py-2 border border-input rounded-md">
              <option value="">所有状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
            <Button variant="outline">搜索</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>页面列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">标题</th>
                  <th className="text-left p-2">状态</th>
                  <th className="text-left p-2">最后修改</th>
                  <th className="text-left p-2">作者</th>
                  <th className="text-left p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {mockPages.map((page) => (
                  <tr key={page.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{page.title}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          page.status === "已发布"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {page.status}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {page.lastModified}
                    </td>
                    <td className="p-2 text-muted-foreground">{page.author}</td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          编辑
                        </Button>
                        <Button variant="outline" size="sm">
                          预览
                        </Button>
                        <Button variant="destructive" size="sm">
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 