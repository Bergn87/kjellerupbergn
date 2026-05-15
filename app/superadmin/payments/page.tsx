import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Tenant } from '@/types'

function formatKr(n: number) {
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

const PLAN_PRICES: Record<string, number> = { starter: 299, pro: 599, business: 999 }

export default async function PaymentsPage() {
  const supabase = await createAdminClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, company_name, plan, stripe_customer_id, stripe_subscription_id, plan_expires_at, created_at')
    .eq('is_active', true)
    .neq('plan', 'expired')
    .order('created_at', { ascending: false })

  type TenantRow = Pick<Tenant, 'id' | 'company_name' | 'plan' | 'stripe_customer_id' | 'stripe_subscription_id' | 'plan_expires_at' | 'created_at'>
  const rows = (tenants ?? []) as TenantRow[]

  const paying = rows.filter((t) => t.plan !== 'trial')
  const trials = rows.filter((t) => t.plan === 'trial')
  const mrr = paying.reduce((sum, t) => sum + (PLAN_PRICES[t.plan] ?? 0), 0)
  const arr = mrr * 12

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Betalinger</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-bergn-card-border"><CardContent className="pt-5 pb-4 px-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">MRR</p><p className="text-2xl font-bold">{formatKr(mrr)}</p></CardContent></Card>
        <Card className="border border-bergn-card-border"><CardContent className="pt-5 pb-4 px-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">ARR</p><p className="text-2xl font-bold">{formatKr(arr)}</p></CardContent></Card>
        <Card className="border border-bergn-card-border"><CardContent className="pt-5 pb-4 px-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Betalende</p><p className="text-2xl font-bold">{paying.length}</p></CardContent></Card>
        <Card className="border border-bergn-card-border"><CardContent className="pt-5 pb-4 px-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Trials</p><p className="text-2xl font-bold">{trials.length}</p></CardContent></Card>
      </div>

      {/* Betalende tenants */}
      <Card className="border border-bergn-card-border">
        <CardHeader><CardTitle className="text-base">Betalende kunder</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {paying.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Ingen betalende kunder endnu</p>
            ) : paying.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <a href={`/superadmin/tenants/${t.id}`} className="font-medium hover:underline">{t.company_name}</a>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{formatKr(PLAN_PRICES[t.plan] ?? 0)}/md</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-300 text-green-700 capitalize">{t.plan}</span>
                  {t.plan_expires_at && <span className="text-xs text-gray-400">Fornyes {new Date(t.plan_expires_at).toLocaleDateString('da-DK')}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trials */}
      <Card className="border border-bergn-card-border">
        <CardHeader><CardTitle className="text-base">Aktive trials</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {trials.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Ingen aktive trials</p>
            ) : trials.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <a href={`/superadmin/tenants/${t.id}`} className="font-medium hover:underline">{t.company_name}</a>
                <span className="text-xs text-gray-400">Oprettet {new Date(t.created_at).toLocaleDateString('da-DK')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
