import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/helpers'
import { LayoutDashboard, Users, CreditCard, ArrowLeft } from 'lucide-react'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail && user.email !== superadminEmail) {
    redirect('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-bergn-page-bg">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-bold text-gray-900">Bergn.dk <span className="text-xs font-normal text-red-500 ml-1">Superadmin</span></span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/superadmin" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <LayoutDashboard className="h-3.5 w-3.5" /> Oversigt
            </Link>
            <Link href="/superadmin/tenants" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Users className="h-3.5 w-3.5" /> Tenants
            </Link>
            <Link href="/superadmin/payments" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <CreditCard className="h-3.5 w-3.5" /> Betalinger
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
