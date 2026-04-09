import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/admin/StatusBadge'
import QuoteNotes from './QuoteNotes'
import { ArrowLeft, Download, Mail, ExternalLink } from 'lucide-react'
import type { Quote, QuoteLineItem } from '@/types'

function formatKr(n: number | null): string {
  if (n == null) return '-'
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const { id } = await params
  const tenant = await getCurrentTenant()
  if (!tenant) redirect('/onboarding')

  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single<Quote>()

  if (!quote) notFound()

  const lineItems = (quote.line_items ?? []) as QuoteLineItem[]
  const houseDetails = quote.house_details as Record<string, unknown> | null
  const primary = tenant.primary_color || '#1B4332'

  // Tidslinje-events
  const timeline: { label: string; date: string; icon: string }[] = [
    { label: 'Oprettet', date: formatDateTime(quote.created_at), icon: '📝' },
  ]
  if (quote.mail_sent_at) timeline.push({ label: 'Mail sendt', date: formatDateTime(quote.mail_sent_at), icon: '✉️' })
  if (quote.sms_sent_at) timeline.push({ label: 'SMS sendt', date: formatDateTime(quote.sms_sent_at), icon: '📱' })
  if (quote.reminders_sent > 0 && quote.last_reminder_at) {
    timeline.push({ label: `${quote.reminders_sent} påmindelse(r) sendt`, date: formatDateTime(quote.last_reminder_at), icon: '🔔' })
  }
  if (quote.accepted_at) timeline.push({ label: 'Accepteret', date: formatDateTime(quote.accepted_at), icon: '✅' })
  if (quote.rejected_at) {
    timeline.push({ label: `Afvist${quote.rejection_reason ? ': ' + quote.rejection_reason : ''}`, date: formatDateTime(quote.rejected_at), icon: '❌' })
  }
  if (quote.expired_at) timeline.push({ label: 'Udløbet', date: formatDateTime(quote.expired_at), icon: '⏰' })

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/quotes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{quote.quote_number}</h1>
              <StatusBadge status={quote.status} />
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-gray-100">
                {quote.source === 'calculator' ? 'Beregner' : 'Manuel'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Oprettet {formatDate(quote.created_at)}
              {quote.expires_at && ` · Udløber ${formatDate(quote.expires_at)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {quote.pdf_url && (
            <a href={quote.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </a>
          )}
          <a href={`/q/${quote.quote_uuid}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Tilbudsside
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VENSTRE KOLONNE */}
        <div className="lg:col-span-2 space-y-6">
          {/* KUNDE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Kunde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Navn: </span>
                  <span className="font-medium">{quote.customer_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <a href={`mailto:${quote.customer_email}`} className="text-primary hover:underline">{quote.customer_email}</a>
                </div>
                {quote.customer_phone && (
                  <div>
                    <span className="text-muted-foreground">Telefon: </span>
                    <a href={`tel:${quote.customer_phone}`} className="text-primary hover:underline">{quote.customer_phone}</a>
                  </div>
                )}
                {quote.customer_address && (
                  <div>
                    <span className="text-muted-foreground">Adresse: </span>
                    <span>{quote.customer_address}</span>
                  </div>
                )}
              </div>
              {quote.customer_id && (
                <Link href={`/admin/customers/${quote.customer_id}`} className="text-xs text-primary hover:underline mt-3 inline-block">
                  Se kundeprofil →
                </Link>
              )}
            </CardContent>
          </Card>

          {/* EJENDOM */}
          {houseDetails && quote.source === 'calculator' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Ejendomsdata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Tagtype: </span><span className="font-medium">{String(houseDetails.tagType ?? '-')}</span></div>
                  <div><span className="text-muted-foreground">Areal: </span><span className="font-medium">{String(houseDetails.tagFladeareal ?? '-')} m²</span></div>
                  <div><span className="text-muted-foreground">Hældning: </span><span className="font-medium">{String(houseDetails.tagHaeldning ?? '-')}°</span></div>
                  <div><span className="text-muted-foreground">Højde: </span><span className="font-medium">{String(houseDetails.bygningsHoejde ?? '-')} m</span></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PRISSPECIFIKATION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Prisspecifikation</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-5 py-2.5 text-left font-medium">Ydelse</th>
                    <th className="px-5 py-2.5 text-center font-medium hidden md:table-cell">Beregning</th>
                    <th className="px-5 py-2.5 text-right font-medium">Beløb</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-5 py-2.5">{item.description}</td>
                      <td className="px-5 py-2.5 text-center text-muted-foreground hidden md:table-cell">
                        {item.quantity} {item.unit} × {formatKr(item.unit_price)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium">{formatKr(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t px-5 py-4">
                <div className="flex justify-end">
                  <div className="space-y-1 text-sm min-w-[240px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ekskl. moms</span><span>{formatKr(quote.total_excl_vat)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Moms (25%)</span><span>{formatKr(quote.vat_amount)}</span></div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total inkl. moms</span>
                      <span style={{ color: primary }}>{formatKr(quote.total_incl_vat)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HØJRE KOLONNE */}
        <div className="space-y-6">
          {/* KOMMUNIKATION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Kommunikation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Mail: </span>
                {quote.mail_sent_at ? (
                  <span className="text-green-600">Sendt {formatDate(quote.mail_sent_at)}</span>
                ) : (
                  <span className="text-muted-foreground">Ikke sendt</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-base">📱</span>
                <span>SMS: </span>
                {quote.sms_sent_at ? (
                  <span className="text-green-600">Sendt {formatDate(quote.sms_sent_at)}</span>
                ) : tenant.plan === 'trial' || tenant.plan === 'starter' ? (
                  <span className="text-muted-foreground">Ikke på plan</span>
                ) : (
                  <span className="text-muted-foreground">Ikke sendt</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-base">🔔</span>
                <span>Påmindelser: {quote.reminders_sent}</span>
              </div>
            </CardContent>
          </Card>

          {/* INTERNE NOTER */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Interne noter</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteNotes quoteId={quote.id} initialNotes={quote.internal_notes ?? ''} />
            </CardContent>
          </Card>

          {/* TIDSLINJE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tidslinje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-base">{event.icon}</span>
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
