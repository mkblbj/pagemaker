'use client';

import React, { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 这里可以发送错误报告到监控服务
    // reportError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="h-screen flex items-center justify-center bg-background p-4">
          <Card className="p-8 text-center max-w-md">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold mb-2">出现了意外错误</h2>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || '页面遇到了一个错误，请尝试刷新页面'}
            </p>
            
            {/* 开发环境显示详细错误信息 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-muted p-4 rounded mb-4 text-sm">
                <p className="font-mono text-red-600 mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
              <Button variant="outline" onClick={this.handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 函数式错误边界Hook
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
} 