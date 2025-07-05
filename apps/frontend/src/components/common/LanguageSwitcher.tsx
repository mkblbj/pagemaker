'use client';

import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Languages, Globe } from 'lucide-react';
import { useTranslation } from '@/contexts/I18nContext';
import { LANGUAGE_NAMES, type SupportedLanguage } from '@pagemaker/shared-i18n';

// 语言选项配置
const LANGUAGE_OPTIONS: Array<{
  value: SupportedLanguage;
  label: string;
  flag: string;
}> = [
  {
    value: 'zh-CN',
    label: LANGUAGE_NAMES['zh-CN'],
    flag: '🇨🇳'
  },
  {
    value: 'ja-JP',
    label: LANGUAGE_NAMES['ja-JP'],
    flag: '🇯🇵'
  },
  {
    value: 'en-US',
    label: LANGUAGE_NAMES['en-US'],
    flag: '🇺🇸'
  }
];

// 组件Props
interface LanguageSwitcherProps {
  variant?: 'select' | 'button';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * 语言切换组件 - Select版本
 */
function LanguageSelect({ 
  size = 'md',
  showLabel = false,
  className = ''
}: Omit<LanguageSwitcherProps, 'variant'>) {
  const { currentLanguage, setLanguage, tCommon } = useTranslation();

  const handleLanguageChange = (value: string) => {
    if (value === 'zh-CN' || value === 'ja-JP' || value === 'en-US') {
      setLanguage(value);
    }
  };

  const currentOption = LANGUAGE_OPTIONS.find(option => option.value === currentLanguage);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Globe className="h-4 w-4" />
          {tCommon('language')}:
        </span>
      )}
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`
          ${size === 'sm' ? 'h-8 text-xs' : size === 'lg' ? 'h-12 text-base' : 'h-10 text-sm'}
          w-auto min-w-[120px]
        `}>
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{currentOption?.flag}</span>
              <span>{currentOption?.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span>{option.flag}</span>
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * 语言切换组件 - Button版本
 */
function LanguageButtons({ 
  size = 'md',
  showLabel = false,
  className = ''
}: Omit<LanguageSwitcherProps, 'variant'>) {
  const { currentLanguage, setLanguage, tCommon } = useTranslation();

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Languages className="h-4 w-4" />
          {tCommon('language')}:
        </span>
      )}
      <div className="flex gap-1 rounded-md border p-1">
        {LANGUAGE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={currentLanguage === option.value ? 'default' : 'ghost'}
            size={buttonSize}
            onClick={() => setLanguage(option.value)}
            className={`
              px-2 py-1 h-auto min-w-0
              ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}
            `}
            title={option.label}
          >
            <span className="flex items-center gap-1">
              <span>{option.flag}</span>
              {size !== 'sm' && <span>{option.label}</span>}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * 紧凑的语言切换组件 - 仅显示国旗
 */
function LanguageCompact({ 
  className = ''
}: { className?: string }) {
  const { currentLanguage, setLanguage } = useTranslation();

  const currentOption = LANGUAGE_OPTIONS.find(option => option.value === currentLanguage);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
        title={currentOption?.label}
      >
        <span className="text-lg">{currentOption?.flag}</span>
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-50">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setLanguage(option.value);
                setIsOpen(false);
              }}
              className={`
                flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100
                ${currentLanguage === option.value ? 'bg-gray-50' : ''}
              `}
            >
              <span>{option.flag}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * 主要的语言切换组件
 */
export function LanguageSwitcher({ 
  variant = 'select',
  size = 'md',
  showLabel = false,
  className = ''
}: LanguageSwitcherProps) {
  switch (variant) {
    case 'button':
      return (
        <LanguageButtons 
          size={size}
          showLabel={showLabel}
          className={className}
        />
      );
    default:
      return (
        <LanguageSelect 
          size={size}
          showLabel={showLabel}
          className={className}
        />
      );
  }
}

/**
 * 导出紧凑版本
 */
export { LanguageCompact }; 