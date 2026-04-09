import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentTenant } from '@/lib/supabase/helpers'
import Sidebar from '@/components/admin/Sidebar'
import AdminMobileHeader from '@/components/admin/MobileHeader'
import { Play } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const tenant = await getCurrentTenant()
  if (!tenant) redirect('/onboarding')

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0">
        <Sidebar tenantName={tenant.company_name} plan={tenant.plan} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <AdminMobileHeader tenantName={tenant.company_name} plan={tenant.plan} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#F5F6FA] p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Floating Test Beregner knap */}
      <Link
        href={`/b/${tenant.slug}`}
        target="_blank"
        className="fixed bottom-6 right-6 bg-[#1B3C2E] text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:bg-[#152F24] text-sm font-medium z-50 hidden md:flex items-center gap-2 transition-colors"
      >
        <Play className="h-3.5 w-3.5" />
        Test Beregner
      </Link>
    </div>
  )
}
