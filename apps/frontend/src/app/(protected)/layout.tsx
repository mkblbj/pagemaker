"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // TODO: Implement actual authentication check
    // For now, simulate authentication check
    const checkAuth = () => {
      // Placeholder: In real implementation, check JWT token, session, etc.
      const hasAuth = localStorage.getItem("auth-token");
      setIsAuthenticated(!!hasAuth);
    };

    checkAuth();
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">检查认证状态...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">需要登录</h2>
              <p className="text-muted-foreground mb-4">请先登录以访问此页面</p>
              <button
                onClick={() => {
                  // TODO: Implement actual login redirect
                  localStorage.setItem("auth-token", "demo-token");
                  setIsAuthenticated(true);
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                模拟登录
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - render protected content
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Pagemaker CMS</h1>
            <nav className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground"
              >
                仪表板
              </Link>
              <Link
                href="/editor"
                className="text-muted-foreground hover:text-foreground"
              >
                编辑器
              </Link>
              <Link
                href="/pages"
                className="text-muted-foreground hover:text-foreground"
              >
                页面管理
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem("auth-token");
                  setIsAuthenticated(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                退出
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
