'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  RefreshCw,
  LogIn,
  Home
} from 'lucide-react';
import { AppError, ErrorSeverity, ErrorType, getErrorActions } from '@/lib/errorHandler';

interface ErrorNotificationProps {
  error: AppError | null;
  onClose?: () => void;
  onRetry?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showDetails?: boolean;
}

export function ErrorNotification({
  error,
  onClose,
  onRetry,
  autoClose = false,
  autoCloseDelay = 5000,
  showDetails = false
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(!!error);
  const [showFullDetails, setShowFullDetails] = useState(false);

  useEffect(() => {
    setIsVisible(!!error);
    
    if (error && autoClose && error.severity === ErrorSeverity.LOW) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [error, autoClose, autoCloseDelay]);

  if (!error || !isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const getIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case ErrorSeverity.MEDIUM:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case ErrorSeverity.LOW:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVariant = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'destructive' as const;
      case ErrorSeverity.MEDIUM:
        return 'default' as const;
      case ErrorSeverity.LOW:
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  const getSeverityColor = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-600 text-white';
      case ErrorSeverity.HIGH:
        return 'bg-red-500 text-white';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-500 text-white';
      case ErrorSeverity.LOW:
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return '🌐';
      case ErrorType.AUTHENTICATION:
        return '🔒';
      case ErrorType.AUTHORIZATION:
        return '🚫';
      case ErrorType.VALIDATION:
        return '📝';
      case ErrorType.SERVER:
        return '🖥️';
      case ErrorType.CONFLICT:
        return '⚡';
      case ErrorType.NOT_FOUND:
        return '🔍';
      case ErrorType.TIMEOUT:
        return '⏱️';
      default:
        return '❗';
    }
  };

  const getBuiltInActions = () => {
    const actions = [];

    if (error.retryable && onRetry) {
      actions.push({
        label: '重试',
        icon: <RefreshCw className="h-4 w-4" />,
        action: onRetry,
        variant: 'outline' as const
      });
    }

    if (error.type === ErrorType.AUTHENTICATION) {
      actions.push({
        label: '重新登录',
        icon: <LogIn className="h-4 w-4" />,
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        },
        variant: 'default' as const
      });
    }

    if (error.type === ErrorType.CONFLICT) {
      actions.push({
        label: '刷新页面',
        icon: <RefreshCw className="h-4 w-4" />,
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        },
        variant: 'outline' as const
      });
    }

    return actions;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <Card className="mb-4 border-l-4 border-l-red-500">
      <CardContent className="p-4">
        <Alert variant={getVariant()}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {getIcon()}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTitle className="text-base font-semibold">
                    {getTypeIcon()} {error.userMessage}
                  </AlertTitle>
                  <Badge className={`text-xs ${getSeverityColor()}`}>
                    {error.severity.toUpperCase()}
                  </Badge>
                </div>
                
                <AlertDescription className="text-sm text-muted-foreground">
                  错误代码: {error.code} | 时间: {formatTimestamp(error.timestamp)}
                </AlertDescription>

                {/* 错误详情 */}
                {showDetails && (
                  <div className="mt-3 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullDetails(!showFullDetails)}
                      className="text-xs"
                    >
                      {showFullDetails ? '隐藏' : '显示'}详细信息
                    </Button>
                    
                    {showFullDetails && (
                      <div className="p-3 bg-muted rounded-md text-xs space-y-2">
                        <div>
                          <span className="font-medium">类型:</span> {error.type}
                        </div>
                        <div>
                          <span className="font-medium">技术消息:</span> {error.message}
                        </div>
                        {error.context && (
                          <div>
                            <span className="font-medium">上下文:</span>
                            <pre className="mt-1 text-xs">
                              {JSON.stringify(error.context, null, 2)}
                            </pre>
                          </div>
                        )}
                        {error.details && (
                          <div>
                            <span className="font-medium">详细信息:</span>
                            <pre className="mt-1 text-xs">
                              {JSON.stringify(error.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3">
                  {getBuiltInActions().map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant}
                      size="sm"
                      onClick={action.action}
                      className="text-xs"
                    >
                      {action.icon}
                      <span className="ml-1">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* 关闭按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * 简化的错误提示组件
 */
interface SimpleErrorAlertProps {
  error: AppError | null;
  onClose?: () => void;
}

export function SimpleErrorAlert({ error, onClose }: SimpleErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>操作失败</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error.userMessage}</span>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * 全局错误边界组件
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: AppError }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 这里可以集成错误处理系统
    const appError: AppError = {
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.HIGH,
      code: 'REACT_ERROR_BOUNDARY',
      message: error.message,
      userMessage: '页面遇到了问题，请刷新后重试',
      timestamp: Date.now(),
      originalError: error,
      retryable: true,
      actionable: true
    };

    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary 捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h2 className="text-lg font-semibold">页面出错了</h2>
                <p className="text-muted-foreground mt-1">
                  {this.state.error.userMessage}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新页面
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
} 