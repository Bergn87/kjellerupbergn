import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import QuoteCalculator from '@/components/calculator/QuoteCalculator'
import type { TagrensPriceConfig } from '@/lib/calculators/types'
import { DEFAULT_TAGRENS_PRICE_CONFIG } from '@/lib/calculators/tagrens'
import type { Tenant, Calculator } from '@/types'
import { Home, Paintbrush, Droplets, Sparkles, Settings } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

const TYPE_LABELS: Record<string, string> = {
  tagrens: 'Tagrens & Tagmaling',
  maler: 'Malerarbejde',
  fliserens: 'Fliserens',
  vinduespolering: 'Vinduespolering',
  isolering: 'Isolering',
  generisk: 'Beregner',
}

const TYPE_ICONS: Record<string, typeof Home> = {
  tagrens: Home,
  maler: Paintbrush,
  fliserens: Droplets,
  vinduespolering: Sparkles,
  generisk: Settings,
  isolering: Home,
}

export default async function SubdomainPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Hent tenant via slug
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single<Tenant>()

  if (!tenant) notFound()

  const primary = tenant.primary_color ?? '#1B4332'

  // Hent ALLE aktive beregnere
  const { data: calculators } = await supabase
    .from('calculators')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const calcs = (calculators ?? []) as Calculator[]

  // Hvis ingen beregnere
  if (calcs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold" style={{ color: primary }}>{tenant.company_name}</h1>
          <p className="text-muted-foreground mt-2">Ingen beregnere tilgængelige i øjeblikket.</p>
        </div>
      </div>
    )
  }

  // Hvis én beregner → vis direkte
  if (calcs.length === 1) {
    const calc = calcs[0]
    const priceConfig = (calc.price_config as unknown as TagrensPriceConfig) ?? DEFAULT_TAGRENS_PRICE_CONFIG

    return (
      <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="mb-6 text-center">
          {tenant.company_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.company_logo_url} alt={tenant.company_name} className="mx-auto h-12 mb-2 object-contain" />
          ) : (
            <h1 className="text-2xl font-bold" style={{ color: primary }}>{tenant.company_name}</h1>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Få et hurtigt prisoverslag
          </p>
        </div>

        <QuoteCalculator
          tenantId={tenant.id}
          calculatorId={calc.id}
          calculatorType={calc.type as import('@/lib/calculators/types').CalculatorType}
          priceConfig={priceConfig}
          primaryColor={primary}
        />
      </div>
    )
  }

  // Hvis flere beregnere → vis valg-skærm
  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="mb-8 text-center">
        {tenant.company_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.company_logo_url} alt={tenant.company_name} className="mx-auto h-12 mb-2 object-contain" />
        ) : (
          <h1 className="text-2xl font-bold" style={{ color: primary }}>{tenant.company_name}</h1>
        )}
        <p className="text-sm text-muted-foreground mt-1">Vælg en beregner</p>
      </div>

      <div className="mx-auto max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
        {calcs.map((calc) => {
          const Icon = TYPE_ICONS[calc.type] ?? Settings
          const label = TYPE_LABELS[calc.type] ?? calc.name
          return (
            <Link
              key={calc.id}
              href={`/b/${slug}/${calc.slug}`}
              className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: primary + '15' }}>
                <Icon className="h-7 w-7" style={{ color: primary }} />
              </div>
              <div>
                <h3 className="font-semibold">{calc.name}</h3>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
