import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestComponent } from "@/components/test-component";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">仪表板</h1>
        <p className="text-muted-foreground">
          欢迎使用 Pagemaker CMS，这里是您的内容管理中心
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>总页面数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 比上个月增加
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已发布页面</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +1 比上个月增加
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>草稿页面</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              +1 比上个月增加
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">创建了新页面 &ldquo;关于我们&rdquo;</p>
                  <p className="text-xs text-muted-foreground">2 小时前</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">发布了页面 &ldquo;产品介绍&rdquo;</p>
                  <p className="text-xs text-muted-foreground">5 小时前</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">修改了页面 &ldquo;首页&rdquo;</p>
                  <p className="text-xs text-muted-foreground">1 天前</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">系统测试</h2>
          <TestComponent />
        </div>
      </div>
    </div>
  );
} 