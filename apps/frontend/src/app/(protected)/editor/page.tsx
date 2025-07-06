'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/contexts/I18nContext";

export default function EditorPage() {
  const { tEditor, tCommon } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tEditor('页面编辑器')}</h1>
          <p className="text-muted-foreground">{tEditor('创建和编辑您的页面内容')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">{tCommon('保存草稿')}</Button>
          <Button>{tCommon('发布页面')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{tEditor('页面内容')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page-title">{tEditor('页面标题')}</Label>
                <Input
                  id="page-title"
                  placeholder={tEditor('输入页面标题')}
                  defaultValue={tEditor('新页面')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-description">{tEditor('页面描述')}</Label>
                <Input
                  id="page-description"
                  placeholder={tEditor('输入页面描述（可选）')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-content">{tEditor('页面内容')}</Label>
                <Textarea
                  id="page-content"
                  placeholder={tEditor('在此编写页面内容...')}
                  className="min-h-[400px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{tEditor('页面设置')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{tEditor('发布状态')}</Label>
                <select className="w-full p-2 border border-input rounded-md">
                  <option value="draft">{tEditor('草稿')}</option>
                  <option value="published">{tEditor('已发布')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{tEditor('页面模板')}</Label>
                <select className="w-full p-2 border border-input rounded-md">
                  <option value="default">{tEditor('默认模板')}</option>
                  <option value="blog">{tEditor('博客模板')}</option>
                  <option value="landing">{tEditor('落地页模板')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-slug">{tEditor('页面路径')}</Label>
                <Input
                  id="page-slug"
                  placeholder="page-url"
                  defaultValue="new-page"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{tEditor('预览')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-md p-4 bg-muted/30">
                <h3 className="font-semibold mb-2">{tEditor('页面预览')}</h3>
                <p className="text-sm text-muted-foreground">
                  {tEditor('实时预览功能即将推出...')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
