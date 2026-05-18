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
  let user, tenant

  try {
    user = await getCurrentUser()
  } catch (e) {
    console.error('[AdminLayout] getCurrentUser failed:', e)
    redirect('/login')
  }
  if (!user) redirect('/login')

  try {
    tenant = await getCurrentTenant()
  } catch (e) {
    console.error('[AdminLayout] getCurrentTenant failed:', e)
    throw new Error(`Kunne ikke hente virksomhed: ${e instanceof Error ? e.message : String(e)}`)
  }
  if (!tenant) redirect(`/onboarding?email=${encodeURIComponent(user.email ?? '')}`)

  return (
    <div className="flex h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-primary focus:shadow-lg">
        Spring til indhold
      </a>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0">
        <Sidebar tenantName={tenant.company_name} plan={tenant.plan} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <AdminMobileHeader tenantName={tenant.company_name} plan={tenant.plan} />

        {/* Page content */}
        <main id="main" className="flex-1 overflow-y-auto bg-bergn-page-bg p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Floating Test Beregner knap */}
      <Link
        href={`/b/${tenant.slug}`}
        target="_blank"
        className="fixed bottom-6 right-6 bg-primary text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:bg-primary/90 text-sm font-medium z-50 hidden md:flex items-center gap-2 transition-colors"
      >
        <Play className="h-3.5 w-3.5" />
        Test Beregner
      </Link>
    </div>
  )
}
