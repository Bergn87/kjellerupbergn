import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import StatusBadge from '@/components/admin/StatusBadge'
import { Plus, ArrowRight } from 'lucide-react'

function formatKr(n: number | null): string {
  if (n == null) return '0 kr.'
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  })
}

// ============================================
// KPI DATA
// ============================================

async function getDashboardData(tenantId: string) {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [totalRes, pendingRes, acceptedRes, revenueRes, recentRes, dailyRes] = await Promise.all([
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pending'),
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'accepted').gte('accepted_at', monthStart),
    supabase.from('quotes').select('total_incl_vat').eq('tenant_id', tenantId).eq('status', 'accepted'),
    supabase.from('quotes').select('id, quote_number, customer_name, customer_address, total_incl_vat, status, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
    supabase.from('quotes').select('created_at').eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: true }),
  ])

  const revenue = (revenueRes.data as { total_incl_vat: number | null }[] | null)
    ?.reduce((sum, q) => sum + (q.total_incl_vat ?? 0), 0) ?? 0

  const dailyCounts: Record<string, number> = {}
  ;(dailyRes.data as { created_at: string }[] | null)?.forEach((q) => {
    const day = q.created_at.slice(0, 10)
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1
  })

  const dailyData: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dailyData.push({ date: key, count: dailyCounts[key] ?? 0 })
  }

  type RecentQuote = { id: string; quote_number: string; customer_name: string; customer_address: string | null; total_incl_vat: number | null; status: string; created_at: string }

  return {
    totalQuotes: totalRes.count ?? 0,
    pendingQuotes: pendingRes.count ?? 0,
    acceptedThisMonth: acceptedRes.count ?? 0,
    revenue,
    recentQuotes: (recentRes.data ?? []) as RecentQuote[],
    dailyData,
  }
}

// ============================================
// PAGE
// ============================================

export default async function DashboardPage() {
  const tenant = await getCurrentTenant()
  if (!tenant) redirect('/onboarding')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/admin/quotes/new">
          <Button className="bg-[#1B3C2E] hover:bg-[#152F24]">
            <Plus className="mr-2 h-4 w-4" />
            Opret nyt tilbud
          </Button>
        </Link>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent tenantId={tenant.id} leadsUsed={tenant.leads_used_this_month} leadsQuota={tenant.leads_quota} />
      </Suspense>
    </div>
  )
}

async function DashboardContent({
  tenantId,
  leadsUsed,
  leadsQuota,
}: {
  tenantId: string
  leadsUsed: number
  leadsQuota: number
}) {
  const data = await getDashboardData(tenantId)
  const maxDaily = Math.max(...data.dailyData.map((d) => d.count), 1)
  const quotaPercent = leadsQuota > 0 ? Math.round((leadsUsed / leadsQuota) * 100) : 0

  return (
    <>
      {/* KPI-KORT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-[#E8EAF0]">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Alle foresp&oslash;rgsler</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalQuotes}</p>
            <p className="text-xs text-gray-400 mt-0.5">samlet</p>
          </CardContent>
        </Card>

        <Card className="border border-[#E8EAF0]">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Afventer svar</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data.pendingQuotes}</p>
            <p className="text-xs text-gray-400 mt-0.5">&aring;bne</p>
          </CardContent>
        </Card>

        <Card className="border border-[#E8EAF0]">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Accepterede</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data.acceptedThisMonth}</p>
            <p className="text-xs text-gray-400 mt-0.5">tilbud</p>
          </CardContent>
        </Card>

        <Card className="border border-[#E8EAF0]">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Accepteret oms&aelig;tning</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatKr(data.revenue)}</p>
            <p className="text-xs text-gray-400 mt-0.5">inkl. moms</p>
          </CardContent>
        </Card>
      </div>

      {/* SENESTE FORESPØRGSLER */}
      <Card className="border border-[#E8EAF0]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Seneste foresp&oslash;rgsler</CardTitle>
          <Link href="/admin/quotes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Se alle <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Ingen foresp&oslash;rgsler endnu. Opret dit f&oslash;rste tilbud!
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recentQuotes.map((q) => (
                <Link
                  key={q.id}
                  href={`/admin/quotes/${q.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 truncate">{q.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate">{q.customer_address || 'Ingen adresse'}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold text-sm text-gray-900">{formatKr(q.total_incl_vat)}</p>
                      <p className="text-xs text-gray-400">{formatShortDate(q.created_at)}</p>
                    </div>
                    <StatusBadge status={q.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRAF + KVOTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border border-[#E8EAF0]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Tilbud per dag (30 dage)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[3px] h-32">
              {data.dailyData.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div
                    className="w-full rounded-t bg-[#1B3C2E]/70 hover:bg-[#1B3C2E] transition-colors min-h-[2px]"
                    style={{ height: `${Math.max((d.count / maxDaily) * 100, 2)}%` }}
                  />
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {d.date.slice(5)}: {d.count} tilbud
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#E8EAF0]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">M&aring;nedlig kvote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <span className="text-3xl font-bold">{leadsUsed}</span>
              <span className="text-gray-400 text-lg"> / {leadsQuota}</span>
            </div>
            <Progress value={quotaPercent} className="h-2.5" />
            <p className="text-xs text-gray-400 text-center">
              tilbud brugt denne m&aring;ned
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-[#E8EAF0]">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
