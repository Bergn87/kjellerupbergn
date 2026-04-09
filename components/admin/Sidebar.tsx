'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'
import {
  LayoutDashboard,
  FileText,
  Users,
  Calculator,
  Bell,
  Mail,
  Building2,
  CreditCard,
  Code2,
  LogOut,
} from 'lucide-react'

interface SidebarProps {
  tenantName: string
  plan: string
}

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/quotes', label: 'Tilbud', icon: FileText },
  { href: '/admin/customers', label: 'Kunder', icon: Users },
  { href: '/admin/calculators', label: 'Prisindstillinger', icon: Calculator },
  { href: '/admin/reminders', label: 'Påmindelser', icon: Bell },
  { href: '/admin/templates', label: 'Skabeloner', icon: Mail },
  { href: '/admin/company', label: 'Virksomhed', icon: Building2 },
  { href: '/admin/billing', label: 'Abonnement', icon: CreditCard },
  { href: '/admin/embed', label: 'Embed-kode', icon: Code2 },
]

const PLAN_LABELS: Record<string, string> = {
  trial: 'Prøveperiode',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  expired: 'Udløbet',
}

export default function Sidebar({ tenantName, plan }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-[#1B3C2E] text-white">
      {/* TOP: Logo + firmanavn */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <Link href="/admin/dashboard" className="block">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <Calculator className="h-5 w-5 text-[#D4A843]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight truncate">{tenantName}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Bergn.dk</p>
            </div>
          </div>
        </Link>
        <span className="inline-block mt-2 text-[10px] bg-white/10 rounded px-1.5 py-0.5 text-white/60">
          Admin
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#D4A843]/15 text-[#D4A843]'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[#D4A843]')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* BOTTOM: Plan + Log ud */}
      <div className="border-t border-white/10 px-4 py-4 space-y-3">
        <div className="inline-flex items-center rounded-full border border-[#D4A843]/40 px-2.5 py-0.5 text-[11px] font-medium text-[#D4A843]">
          {PLAN_LABELS[plan] ?? 'Trial'}
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/8 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log ud
          </button>
        </form>
      </div>
    </div>
  )
}
