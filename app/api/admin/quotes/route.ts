import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentTenant } from '@/lib/supabase/helpers'
import { sendQuoteMail, sendAdminNotification } from '@/lib/mail'
import { sendQuoteSMS } from '@/lib/sms'
import { normalizePhone } from '@/lib/validations/quote'
import type { Quote, Tenant, TenantSetting } from '@/types'

const createManualQuoteSchema = z.object({
  status: z.enum(['draft', 'pending']),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional().default(''),
  customerAddress: z.string().optional().default(''),
  expiresAt: z.string().optional(),
  internalNotes: z.string().optional().default(''),
  lineItems: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number(),
      unit: z.string(),
      unit_price: z.number(),
      total: z.number(),
      sort_order: z.number(),
    })
  ).min(1),
  subtotal: z.number(),
  vatAmount: z.number(),
  totalExclVat: z.number(),
  totalInclVat: z.number(),
})

export async function POST(request: NextRequest) {
  // Auth
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  const tenant = await getCurrentTenant()
  if (!tenant) {
    return NextResponse.json({ error: 'Ingen virksomhed' }, { status: 403 })
  }

  // Parse
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 })
  }

  const result = createManualQuoteSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validering fejlede', details: result.error.issues }, { status: 400 })
  }

  const input = result.data
  const supabase = await createAdminClient()

  // Upsert customer
  const phone = input.customerPhone ? normalizePhone(input.customerPhone) : null
  const { data: customer } = await supabase
    .from('customers')
    .upsert({
      tenant_id: tenant.id,
      name: input.customerName,
      email: input.customerEmail,
      phone,
      address: input.customerAddress || null,
    } as never, { onConflict: 'tenant_id,email' })
    .select('id')
    .single<{ id: string }>()

  // Tilbudsnummer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quoteNumberData } = await (supabase.rpc as any)('get_next_quote_number', { p_tenant_id: tenant.id })
  const quoteNumber = (quoteNumberData as unknown as string) ?? `${tenant.quote_prefix}-${new Date().getFullYear()}-0000`

  // Udløbsdato
  const expiresAt = input.expiresAt
    ? new Date(input.expiresAt).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Opret quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      tenant_id: tenant.id,
      customer_id: customer?.id ?? null,
      quote_number: quoteNumber,
      status: input.status,
      source: 'manual',
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: phone,
      customer_address: input.customerAddress || null,
      line_items: input.lineItems,
      subtotal: input.subtotal,
      vat_amount: input.vatAmount,
      total_excl_vat: input.totalExclVat,
      total_incl_vat: input.totalInclVat,
      expires_at: expiresAt,
      internal_notes: input.internalNotes || null,
    } as never)
    .select('*')
    .single<Quote>()

  if (quoteError || !quote) {
    console.error('Manual quote insert fejl:', quoteError)
    return NextResponse.json({ error: 'Kunne ikke oprette tilbud' }, { status: 500 })
  }

  // Hvis status=pending → send kommunikation
  if (input.status === 'pending') {
    const { data: settingsRows } = await supabase
      .from('tenant_settings')
      .select('key, value')
      .eq('tenant_id', tenant.id)

    const settings: Record<string, string> = {}
    ;(settingsRows as TenantSetting[] | null)?.forEach((row) => {
      if (row.value) settings[row.key] = row.value
    })

    await Promise.allSettled([
      sendQuoteMail(quote, tenant as Tenant, settings).catch((err) => console.error('Mail fejl:', err)),
      sendQuoteSMS(quote, tenant as Tenant, settings).catch((err) => console.error('SMS fejl:', err)),
      sendAdminNotification(quote, tenant as Tenant, settings).catch((err) => console.error('Admin notif fejl:', err)),
    ])

    // Opdatér mail_sent_at
    await supabase
      .from('quotes')
      .update({ mail_sent_at: new Date().toISOString() } as never)
      .eq('id', quote.id)

    // Increment leads
    await supabase
      .from('tenants')
      .update({ leads_used_this_month: tenant.leads_used_this_month + 1 } as never)
      .eq('id', tenant.id)
  }

  return NextResponse.json({
    success: true,
    quoteId: quote.id,
    quoteNumber: quote.quote_number,
  })
}
