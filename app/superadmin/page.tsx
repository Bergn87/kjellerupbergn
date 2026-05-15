import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, CreditCard, TrendingUp } from 'lucide-react'
import type { Tenant } from '@/types'

export default async function SuperadminDashboard() {
  const supabase = await createAdminClient()

  const [tenantsRes, quotesRes, activeRes, trialRes] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('quotes').select('*', { count: 'exact', head: true }),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('is_active', true).neq('plan', 'trial').neq('plan', 'expired'),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('plan', 'trial'),
  ])

  // Revenue
  const { data: revenueData } = await supabase
    .from('tenants')
    .select('plan')
    .eq('is_active', true)
    .neq('plan', 'trial')
    .neq('plan', 'expired')

  const mrr = (revenueData as Pick<Tenant, 'plan'>[] | null)?.reduce((sum, t) => {
    const prices: Record<string, number> = { starter: 299, pro: 599, business: 999 }
    return sum + (prices[t.plan] ?? 0)
  }, 0) ?? 0

  const kpis = [
    { label: 'Tenants', value: tenantsRes.count ?? 0, icon: Users },
    { label: 'Tilbud totalt', value: quotesRes.count ?? 0, icon: FileText },
    { label: 'Betalende', value: activeRes.count ?? 0, icon: CreditCard },
    { label: 'MRR', value: `${mrr.toLocaleString('da-DK')} kr.`, icon: TrendingUp },
  ]

  // Seneste tenants
  const { data: recentTenants } = await supabase
    .from('tenants')
    .select('id, company_name, plan, created_at, leads_used_this_month, is_active')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Superadmin</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border border-bergn-card-border">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border border-bergn-card-border">
        <CardContent className="pt-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Seneste tenants</h2>
          <div className="divide-y">
            {(recentTenants as Pick<Tenant, 'id' | 'company_name' | 'plan' | 'created_at' | 'leads_used_this_month' | 'is_active'>[] | null)?.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <a href={`/superadmin/tenants/${t.id}`} className="font-medium text-sm text-gray-900 hover:underline">{t.company_name}</a>
                  <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('da-DK')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{t.leads_used_this_month} leads</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${t.plan === 'trial' ? 'border-yellow-300 text-yellow-700' : t.plan === 'expired' ? 'border-red-300 text-red-600' : 'border-green-300 text-green-700'}`}>
                    {t.plan}
                  </span>
                  {!t.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inaktiv</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
