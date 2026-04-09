import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { calculateTagrensPrice, DEFAULT_TAGRENS_PRICE_CONFIG } from '@/lib/calculators/tagrens'
import type { TagrensPriceConfig, TagrensHouseDetails, TagrensExtraDetails } from '@/lib/calculators/types'
import { createClient } from '@/lib/supabase/server'

// ============================================
// VALIDATION
// ============================================

const houseDetailsSchema = z.object({
  tagType: z.string().min(1),
  boligAreal: z.number().positive(),
  tagFladeareal: z.number().positive(),
  tagHaeldning: z.number().min(0).max(90),
  bygningsHoejde: z.number().min(0),
})

const extraDetailsSchema = z.object({
  oenskerMaling: z.boolean(),
  antalOvenlysvinduer: z.number().int().min(0),
  antalTagkviste: z.number().int().min(0),
  harTagrender: z.boolean(),
  harSkjulteTagrender: z.boolean(),
  harSolceller: z.boolean(),
})

const calculateRequestSchema = z.object({
  calculatorId: z.string().uuid().optional(),
  houseDetails: houseDetailsSchema,
  extraDetails: extraDetailsSchema,
})

// ============================================
// CACHE for price_config (60 sek)
// ============================================

const configCache = new Map<string, { config: TagrensPriceConfig; expiresAt: number }>()

async function getPriceConfig(calculatorId?: string): Promise<TagrensPriceConfig> {
  if (!calculatorId) return DEFAULT_TAGRENS_PRICE_CONFIG

  // Check cache
  const cached = configCache.get(calculatorId)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.config
  }

  // Hent fra Supabase
  const supabase = await createClient()
  const { data } = await supabase
    .from('calculators')
    .select('price_config')
    .eq('id', calculatorId)
    .eq('is_active', true)
    .single<{ price_config: TagrensPriceConfig }>()

  const config = data?.price_config ?? DEFAULT_TAGRENS_PRICE_CONFIG

  // Cache i 60 sekunder
  configCache.set(calculatorId, {
    config,
    expiresAt: Date.now() + 60_000,
  })

  return config
}

// ============================================
// POST /api/calculate-price
// ============================================

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ugyldig JSON' }, { status: 400 })
  }

  const result = calculateRequestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validering fejlede', details: result.error.issues },
      { status: 400 }
    )
  }

  const { calculatorId, houseDetails, extraDetails } = result.data

  try {
    const config = await getPriceConfig(calculatorId)

    const priceResult = calculateTagrensPrice(
      houseDetails as TagrensHouseDetails,
      extraDetails as TagrensExtraDetails,
      config
    )

    return NextResponse.json({ data: priceResult })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Beregningsfejl'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
