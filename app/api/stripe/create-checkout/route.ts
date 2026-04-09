import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { getCurrentUser, getCurrentTenant } from '@/lib/supabase/helpers'
import { getStripe, getOrCreateStripeCustomer, getPriceIdForPlan } from '@/lib/stripe'
import type { Tenant } from '@/types'

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'business']),
  interval: z.enum(['month', 'year']).optional().default('month'),
})

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const tenant = await getCurrentTenant()
  if (!tenant) return NextResponse.json({ error: 'Ingen virksomhed' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 })
  }

  const result = checkoutSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Ugyldig plan' }, { status: 400 })
  }

  const { plan } = result.data
  const priceId = getPriceIdForPlan(plan)
  if (!priceId) {
    return NextResponse.json({ error: 'Pris ikke konfigureret' }, { status: 400 })
  }

  const stripe = getStripe()
  const customerId = await getOrCreateStripeCustomer(tenant as Tenant)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bergn.dk'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/admin/billing?success=true`,
    cancel_url: `${appUrl}/admin/billing`,
    allow_promotion_codes: true,
    metadata: { tenant_id: tenant.id },
  })

  return NextResponse.json({ url: session.url })
}
