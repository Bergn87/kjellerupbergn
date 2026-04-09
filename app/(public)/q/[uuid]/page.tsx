import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import type { Quote, Tenant, QuoteLineItem, TenantSetting } from '@/types'
import QuoteActions from './QuoteActions'

interface PageProps {
  params: Promise<{ uuid: string }>
}

function formatKr(n: number | null): string {
  if (n == null) return '0 kr.'
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_CONFIG = {
  pending: { label: 'Afventer dit svar', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
  accepted: { label: 'Accepteret — tak!', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  rejected: { label: 'Afvist', bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600' },
  expired: { label: 'Tilbuddet er udløbet', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
  draft: { label: 'Kladde', bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600' },
} as const

export default async function QuotePage({ params }: PageProps) {
  const { uuid } = await params
  const supabase = await createAdminClient()

  // Hent quote via uuid (service role — ingen auth)
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_uuid', uuid)
    .single<Quote>()

  if (!quote) notFound()

  // Hent tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', quote.tenant_id)
    .single<Tenant>()

  if (!tenant) notFound()

  // Hent settings for handelsbetingelser
  const { data: settingsRows } = await supabase
    .from('tenant_settings')
    .select('key, value')
    .eq('tenant_id', tenant.id)

  const settings: Record<string, string> = {}
  ;(settingsRows as TenantSetting[] | null)?.forEach((row) => {
    if (row.value) settings[row.key] = row.value
  })

  const primary = tenant.primary_color || '#1B4332'
  const status = quote.status as keyof typeof STATUS_CONFIG
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const lineItems = (quote.line_items ?? []) as QuoteLineItem[]
  const houseDetails = quote.house_details as Record<string, unknown> | null
  const termsAndConditions = settings['terms_and_conditions'] ?? null

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <header className="border-b bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                {tenant.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tenant.company_logo_url} alt={tenant.company_name} className="h-10 max-w-[200px] object-contain" />
                ) : (
                  <h1 className="text-xl font-bold" style={{ color: primary }}>{tenant.company_name}</h1>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {tenant.company_address && <p>{tenant.company_address}</p>}
                {tenant.company_phone && <p>Tlf: {tenant.company_phone}</p>}
                <p>{tenant.company_email}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          {/* STATUS BANNER */}
          <div className={`rounded-lg border-2 ${statusCfg.bg} ${statusCfg.border} px-6 py-4 text-center`}>
            <p className={`text-lg font-semibold ${statusCfg.text}`}>{statusCfg.label}</p>
          </div>

          {/* TILBUDSHOVED */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-2xl font-bold mb-3" style={{ color: primary }}>TILBUD</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nr: </span>
                <span className="font-semibold">{quote.quote_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Dato: </span>
                <span>{formatDate(quote.created_at)}</span>
              </div>
              {quote.expires_at && (
                <div>
                  <span className="text-muted-foreground">Udløber: </span>
                  <span>{formatDate(quote.expires_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* TIL / FRA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-white p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Til</p>
              <p className="font-semibold">{quote.customer_name}</p>
              {quote.customer_address && <p className="text-sm text-muted-foreground">{quote.customer_address}</p>}
              <p className="text-sm text-muted-foreground">{quote.customer_email}</p>
              {quote.customer_phone && <p className="text-sm text-muted-foreground">Tlf: {quote.customer_phone}</p>}
            </div>
            <div className="rounded-lg border bg-white p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Fra</p>
              <p className="font-semibold">{tenant.company_name}</p>
              {tenant.company_address && <p className="text-sm text-muted-foreground">{tenant.company_address}</p>}
              <p className="text-sm text-muted-foreground">{tenant.company_email}</p>
              {tenant.company_phone && <p className="text-sm text-muted-foreground">Tlf: {tenant.company_phone}</p>}
            </div>
          </div>

          {/* EJENDOMSDATA */}
          {houseDetails && quote.source === 'calculator' && (
            <div className="rounded-lg border bg-white p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Ejendomsdata</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tagtype: </span>
                  <span className="font-medium">{String(houseDetails.tagType ?? '-')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Areal: </span>
                  <span className="font-medium">{String(houseDetails.tagFladeareal ?? '-')} m²</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hældning: </span>
                  <span className="font-medium">{String(houseDetails.tagHaeldning ?? '-')}°</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Højde: </span>
                  <span className="font-medium">{String(houseDetails.bygningsHoejde ?? '-')} m</span>
                </div>
              </div>
            </div>
          )}

          {/* PRISSPECIFIKATION */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: primary, color: 'white' }}>
                  <th className="px-5 py-3 text-left font-semibold">Ydelse</th>
                  <th className="px-5 py-3 text-center font-semibold hidden md:table-cell">Beregning</th>
                  <th className="px-5 py-3 text-right font-semibold">Beløb</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-5 py-3">{item.description}</td>
                    <td className="px-5 py-3 text-center text-muted-foreground hidden md:table-cell">
                      {item.quantity} {item.unit} × {formatKr(item.unit_price)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatKr(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t px-5 py-4">
              <div className="flex justify-end">
                <div className="space-y-1 text-sm min-w-[250px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ekskl. moms</span>
                    <span>{formatKr(quote.total_excl_vat)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Moms (25%)</span>
                    <span>{formatKr(quote.vat_amount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2" style={{ borderColor: primary }}>
                    <span>Total inkl. moms</span>
                    <span style={{ color: primary }}>{formatKr(quote.total_incl_vat)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PDF DOWNLOAD */}
          {quote.pdf_url && (
            <div className="no-print">
              <a
                href={quote.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                📄 Download tilbud som PDF
              </a>
            </div>
          )}

          {/* HANDELSBETINGELSER */}
          {termsAndConditions && (
            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-5 py-3 text-sm font-medium hover:bg-gray-50">
                Handelsbetingelser
              </summary>
              <div className="px-5 pb-4 text-xs text-muted-foreground leading-relaxed border-t pt-3">
                {termsAndConditions}
              </div>
            </details>
          )}

          {/* ACTION KNAPPER */}
          {status === 'pending' && (
            <div className="no-print">
              <QuoteActions quoteUuid={uuid} primaryColor={primary} />
            </div>
          )}
        </main>
      </div>
    </>
  )
}
