import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import QuoteCalculator from '@/components/calculator/QuoteCalculator'
import { DEFAULT_TAGRENS_PRICE_CONFIG } from '@/lib/calculators/tagrens'
import type { TagrensPriceConfig } from '@/lib/calculators/types'
import type { Tenant, Calculator } from '@/types'
import EmbedResizer from './EmbedResizer'

interface PageProps {
  params: Promise<{ tenant: string; calculator: string }>
  searchParams: Promise<{ color?: string }>
}

export default async function EmbedPage({ params, searchParams }: PageProps) {
  const { tenant: tenantSlug, calculator: calcSlug } = await params
  const { color } = await searchParams

  const supabase = await createAdminClient()

  // Hent tenant via ID eller slug
  let tenant: Tenant | null = null

  // Prøv som UUID først
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(tenantSlug)) {
    const { data } = await supabase
      .from('tenants').select('*').eq('id', tenantSlug).eq('is_active', true).single<Tenant>()
    tenant = data
  }

  // Ellers som slug
  if (!tenant) {
    const { data } = await supabase
      .from('tenants').select('*').eq('slug', tenantSlug).eq('is_active', true).single<Tenant>()
    tenant = data
  }

  if (!tenant) notFound()

  // Hent calculator
  let calculator: Calculator | null = null

  if (uuidRegex.test(calcSlug)) {
    const { data } = await supabase
      .from('calculators').select('*').eq('id', calcSlug).eq('is_active', true).single<Calculator>()
    calculator = data
  }

  if (!calculator) {
    const { data } = await supabase
      .from('calculators').select('*').eq('tenant_id', tenant.id).eq('slug', calcSlug).eq('is_active', true).single<Calculator>()
    calculator = data
  }

  // Fallback: første aktive calculator
  if (!calculator) {
    const { data } = await supabase
      .from('calculators').select('*').eq('tenant_id', tenant.id).eq('is_active', true).limit(1).single<Calculator>()
    calculator = data
  }

  const priceConfig = (calculator?.price_config as unknown as TagrensPriceConfig) ?? DEFAULT_TAGRENS_PRICE_CONFIG
  const primaryColor = color || tenant.primary_color || '#1B4332'

  // Sæt headers til at tillade iframe embedding
  const headersList = await headers()
  void headersList // bruges for at force dynamic rendering

  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <QuoteCalculator
        tenantId={tenant.id}
        calculatorId={calculator?.id ?? ''}
        calculatorType={(calculator?.type as import('@/lib/calculators/types').CalculatorType) ?? 'tagrens'}
        priceConfig={priceConfig}
        primaryColor={primaryColor}
      />
      <EmbedResizer />
    </div>
  )
}
