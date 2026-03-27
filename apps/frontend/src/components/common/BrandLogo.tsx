import { BRAND_LOGO_ALT, BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  containerClassName?: string
  alt?: string
  priority?: boolean
}

export function BrandLogo({
  className,
  containerClassName,
  alt = BRAND_LOGO_ALT,
  priority: _priority = false
}: BrandLogoProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-[28px] border border-white/15 bg-white/8 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.18)] backdrop-blur-sm',
        containerClassName
      )}
    >
      <img src={BRAND_LOGO_SRC} alt={alt} className={cn('block h-auto w-full max-w-full object-contain', className)} />
    </div>
  )
}

export function BrandWordmark({ className }: { className?: string }) {
  return <span className={cn('font-semibold tracking-tight', className)}>{BRAND_NAME}</span>
}
