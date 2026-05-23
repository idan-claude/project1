import { cn } from '@/lib/utils/cn'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-700',
  archived: 'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'חדש',
  processing: 'בטיפול',
  shipped: 'נשלח',
  delivered: 'הושלם',
  cancelled: 'בוטל',
  paid: 'שולם',
  pending: 'ממתין',
  failed: 'נכשל',
  active: 'פעיל',
  draft: 'טיוטה',
  archived: 'בארכיון',
}

interface BadgeProps {
  status: string
  className?: string
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700',
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
