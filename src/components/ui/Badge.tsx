import { cn } from '@/lib/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  new:        'bg-blue-500/12   border-blue-500/25   text-blue-300',
  processing: 'bg-amber-500/12  border-amber-500/25  text-amber-300',
  shipped:    'bg-violet-500/12 border-violet-500/25 text-violet-300',
  delivered:  'bg-emerald-500/12 border-emerald-500/25 text-emerald-300',
  cancelled:  'bg-red-500/12    border-red-500/25    text-red-300',
  paid:       'bg-emerald-500/12 border-emerald-500/25 text-emerald-300',
  pending:    'bg-white/[0.06]  border-white/10      text-gray-400',
  failed:     'bg-red-500/12    border-red-500/25    text-red-300',
  active:     'bg-emerald-500/12 border-emerald-500/25 text-emerald-300',
  draft:      'bg-white/[0.06]  border-white/10      text-gray-400',
  archived:   'bg-red-500/8     border-red-500/15    text-red-400/70',
}

const STATUS_DOTS: Record<string, string> = {
  new:        'bg-blue-400',
  processing: 'bg-amber-400',
  shipped:    'bg-violet-400',
  delivered:  'bg-emerald-400',
  cancelled:  'bg-red-400',
  paid:       'bg-emerald-400',
  pending:    'bg-gray-500',
  failed:     'bg-red-400',
  active:     'bg-emerald-400',
  draft:      'bg-gray-500',
  archived:   'bg-red-400/60',
}

const STATUS_LABELS: Record<string, string> = {
  new:        'חדש',
  processing: 'בטיפול',
  shipped:    'נשלח',
  delivered:  'הושלם',
  cancelled:  'בוטל',
  paid:       'שולם',
  pending:    'ממתין',
  failed:     'נכשל',
  active:     'פעיל',
  draft:      'טיוטה',
  archived:   'בארכיון',
}

interface BadgeProps {
  status: string
  className?: string
}

export function Badge({ status, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-white/[0.06] border-white/10 text-gray-400'
  const dot = STATUS_DOTS[status] ?? 'bg-gray-500'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[11px] font-medium border',
      style,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dot)} />
      {label}
    </span>
  )
}
