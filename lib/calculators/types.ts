// ============================================
// CALCULATOR TYPE ENUM
// ============================================

export type CalculatorType = 'tagrens' | 'vinduespolering' | 'maler' | 'fliserens' | 'isolering' | 'generisk'

// ============================================
// FÆLLES OUTPUT
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

// ============================================
// TAGRENS
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
  minimum_pris?: number
}

export interface TagrensPriceConfig {
  tagtyper: Record<string, TagTypePriceConfig>
  tillaeg: TagrensTillaeg
  generelt: TagrensGenerelt
}

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
// VINDUESPOLERING
// ============================================

export interface VinduesType {
  id: string
  name: string
  description?: string
  imageUrl?: string
  type: 'enkelt' | 'dobbelt' | 'special'
  indvendigTidMinutter: number
  udvendigTidMinutter: number
  isActive: boolean
  sortOrder: number
}

export interface VinduesPriceConfig {
  timepris: number
  vandtype: {
    traditionel: { multiplier: number }
    rentvandsanlaeg: { multiplier: number }
  }
  ordreType: {
    engangskob: { multiplier: number }
    abonnement: {
      '4_uger': { rabat_procent: number }
      '6_uger': { rabat_procent: number }
      '8_uger': { rabat_procent: number }
      '12_uger': { rabat_procent: number }
    }
  }
  etageGebyr: Record<string, number>
  servicefradrag_procent: number
  minimum_pris: number
  moms_procent: number
  vinduestyper: VinduesType[]
}

export interface VinduesCalculatorData {
  vinduer: { typeId: string; antal: number }[]
  rengoeringstype: 'indvendig' | 'udvendig' | 'begge'
  vandtype: 'traditionel' | 'rentvandsanlaeg'
  ordreType: 'engangskob' | 'abonnement'
  interval?: '4_uger' | '6_uger' | '8_uger' | '12_uger'
  kundeType: 'privat' | 'erhverv'
  etage: number
}

// ============================================
// MALERARBEJDE
// ============================================

export interface MalerRumType {
  id: string
  name: string
  defaultAreal: number
  prisPerKvm: number
}

export interface MalerPriceConfig {
  indvendig: {
    vaeg_per_kvm: number
    loft_per_kvm: number
    karme_per_stk: number
    doer_per_stk: number
  }
  udvendig: {
    facade: Record<string, number>  // facadetype → pris/m²
  }
  tilstand_multiplier: {
    god: number
    middel: number
    daarlig: number
  }
  minimum_pris: number
  moms_procent: number
  rumtyper: MalerRumType[]
}

export interface MalerCalculatorData {
  malertype: 'indvendig' | 'udvendig' | 'begge'
  facadeType?: string
  facadeAreal?: number
  tilstand: 'god' | 'middel' | 'daarlig'
  rum: {
    typeId: string
    antal: number
    areal?: number
    inkluderLoft: boolean
    inkluderVaegge: boolean
    inkluderKarme: boolean
    inkluderDoere: boolean
  }[]
}

// ============================================
// FLISERENS
// ============================================

export interface FliserensPriceConfig {
  basis_per_kvm: number
  impraegnering_per_kvm: number
  beskidt_tillaeg_procent: number
  trappe_per_stk: number
  minimum_pris: number
  moms_procent: number
  omraade_multiplier: Record<string, number>
}

export interface FliserensCalculatorData {
  omraade: string
  areal: number
  inkluderImpraegnering: boolean
  erMegetBeskidt: boolean
  harTrapper: boolean
  antalTrapper: number
}

// ============================================
// ISOLERING
// ============================================

export interface IsoleringsPriceConfig {
  loft: {
    basis_per_kvm: number
    tykkelse_tillaeg: Record<string, number>
  }
  hulmur: {
    basis_per_kvm: number
    murtykkelse_multiplier: Record<string, number>
  }
  minimum_pris: number
  moms_procent: number
}

export interface IsoleringsCalculatorData {
  isoleringType: 'loft' | 'hulmur' | 'begge'
  boligAreal: number
  byggeaar: number
  loftTykkelse?: string
  loftNuværende?: string
  murTykkelse?: string
  hulmurNuværende?: string
}

// ============================================
// FÆLLES CALCULATOR DATA
// ============================================

export type AnyPriceConfig =
  | TagrensPriceConfig
  | VinduesPriceConfig
  | MalerPriceConfig
  | FliserensPriceConfig
  | IsoleringsPriceConfig
  | Record<string, unknown>

export type AnyCalculatorData =
  | (TagrensHouseDetails & { extras: TagrensExtraDetails })
  | VinduesCalculatorData
  | MalerCalculatorData
  | FliserensCalculatorData
  | IsoleringsCalculatorData
