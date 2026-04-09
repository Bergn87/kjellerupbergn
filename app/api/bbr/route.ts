import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { fetchBBRData } from '@/lib/bbr'

// ============================================
// RATE LIMITING (in-memory, per IP)
// ============================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 60 // max kald
const RATE_LIMIT_WINDOW = 60_000 // per minut (ms)

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

// Ryd gamle entries hvert 5. minut
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60_000)

// ============================================
// VALIDATION
// ============================================

const bbrRequestSchema = z.object({
  adgAdrId: z.string().min(1, 'adgAdrId er påkrævet'),
})

// ============================================
// POST /api/bbr
// ============================================

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'For mange forespørgsler. Prøv igen om lidt.' },
      { status: 429 }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Ugyldig JSON' },
      { status: 400 }
    )
  }

  // Validér
  const result = bbrRequestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validering fejlede', details: result.error.issues },
      { status: 400 }
    )
  }

  // Hent BBR data
  const bbrData = await fetchBBRData(result.data.adgAdrId)

  // Returner data (null er ok — betyder "ingen data fundet")
  return NextResponse.json(
    { data: bbrData },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    }
  )
}
