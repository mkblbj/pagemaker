import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Wifi, BatteryFull, Signal } from "lucide-react"

import { cn } from "@/lib/utils"

const iphoneFrameVariants = cva(
  "relative mx-auto h-[868px] w-[428px] rounded-[60px] shadow-2xl overflow-hidden bg-zinc-900 border-4",
  {
    variants: {
      deviceColor: {
        black: "border-zinc-800",
        white: "border-zinc-300",
        gold: "border-yellow-600",
        purple: "border-purple-800",
      },
    },
    defaultVariants: {
      deviceColor: "black",
    },
  },
)

const sideButtonVariants = cva("absolute", {
  variants: {
    deviceColor: {
      black: "bg-zinc-800",
      white: "bg-zinc-400",
      gold: "bg-yellow-500",
      purple: "bg-purple-700",
    },
  },
  defaultVariants: {
    deviceColor: "black",
  },
})

export interface IPhonePreviewProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iphoneFrameVariants> {
  children: React.ReactNode
  showReflection?: boolean
}

const IPhonePreview = React.forwardRef<HTMLDivElement, IPhonePreviewProps>(
  ({ className, deviceColor = "black", showReflection = false, children, ...props }, ref) => {
    return (
      <div className={cn(iphoneFrameVariants({ deviceColor }), className)} ref={ref} {...props}>
        {/* Mute Switch */}
        <div
          className={cn(sideButtonVariants({ deviceColor }), "left-[-2px] top-[128px] h-[30px] w-[5px] rounded-r-md")}
        />
        {/* Volume Up */}
        <div
          className={cn(sideButtonVariants({ deviceColor }), "left-[-2px] top-[178px] h-[50px] w-[5px] rounded-r-md")}
        />
        {/* Volume Down */}
        <div
          className={cn(sideButtonVariants({ deviceColor }), "left-[-2px] top-[240px] h-[50px] w-[5px] rounded-r-md")}
        />
        {/* Power Button */}
        <div
          className={cn(sideButtonVariants({ deviceColor }), "right-[-2px] top-[188px] h-[80px] w-[5px] rounded-l-md")}
        />

        <div className="h-full w-full rounded-[56px] bg-black p-1">
          <div className="relative h-full w-full overflow-hidden rounded-[52px]">
            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-3 z-20 h-[30px] w-[120px] -translate-x-1/2 rounded-full bg-black" />

            {/* Status Bar */}
            <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-between px-8 pt-5 text-sm font-semibold text-white">
              <time>9:41</time>
              <div className="flex items-center gap-2">
                <Signal size={16} />
                <Wifi size={16} />
                <BatteryFull size={20} />
              </div>
            </div>

            {/* Screen Content */}
            <div className="h-full w-full bg-white dark:bg-zinc-800">{children}</div>

            {/* Reflection */}
            {showReflection && (
              <div className="pointer-events-none absolute inset-0 z-20 h-full w-full rounded-[52px] [background:linear-gradient(135deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_50%)]" />
            )}
          </div>
        </div>
      </div>
    )
  },
)
IPhonePreview.displayName = "IPhonePreview"

export { IPhonePreview }
