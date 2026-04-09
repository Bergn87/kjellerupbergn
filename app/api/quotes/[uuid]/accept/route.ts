import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Quote, Tenant, TenantSetting } from '@/types'
import { sendQuoteMail, sendAdminNotification } from '@/lib/mail'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params
  const supabase = await createAdminClient()

  // Hent quote
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_uuid', uuid)
    .single<Quote>()

  if (!quote) {
    return NextResponse.json({ error: 'Tilbud ikke fundet' }, { status: 404 })
  }

  if (quote.status !== 'pending') {
    return NextResponse.json(
      { error: 'Tilbuddet kan ikke accepteres (status: ' + quote.status + ')' },
      { status: 400 }
    )
  }

  // Opdatér status
  await supabase
    .from('quotes')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    } as never)
    .eq('id', quote.id)

  // Hent tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', quote.tenant_id)
    .single<Tenant>()

  if (tenant) {
    // Hent settings
    const { data: settingsRows } = await supabase
      .from('tenant_settings')
      .select('key, value')
      .eq('tenant_id', tenant.id)

    const settings: Record<string, string> = {}
    ;(settingsRows as TenantSetting[] | null)?.forEach((row) => {
      if (row.value) settings[row.key] = row.value
    })

    // Send bekræftelsesmail + admin-notifikation (fejl stopper ikke)
    const acceptedQuote = { ...quote, status: 'accepted' as const }
    await Promise.allSettled([
      sendQuoteMail(acceptedQuote, tenant, {
        ...settings,
        quote_mail_subject: settings['confirmation_mail_subject'] ?? 'Tak for din accept — {{firma_navn}}',
        quote_mail_body: settings['confirmation_mail_body'] ?? 'Hej {{kunde_navn}},\n\nTak fordi du har accepteret tilbud {{tilbud_nummer}}.\n\nVi kontakter dig hurtigst muligt.\n\nVenlig hilsen\n{{firma_navn}}',
      }),
      sendAdminNotification(acceptedQuote, tenant, settings),
    ])
  }

  return NextResponse.json({ success: true })
}
