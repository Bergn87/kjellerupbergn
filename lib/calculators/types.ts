// ============================================
// TAGRENS PRICE CONFIG
// ============================================

export interface TagTypePriceConfig {
  pris_per_kvm: number
  aktiv: boolean
}

export interface TagrensTillaeg {
  haeldning_over_30_per_kvm: number
  hoejde_over_35m_fast: number
  ingen_tagrender_fast: number
  skjulte_tagrender_fast: number
  ovenlysvinduer_per_stk: number
  tagkviste_per_stk: number
  solceller_fast: number
}

export interface TagrensGenerelt {
  moms_procent: number
  antal_lag_maling: number
  tilbud_gyldigt_dage: number
}

export interface TagrensPriceConfig {
  tagtyper: Record<string, TagTypePriceConfig>
  tillaeg: TagrensTillaeg
  generelt: TagrensGenerelt
}

// ============================================
// BEREGNER INPUT
// ============================================

export interface TagrensHouseDetails {
  tagType: string
  boligAreal: number
  tagFladeareal: number
  tagHaeldning: number
  bygningsHoejde: number
}

export interface TagrensExtraDetails {
  oenskerMaling: boolean
  antalOvenlysvinduer: number
  antalTagkviste: number
  harTagrender: boolean
  harSkjulteTagrender: boolean
  harSolceller: boolean
}

// ============================================
// BEREGNER OUTPUT
// ============================================

export interface PriceLineItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number
}

export interface PriceResult {
  lineItems: PriceLineItem[]
  subtotal: number
  vatAmount: number
  totalExclVat: number
  totalInclVat: number
}
