import { NextResponse } from 'next/server'
import { getCurrentUser, getCurrentTenant } from '@/lib/supabase/helpers'
import { getStripe, getOrCreateStripeCustomer } from '@/lib/stripe'
import type { Tenant } from '@/types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

  const tenant = await getCurrentTenant()
  if (!tenant) return NextResponse.json({ error: 'Ingen virksomhed' }, { status: 403 })

  const stripe = getStripe()
  const customerId = await getOrCreateStripeCustomer(tenant as Tenant)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bergn.dk'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/admin/billing`,
  })

  return NextResponse.redirect(session.url)
}
