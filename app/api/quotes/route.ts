import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { CreateQuoteSchema, normalizePhone } from '@/lib/validations/quote'
import { sendQuoteMail, sendAdminNotification } from '@/lib/mail'
import { sendQuoteSMS } from '@/lib/sms'
import type { Tenant, Quote, TenantSetting } from '@/types'

// ============================================
// POST /api/quotes — Lead-indsendelse
// ============================================

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 })
  }

  // ── Validér med Zod ───────────────────────
  const result = CreateQuoteSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validering fejlede', details: result.error.issues },
      { status: 400 }
    )
  }

  const input = result.data
  const supabase = await createAdminClient()

  // ── Rate limiting ─────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const { count: recentCount } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('endpoint', 'quotes')
    .gte('created_at', new Date(Date.now() - 3600_000).toISOString())

  if ((recentCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'For mange forespørgsler. Prøv igen senere.' },
      { status: 429 }
    )
  }

  // ── Hent tenant ───────────────────────────
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', input.tenantId)
    .eq('is_active', true)
    .single<Tenant>()

  if (!tenant) {
    return NextResponse.json({ error: 'Virksomhed ikke fundet' }, { status: 404 })
  }

  // ── Kvote-check ───────────────────────────
  if (tenant.leads_used_this_month >= tenant.leads_quota) {
    return NextResponse.json(
      { error: 'Månedlig kvote opbrugt. Kontakt firmaet direkte.' },
      { status: 402 }
    )
  }

  // ── Upsert customer ───────────────────────
  const { data: customer } = await supabase
    .from('customers')
    .upsert(
      {
        tenant_id: tenant.id,
        name: input.name,
        email: input.email,
        phone: normalizePhone(input.phone),
        address: input.address,
      } as never,
      { onConflict: 'tenant_id,email' }
    )
    .select('id')
    .single<{ id: string }>()

  // ── Hent næste tilbudsnummer ───────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quoteNumberData } = await (supabase.rpc as any)('get_next_quote_number', { p_tenant_id: tenant.id })

  const quoteNumber = (quoteNumberData as unknown as string) ?? `${tenant.quote_prefix}-${new Date().getFullYear()}-0000`

  // ── Beregn udløbsdato ─────────────────────
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  // ── Opret quote ───────────────────────────
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      tenant_id: tenant.id,
      calculator_id: input.calculatorId,
      customer_id: customer?.id ?? null,
      quote_number: quoteNumber,
      status: 'pending',
      source: 'calculator',
      customer_name: input.name,
      customer_email: input.email,
      customer_phone: normalizePhone(input.phone),
      customer_address: input.address,
      bbr_data: (input.bbrData as Record<string, unknown>) ?? null,
      house_details: input.houseDetails,
      extra_details: input.extraDetails,
      line_items: input.lineItems,
      total_excl_vat: input.totalExclVat,
      vat_amount: input.totalInclVat - input.totalExclVat,
      total_incl_vat: input.totalInclVat,
      subtotal: input.totalExclVat,
      expires_at: expiresAt.toISOString(),
      internal_notes: input.message ?? null,
    } as never)
    .select('*')
    .single<Quote>()

  if (quoteError || !quote) {
    console.error('Quote insert fejl:', quoteError)
    return NextResponse.json(
      { error: 'Kunne ikke oprette tilbud. Prøv igen.' },
      { status: 500 }
    )
  }

  // ── Hent tenant settings ──────────────────
  const { data: settingsRows } = await supabase
    .from('tenant_settings')
    .select('key, value')
    .eq('tenant_id', tenant.id)

  const settings: Record<string, string> = {}
  ;(settingsRows as TenantSetting[] | null)?.forEach((row) => {
    if (row.value) settings[row.key] = row.value
  })

  // ── Kør kommunikation i parallel ──────────
  // Fejl stopper IKKE quote-oprettelsen
  const tasks: Promise<void>[] = [
    sendQuoteMail(quote, tenant, settings).catch((err) =>
      console.error('Mail fejl:', err)
    ),
    sendQuoteSMS(quote, tenant, settings).catch((err) =>
      console.error('SMS fejl:', err)
    ),
    sendAdminNotification(quote, tenant, settings).catch((err) =>
      console.error('Admin notification fejl:', err)
    ),
  ]

  // Opdatér mail_sent_at efter afsendelse
  tasks.push(
    supabase
      .from('quotes')
      .update({ mail_sent_at: new Date().toISOString() } as never)
      .eq('id', quote.id)
      .then(() => undefined) as unknown as Promise<void>
  )

  // Vent på alle (fejl fanges individuelt)
  await Promise.allSettled(tasks)

  // ── Increment leads_used_this_month ───────
  await supabase
    .from('tenants')
    .update({ leads_used_this_month: tenant.leads_used_this_month + 1 } as never)
    .eq('id', tenant.id)

  // ── Log til rate_limits ───────────────────
  await supabase.from('rate_limits').insert({
    ip_address: ip,
    tenant_id: tenant.id,
    endpoint: 'quotes',
  } as never)

  // ── Returner succes ───────────────────────
  return NextResponse.json({
    success: true,
    quoteUuid: quote.quote_uuid,
  })
}
