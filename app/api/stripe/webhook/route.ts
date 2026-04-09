import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getPlanFromPriceId, getPlanConfig } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe webhook signature fejl:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Returner 200 hurtigt
  const response = NextResponse.json({ received: true })

  // Process async
  try {
    await handleEvent(event)
  } catch (err) {
    console.error('Stripe webhook processing fejl:', err)
  }

  return response
}

async function handleEvent(event: Stripe.Event) {
  const supabase = await createAdminClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const priceId = subscription.items.data[0]?.price?.id

      if (!priceId) break

      const plan = getPlanFromPriceId(priceId)
      if (!plan) break

      const planConfig = getPlanConfig(plan)

      await supabase
        .from('tenants')
        .update({
          plan,
          leads_quota: planConfig.quota,
          plan_expires_at: (subscription as unknown as { current_period_end: number }).current_period_end
            ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()
            : null,
          stripe_subscription_id: subscription.id,
        } as never)
        .eq('stripe_customer_id', customerId)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from('tenants')
        .update({
          plan: 'expired',
          leads_quota: 0,
          stripe_subscription_id: null,
        } as never)
        .eq('stripe_customer_id', customerId)

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      console.error(`Betaling fejlet for kunde: ${customerId}`)
      // TODO: sendPaymentFailedMail(tenant)
      break
    }
  }
}
