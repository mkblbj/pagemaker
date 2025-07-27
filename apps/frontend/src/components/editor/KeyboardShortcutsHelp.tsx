'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Keyboard } from 'lucide-react'
import { useTranslation } from '@/contexts/I18nContext'

interface ShortcutItem {
  keys: string[]
  description: string
  category: string
}

export interface KeyboardShortcutsHelpRef {
  openDialog: () => void
}

function getShortcuts(tEditor: (key: string) => string): ShortcutItem[] {
  return [
    // 模块导航
    {
      keys: ['↑'],
      description: tEditor('选择上一个模块'),
      category: tEditor('模块导航')
    },
    {
      keys: ['↓'],
      description: tEditor('选择下一个模块'),
      category: tEditor('模块导航')
    },
    {
      keys: ['Esc'],
      description: tEditor('取消选择'),
      category: tEditor('模块导航')
    },

    // 模块操作
    {
      keys: ['Shift', '↑'],
      description: tEditor('向上移动选中模块'),
      category: tEditor('模块操作')
    },
    {
      keys: ['Shift', '↓'],
      description: tEditor('向下移动选中模块'),
      category: tEditor('模块操作')
    },
    {
      keys: ['Delete'],
      description: tEditor('删除选中模块'),
      category: tEditor('模块操作')
    },
    {
      keys: ['Backspace'],
      description: tEditor('删除选中模块'),
      category: tEditor('模块操作')
    },

    // 编辑操作（预留 - 暂时移除未实现的快捷键以免干扰系统复制功能）
    // {
    //   keys: ['Ctrl', 'C'],
    //   description: tEditor('复制模块（开发中）'),
    //   category: tEditor('编辑操作')
    // },
    // {
    //   keys: ['Ctrl', 'V'],
    //   description: tEditor('粘贴模块（开发中）'),
    //   category: tEditor('编辑操作')
    // },
    // {
    //   keys: ['Ctrl', 'Z'],
    //   description: tEditor('撤销操作（开发中）'),
    //   category: tEditor('编辑操作')
    // },
    // {
    //   keys: ['Ctrl', 'Y'],
    //   description: tEditor('重做操作（开发中）'),
    //   category: tEditor('编辑操作')
    // },

    // 帮助
    {
      keys: ['F1'],
      description: tEditor('显示快捷键帮助'),
      category: tEditor('帮助')
    },
    {
      keys: ['?'],
      description: tEditor('显示快捷键帮助'),
      category: tEditor('帮助')
    }
  ]
}

function KeyBadge({ keyName }: { keyName: string }) {
  const getKeyDisplay = (key: string) => {
    const keyMap: Record<string, string> = {
      Ctrl: '⌃',
      Cmd: '⌘',
      Shift: '⇧',
      Alt: '⌥',
      Enter: '↵',
      Backspace: '⌫',
      Delete: '⌦',
      Esc: '⎋',
      Tab: '⇥',
      '↑': '↑',
      '↓': '↓',
      '←': '←',
      '→': '→',
      ' ': '空格'
    }
    return keyMap[key] || key
  }

  return (
    <Badge variant="outline" className="font-mono text-xs px-2 py-1 bg-muted/30">
      {getKeyDisplay(keyName)}
    </Badge>
  )
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutItem }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {shortcut.keys.map((key, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <span className="text-muted-foreground text-xs">+</span>}
              <KeyBadge keyName={key} />
            </div>
          ))}
        </div>
        <span className="text-sm">{shortcut.description}</span>
      </div>
    </div>
  )
}

export const KeyboardShortcutsHelp = forwardRef<KeyboardShortcutsHelpRef>((props, ref) => {
  const [open, setOpen] = useState(false)
  const { tEditor, tCommon } = useTranslation()

  useImperativeHandle(ref, () => ({
    openDialog: () => setOpen(true)
  }))

  // 按类别分组快捷键
  const shortcuts = getShortcuts(tEditor)
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {} as Record<string, ShortcutItem[]>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {tEditor('键盘快捷键')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{category}</h3>
              <div className="space-y-1">
                {shortcuts.map((shortcut, index) => (
                  <ShortcutRow key={index} shortcut={shortcut} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>{tCommon('提示')}：</strong>
            {tEditor('快捷键在输入框中不会生效，确保焦点在编辑器主区域。')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
})
