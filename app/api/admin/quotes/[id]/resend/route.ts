import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser, assertTenantAccess } from '@/lib/supabase/helpers'
import { sendQuoteMail } from '@/lib/mail'
import { sendQuoteSMS } from '@/lib/sms'
import type { Quote, Tenant, TenantSetting } from '@/types'

const resendSchema = z.object({
  sendMail: z.boolean().optional().default(true),
  sendSMS: z.boolean().optional().default(false),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Auth check
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
  }

  // Parse body
  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // Tom body er ok — defaults bruges
  }

  const result = resendSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Ugyldig data' }, { status: 400 })
  }

  const { sendMail, sendSMS } = result.data
  const supabase = await createAdminClient()

  // Hent quote
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single<Quote>()

  if (!quote) {
    return NextResponse.json({ error: 'Tilbud ikke fundet' }, { status: 404 })
  }

  // Tjek tenant-adgang
  try {
    await assertTenantAccess(quote.tenant_id)
  } catch {
    return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 })
  }

  // Hent tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', quote.tenant_id)
    .single<Tenant>()

  if (!tenant) {
    return NextResponse.json({ error: 'Virksomhed ikke fundet' }, { status: 404 })
  }

  // Hent settings
  const { data: settingsRows } = await supabase
    .from('tenant_settings')
    .select('key, value')
    .eq('tenant_id', tenant.id)

  const settings: Record<string, string> = {}
  ;(settingsRows as TenantSetting[] | null)?.forEach((row) => {
    if (row.value) settings[row.key] = row.value
  })

  // Send i parallel
  const tasks: Promise<void>[] = []

  if (sendMail) {
    tasks.push(
      sendQuoteMail(quote, tenant, settings)
        .then(async () => {
          await supabase
            .from('quotes')
            .update({ mail_sent_at: new Date().toISOString() } as never)
            .eq('id', quote.id)
        })
        .catch((err) => console.error('Resend mail fejl:', err))
    )
  }

  if (sendSMS) {
    tasks.push(
      sendQuoteSMS(quote, tenant, settings)
        .then(async () => {
          await supabase
            .from('quotes')
            .update({ sms_sent_at: new Date().toISOString() } as never)
            .eq('id', quote.id)
        })
        .catch((err) => console.error('Resend SMS fejl:', err))
    )
  }

  await Promise.allSettled(tasks)

  return NextResponse.json({ success: true })
}
