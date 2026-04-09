import type { CalculatorType, PriceResult, AnyPriceConfig } from './types'
import { calculateTagrensPrice, DEFAULT_TAGRENS_PRICE_CONFIG } from './tagrens'
import { calculateVinduesPrice, DEFAULT_VINDUES_PRICE_CONFIG } from './vinduespolering'
import { calculateMalerPrice, DEFAULT_MALER_PRICE_CONFIG } from './maler'
import { calculateFliserensPrice, DEFAULT_FLISERENS_PRICE_CONFIG } from './fliserens'
import { calculateIsoleringsPrice, DEFAULT_ISOLERINGS_PRICE_CONFIG } from './isolering'

// ============================================
// CALCULATOR TYPE METADATA
// ============================================

export interface CalculatorTypeConfig {
  type: CalculatorType
  label: string
  description: string
  steps: string[]
  defaultConfig: AnyPriceConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculatePrice: (data: any, config: any) => PriceResult
  usesBBR: boolean
}

export const CALCULATOR_TYPES: Record<CalculatorType, CalculatorTypeConfig> = {
  tagrens: {
    type: 'tagrens',
    label: 'Tagrens & Tagmaling',
    description: 'Prisberegner baseret på tagtype, areal og hældning fra BBR',
    steps: ['address', 'bbr_details', 'extras', 'price_preview', 'contact'],
    defaultConfig: DEFAULT_TAGRENS_PRICE_CONFIG,
    calculatePrice: (data, config) => calculateTagrensPrice(data.houseDetails, data.extraDetails, config),
    usesBBR: true,
  },
  vinduespolering: {
    type: 'vinduespolering',
    label: 'Vinduespolering',
    description: 'Tidbaseret beregner med vinduestyper, service og abonnement',
    steps: ['address', 'contact_early', 'vinduer', 'service', 'access', 'confirmation'],
    defaultConfig: DEFAULT_VINDUES_PRICE_CONFIG,
    calculatePrice: (data, config) => calculateVinduesPrice(data, config),
    usesBBR: true,
  },
  maler: {
    type: 'maler',
    label: 'Malerarbejde',
    description: 'Indvendig og udvendig maling med rum- og facadeberegning',
    steps: ['address', 'maler_type', 'rum_valg', 'price_preview', 'contact'],
    defaultConfig: DEFAULT_MALER_PRICE_CONFIG,
    calculatePrice: (data, config) => calculateMalerPrice(data, config),
    usesBBR: true,
  },
  fliserens: {
    type: 'fliserens',
    label: 'Fliserens & Imprægnering',
    description: 'Arealbaseret beregner for terrasse, indkørsel og fliser',
    steps: ['address', 'fliserens_areal', 'price_preview', 'contact'],
    defaultConfig: DEFAULT_FLISERENS_PRICE_CONFIG,
    calculatePrice: (data, config) => calculateFliserensPrice(data, config),
    usesBBR: true,
  },
  isolering: {
    type: 'isolering',
    label: 'Isolering',
    description: 'Loft- og hulmursisolering med byggeårs-estimering',
    steps: ['address', 'bbr_details', 'isolering_type', 'price_preview', 'contact'],
    defaultConfig: DEFAULT_ISOLERINGS_PRICE_CONFIG,
    calculatePrice: (data, config) => calculateIsoleringsPrice(data, config),
    usesBBR: true,
  },
  generisk: {
    type: 'generisk',
    label: 'Generisk',
    description: 'Simpel kontaktformular uden prisberegning',
    steps: ['address', 'contact'],
    defaultConfig: {},
    calculatePrice: () => ({ lineItems: [], subtotal: 0, vatAmount: 0, totalExclVat: 0, totalInclVat: 0 }),
    usesBBR: false,
  },
}

export function getCalculatorConfig(type: CalculatorType): CalculatorTypeConfig {
  return CALCULATOR_TYPES[type] ?? CALCULATOR_TYPES.generisk
}

export function getDefaultPriceConfig(type: CalculatorType): AnyPriceConfig {
  return CALCULATOR_TYPES[type]?.defaultConfig ?? {}
}
