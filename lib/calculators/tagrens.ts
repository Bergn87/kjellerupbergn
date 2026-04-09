import type {
  TagrensPriceConfig,
  TagrensHouseDetails,
  TagrensExtraDetails,
  PriceLineItem,
  PriceResult,
} from './types'

// ============================================
// STANDARD PRISKONFIGURATION
// ============================================

export const DEFAULT_TAGRENS_PRICE_CONFIG: TagrensPriceConfig = {
  tagtyper: {
    'Tegl':        { pris_per_kvm: 150, aktiv: true },
    'Eternit':     { pris_per_kvm: 140, aktiv: true },
    'Fibercement': { pris_per_kvm: 140, aktiv: true },
    'Beton':       { pris_per_kvm: 145, aktiv: true },
    'Cementsten':  { pris_per_kvm: 145, aktiv: true },
    'Zink':        { pris_per_kvm: 160, aktiv: true },
    'Stål':        { pris_per_kvm: 155, aktiv: true },
    'Pandeplader': { pris_per_kvm: 148, aktiv: true },
    'Decra':       { pris_per_kvm: 152, aktiv: true },
    'Andet':       { pris_per_kvm: 150, aktiv: true },
  },
  tillaeg: {
    haeldning_over_30_per_kvm:  80,
    hoejde_over_35m_fast:       6000,
    ingen_tagrender_fast:       5000,
    skjulte_tagrender_fast:     2500,
    ovenlysvinduer_per_stk:     500,
    tagkviste_per_stk:          1200,
    solceller_fast:             3000,
  },
  generelt: {
    moms_procent:        25,
    antal_lag_maling:    3,
    tilbud_gyldigt_dage: 30,
  },
}

// ============================================
// PRISBEREGNING
// ============================================

/**
 * Beregn pris for tagrens (og evt. tagmaling).
 *
 * Alle beløb afrundes til nærmeste hele krone.
 *
 * @throws Error hvis tagtype er inaktiv eller ukendt
 */
export function calculateTagrensPrice(
  houseDetails: TagrensHouseDetails,
  extraDetails: TagrensExtraDetails,
  config: TagrensPriceConfig = DEFAULT_TAGRENS_PRICE_CONFIG
): PriceResult {
  const lineItems: PriceLineItem[] = []

  // ── 1. Grundpris: tagrens ──────────────────────
  const tagConfig = config.tagtyper[houseDetails.tagType]

  if (!tagConfig) {
    throw new Error(`Ukendt tagtype: "${houseDetails.tagType}"`)
  }

  if (!tagConfig.aktiv) {
    throw new Error(`Tagtypen "${houseDetails.tagType}" er ikke aktiv`)
  }

  const tagfladeareal = houseDetails.tagFladeareal
  const grundpris = Math.round(tagfladeareal * tagConfig.pris_per_kvm)

  lineItems.push({
    description: `Tagrens — ${houseDetails.tagType}`,
    quantity: tagfladeareal,
    unit: 'm²',
    unit_price: tagConfig.pris_per_kvm,
    total: grundpris,
  })

  // ── 2. Tillæg: hældning over 30° ──────────────
  if (houseDetails.tagHaeldning > 30) {
    const tillaeg = Math.round(
      tagfladeareal * config.tillaeg.haeldning_over_30_per_kvm
    )
    lineItems.push({
      description: 'Tillæg for stejlt tag (over 30°)',
      quantity: tagfladeareal,
      unit: 'm²',
      unit_price: config.tillaeg.haeldning_over_30_per_kvm,
      total: tillaeg,
    })
  }

  // ── 3. Tillæg: bygningshøjde ≥ 3.5m ──────────
  if (houseDetails.bygningsHoejde >= 3.5) {
    lineItems.push({
      description: 'Tillæg for bygningshøjde (≥ 3,5m)',
      quantity: 1,
      unit: 'stk',
      unit_price: config.tillaeg.hoejde_over_35m_fast,
      total: config.tillaeg.hoejde_over_35m_fast,
    })
  }

  // ── 4. Tillæg: ingen tagrender ─────────────────
  if (!extraDetails.harTagrender) {
    lineItems.push({
      description: 'Tillæg for manglende tagrender',
      quantity: 1,
      unit: 'stk',
      unit_price: config.tillaeg.ingen_tagrender_fast,
      total: config.tillaeg.ingen_tagrender_fast,
    })
  }

  // ── 5. Tillæg: skjulte tagrender ──────────────
  if (extraDetails.harSkjulteTagrender) {
    lineItems.push({
      description: 'Tillæg for skjulte tagrender',
      quantity: 1,
      unit: 'stk',
      unit_price: config.tillaeg.skjulte_tagrender_fast,
      total: config.tillaeg.skjulte_tagrender_fast,
    })
  }

  // ── 6. Tillæg: ovenlysvinduer ─────────────────
  if (extraDetails.antalOvenlysvinduer > 0) {
    const total = Math.round(
      extraDetails.antalOvenlysvinduer * config.tillaeg.ovenlysvinduer_per_stk
    )
    lineItems.push({
      description: 'Ovenlysvinduer',
      quantity: extraDetails.antalOvenlysvinduer,
      unit: 'stk',
      unit_price: config.tillaeg.ovenlysvinduer_per_stk,
      total,
    })
  }

  // ── 7. Tillæg: tagkviste ──────────────────────
  if (extraDetails.antalTagkviste > 0) {
    const total = Math.round(
      extraDetails.antalTagkviste * config.tillaeg.tagkviste_per_stk
    )
    lineItems.push({
      description: 'Tagkviste',
      quantity: extraDetails.antalTagkviste,
      unit: 'stk',
      unit_price: config.tillaeg.tagkviste_per_stk,
      total,
    })
  }

  // ── 8. Tillæg: solceller ──────────────────────
  if (extraDetails.harSolceller) {
    lineItems.push({
      description: 'Tillæg for solceller',
      quantity: 1,
      unit: 'stk',
      unit_price: config.tillaeg.solceller_fast,
      total: config.tillaeg.solceller_fast,
    })
  }

  // ── Totalberegning ────────────────────────────
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const momsProcent = config.generelt.moms_procent
  const vatAmount = Math.round(subtotal * (momsProcent / 100))
  const totalExclVat = subtotal
  const totalInclVat = subtotal + vatAmount

  return {
    lineItems,
    subtotal,
    vatAmount,
    totalExclVat,
    totalInclVat,
  }
}
