import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Tenant, Quote, Calculator } from '@/types'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatKr(n: number | null) {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: tenant } = await supabase.from('tenants').select('*').eq('id', id).single<Tenant>()
  if (!tenant) notFound()

  const [quotesRes, calcsRes, revenueRes] = await Promise.all([
    supabase.from('quotes').select('id, quote_number, customer_name, total_incl_vat, status, created_at').eq('tenant_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('calculators').select('id, name, type, is_active').eq('tenant_id', id),
    supabase.from('quotes').select('total_incl_vat').eq('tenant_id', id).eq('status', 'accepted'),
  ])

  const quotes = (quotesRes.data ?? []) as Pick<Quote, 'id' | 'quote_number' | 'customer_name' | 'total_incl_vat' | 'status' | 'created_at'>[]
  const calcs = (calcsRes.data ?? []) as Pick<Calculator, 'id' | 'name' | 'type' | 'is_active'>[]
  const revenue = (revenueRes.data as { total_incl_vat: number | null }[] | null)?.reduce((sum, q) => sum + (q.total_incl_vat ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/tenants" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold">{tenant.company_name}</h1>
          <p className="text-sm text-gray-400">{tenant.slug}.bergn.dk &middot; {tenant.company_email}</p>
        </div>
      </div>

      {/* Info kort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-bergn-card-border">
          <CardHeader><CardTitle className="text-base">Tenant info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Plan</span><Badge className="capitalize">{tenant.plan}</Badge></div>
            <div className="flex justify-between"><span className="text-gray-500">Aktiv</span><span>{tenant.is_active ? 'Ja' : 'Nej'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Leads denne måned</span><span>{tenant.leads_used_this_month} / {tenant.leads_quota}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Omsætning (accepteret)</span><span>{formatKr(revenue)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Oprettet</span><span>{new Date(tenant.created_at).toLocaleDateString('da-DK')}</span></div>
            {tenant.trial_ends_at && <div className="flex justify-between"><span className="text-gray-500">Trial udløber</span><span>{new Date(tenant.trial_ends_at).toLocaleDateString('da-DK')}</span></div>}
            <Separator />
            <div className="flex justify-between"><span className="text-gray-500">CVR</span><span>{tenant.company_cvr ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Telefon</span><span>{tenant.company_phone ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Stripe ID</span><span className="text-xs font-mono">{tenant.stripe_customer_id ?? '-'}</span></div>
          </CardContent>
        </Card>

        <Card className="border border-bergn-card-border">
          <CardHeader><CardTitle className="text-base">Beregnere ({calcs.length})</CardTitle></CardHeader>
          <CardContent>
            {calcs.length === 0 ? (
              <p className="text-sm text-gray-400">Ingen beregnere</p>
            ) : (
              <div className="space-y-2">
                {calcs.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name} <span className="text-gray-400">({c.type})</span></span>
                    <span className={c.is_active ? 'text-green-600 text-xs' : 'text-gray-400 text-xs'}>{c.is_active ? 'Aktiv' : 'Inaktiv'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tilbud */}
      <Card className="border border-bergn-card-border">
        <CardHeader><CardTitle className="text-base">Seneste tilbud ({quotes.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <span className="font-medium">{q.quote_number}</span>
                  <span className="text-gray-400 ml-2">{q.customer_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{formatKr(q.total_incl_vat)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    q.status === 'accepted' ? 'border-green-300 text-green-700'
                    : q.status === 'pending' ? 'border-yellow-300 text-yellow-700'
                    : q.status === 'rejected' ? 'border-red-300 text-red-600'
                    : 'border-gray-300 text-gray-400'
                  }`}>{q.status}</span>
                  <span className="text-gray-400 text-xs">{new Date(q.created_at).toLocaleDateString('da-DK')}</span>
                </div>
              </div>
            ))}
            {quotes.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Ingen tilbud</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
