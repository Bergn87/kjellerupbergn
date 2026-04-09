import type { BBRData } from '@/types'

// ============================================
// BBR TAGTYPE MAPPING (kode → dansk)
// ============================================

const TAG_TYPE_MAP: Record<string, string> = {
  '1': 'Tagpap med built-up',
  '2': 'Tagpap',
  '3': 'Fibercement (bølge)',
  '4': 'Cementsten',
  '5': 'Tegl',
  '6': 'Eternit/Asbestfri fibercement',
  '7': 'Metal',
  '10': 'Fibercement (skiffer)',
  '11': 'Zink',
  '12': 'Stål',
  '20': 'Pandeplader (stål/aluminium)',
  '23': 'Decra',
  '80': 'Levende tag (grønt)',
  '90': 'Andet',
}

/**
 * Map BBR tagtype-kode til dansk navn.
 * Falder tilbage til "Andet" ved ukendt kode.
 */
function mapTagType(kode: string | null | undefined): string {
  if (!kode) return 'Ukendt'
  return TAG_TYPE_MAP[kode] ?? 'Andet'
}

// ============================================
// MOCK FALLBACK
// ============================================

const MOCK_BBR_DATA: BBRData = {
  tagType: 'Tegl',
  tagTypeKode: '5',
  boligAreal: 120,
  tagHaeldning: 45,
  tagFladeareal: 170,
  bygningsHoejde: 3.5,
  byggeaar: 1985,
  raw: {},
}

// ============================================
// FETCH BBR DATA
// ============================================

/**
 * Hent bygningsdata fra BBR (Bygnings- og Boligregisteret)
 * via Datafordeleren.
 *
 * @param adgAdrId - Adgangsadresse-ID fra DAWA
 * @returns BBRData eller null ved fejl/ingen data
 */
export async function fetchBBRData(
  adgAdrId: string
): Promise<BBRData | null> {
  const username = process.env.DATAFORDELER_USERNAME
  const password = process.env.DATAFORDELER_PASSWORD

  // Mock fallback hvis env vars ikke er sat
  if (!username || !password) {
    console.warn('BBR: Bruger mock-data (DATAFORDELER credentials mangler)')
    return MOCK_BBR_DATA
  }

  try {
    const params = new URLSearchParams({
      HusnummerId: adgAdrId,
      status: '6',
      format: 'json',
    })

    const url = `https://services.datafordeler.dk/BBR/BBRPublic/1/rest/bygning?${params}`
    const auth = Buffer.from(`${username}:${password}`).toString('base64')

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      next: { revalidate: 86400 }, // Cache 24 timer
    })

    if (!res.ok) {
      console.error(`BBR API fejl: ${res.status} ${res.statusText}`)
      return null
    }

    const data = await res.json()

    // BBR returnerer et array af bygninger
    // Vi vælger den første med boligareal (primær boligbygning)
    const bygninger = Array.isArray(data) ? data : []

    if (bygninger.length === 0) {
      return null
    }

    // Find primær bygning (den med størst boligareal)
    const bygning = bygninger.reduce(
      (best: Record<string, unknown> | null, current: Record<string, unknown>) => {
        const currentAreal = getNestedNumber(current, 'byg038SamletBygningsareal') ?? 0
        const bestAreal = best
          ? getNestedNumber(best, 'byg038SamletBygningsareal') ?? 0
          : 0
        return currentAreal > bestAreal ? current : best
      },
      null
    )

    if (!bygning) return null

    // Udtræk felter
    const tagTypeKode = getNestedString(bygning, 'byg033Tagdaekningsmateriale')
    const boligAreal = getNestedNumber(bygning, 'byg038SamletBygningsareal')
    const tagHaeldning = getNestedNumber(bygning, 'byg034SupplerendeTagdaekning') // Kan variere
    const bygningsHoejde = getNestedNumber(bygning, 'byg054AntalEtager')
      ? (getNestedNumber(bygning, 'byg054AntalEtager')! * 2.8) // Estimat
      : null
    const byggeaar = getNestedNumber(bygning, 'byg026Opførelsesår')

    // Beregn tagfladeareal
    const effektivHaeldning = tagHaeldning ?? 30 // Standard 30° hvis ukendt
    const tagFladeareal = boligAreal
      ? Math.round(boligAreal / Math.cos((effektivHaeldning * Math.PI) / 180))
      : null

    return {
      tagType: mapTagType(tagTypeKode),
      tagTypeKode,
      boligAreal,
      tagHaeldning: effektivHaeldning,
      tagFladeareal,
      bygningsHoejde,
      byggeaar,
      raw: bygning,
    }
  } catch (err) {
    console.error('BBR fetch fejl:', err)
    return null
  }
}

// ============================================
// HJÆLPERE TIL NESTED DATA
// ============================================

function getNestedString(
  obj: Record<string, unknown>,
  key: string
): string | null {
  const val = obj[key]
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  return null
}

function getNestedNumber(
  obj: Record<string, unknown>,
  key: string
): number | null {
  const val = obj[key]
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    return isNaN(parsed) ? null : parsed
  }
  return null
}
