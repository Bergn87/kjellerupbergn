import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCalculatorConfig, getDefaultPriceConfig } from '@/lib/calculators/registry'
import type { CalculatorType, AnyPriceConfig } from '@/lib/calculators/types'

// ============================================
// CONFIG CACHE (60 sek)
// ============================================

const configCache = new Map<string, { config: AnyPriceConfig; type: CalculatorType; expiresAt: number }>()

async function getCalculatorById(calculatorId: string): Promise<{ config: AnyPriceConfig; type: CalculatorType }> {
  const cached = configCache.get(calculatorId)
  if (cached && Date.now() < cached.expiresAt) {
    return { config: cached.config, type: cached.type }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('calculators')
    .select('type, price_config')
    .eq('id', calculatorId)
    .eq('is_active', true)
    .single<{ type: CalculatorType; price_config: AnyPriceConfig }>()

  const type = (data?.type ?? 'tagrens') as CalculatorType
  const config = data?.price_config && Object.keys(data.price_config).length > 0
    ? data.price_config
    : getDefaultPriceConfig(type)

  configCache.set(calculatorId, { config, type, expiresAt: Date.now() + 60_000 })
  return { config, type }
}

// ============================================
// POST /api/calculate-price
// ============================================

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 })
  }

  const calculatorId = body.calculatorId as string | undefined
  const calculatorType = body.calculatorType as CalculatorType | undefined

  try {
    let type: CalculatorType = calculatorType ?? 'tagrens'
    let config: AnyPriceConfig

    if (calculatorId && calculatorId !== 'demo') {
      const result = await getCalculatorById(calculatorId)
      type = result.type
      config = result.config
    } else {
      config = getDefaultPriceConfig(type)
    }

    const calcConfig = getCalculatorConfig(type)
    const priceResult = calcConfig.calculatePrice(body, config)

    return NextResponse.json({ data: priceResult })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Beregningsfejl'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
