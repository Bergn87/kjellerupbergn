import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type { Tenant } from '@/types'

// Lazy init for build-time safety
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-04-30.basil',
    })
  }
  return _stripe
}

// ============================================
// PLAN KONFIGURATION
// ============================================

export interface PlanConfig {
  name: string
  quota: number
  features: {
    sms: boolean
    reminders: boolean
    customBranding: boolean
    multipleCalculators: boolean
    prioritySupport: boolean
  }
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  trial: {
    name: 'Prøveperiode',
    quota: 20,
    features: { sms: false, reminders: true, customBranding: false, multipleCalculators: false, prioritySupport: false },
  },
  starter: {
    name: 'Starter',
    quota: 50,
    features: { sms: false, reminders: true, customBranding: true, multipleCalculators: false, prioritySupport: false },
  },
  pro: {
    name: 'Pro',
    quota: 200,
    features: { sms: true, reminders: true, customBranding: true, multipleCalculators: true, prioritySupport: false },
  },
  business: {
    name: 'Business',
    quota: 1000,
    features: { sms: true, reminders: true, customBranding: true, multipleCalculators: true, prioritySupport: true },
  },
  expired: {
    name: 'Udløbet',
    quota: 0,
    features: { sms: false, reminders: false, customBranding: false, multipleCalculators: false, prioritySupport: false },
  },
}

export function getPlanConfig(plan: string): PlanConfig {
  return PLAN_CONFIGS[plan] ?? PLAN_CONFIGS.trial
}

// ============================================
// PRICE ID MAPPING
// ============================================

const PRICE_ID_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_STARTER_PRICE_ID ?? '']: 'starter',
  [process.env.STRIPE_PRO_PRICE_ID ?? '']: 'pro',
  [process.env.STRIPE_BUSINESS_PRICE_ID ?? '']: 'business',
}

export function getPlanFromPriceId(priceId: string): string | null {
  return PRICE_ID_TO_PLAN[priceId] ?? null
}

export function getPriceIdForPlan(plan: string): string | null {
  switch (plan) {
    case 'starter': return process.env.STRIPE_STARTER_PRICE_ID ?? null
    case 'pro': return process.env.STRIPE_PRO_PRICE_ID ?? null
    case 'business': return process.env.STRIPE_BUSINESS_PRICE_ID ?? null
    default: return null
  }
}

// ============================================
// STRIPE CUSTOMER
// ============================================

export async function getOrCreateStripeCustomer(tenant: Tenant): Promise<string> {
  const stripe = getStripe()

  if (tenant.stripe_customer_id) {
    return tenant.stripe_customer_id
  }

  const customer = await stripe.customers.create({
    name: tenant.company_name,
    email: tenant.company_email,
    metadata: { tenant_id: tenant.id },
  })

  const supabase = await createAdminClient()
  await supabase
    .from('tenants')
    .update({ stripe_customer_id: customer.id } as never)
    .eq('id', tenant.id)

  return customer.id
}
