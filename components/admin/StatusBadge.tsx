import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Kladde', className: 'border-gray-300 text-gray-400' },
  pending: { label: 'Afventer', className: 'border-[#D4A843] text-[#92710A]' },
  accepted: { label: 'Accepteret', className: 'border-green-500 text-green-700' },
  rejected: { label: 'Afvist', className: 'border-red-400 text-red-600' },
  expired: { label: 'Udlobet', className: 'border-gray-300 text-gray-400' },
}

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.draft
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-transparent',
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  )
}
