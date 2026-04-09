import type { IsoleringsPriceConfig, IsoleringsCalculatorData, PriceResult, PriceLineItem } from './types'

export const DEFAULT_ISOLERINGS_PRICE_CONFIG: IsoleringsPriceConfig = {
  loft: {
    basis_per_kvm: 150,
    tykkelse_tillaeg: {
      '100mm': 0,
      '200mm': 30,
      '300mm': 60,
      '400mm': 100,
    },
  },
  hulmur: {
    basis_per_kvm: 200,
    murtykkelse_multiplier: {
      '23cm': 1.0,
      '34cm': 1.3,
      andet: 1.2,
    },
  },
  minimum_pris: 8000,
  moms_procent: 25,
}

export function calculateIsoleringsPrice(
  data: IsoleringsCalculatorData,
  config: IsoleringsPriceConfig = DEFAULT_ISOLERINGS_PRICE_CONFIG
): PriceResult {
  const lineItems: PriceLineItem[] = []

  // Loftisolering
  if (data.isoleringType === 'loft' || data.isoleringType === 'begge') {
    const tykkelseTillaeg = config.loft.tykkelse_tillaeg[data.loftTykkelse ?? '200mm'] ?? 0
    const prisPerKvm = config.loft.basis_per_kvm + tykkelseTillaeg
    const total = Math.round(data.boligAreal * prisPerKvm)

    lineItems.push({
      description: `Loftisolering (${data.loftTykkelse ?? '200mm'})`,
      quantity: data.boligAreal,
      unit: 'm²',
      unit_price: prisPerKvm,
      total,
    })
  }

  // Hulmursisolering
  if (data.isoleringType === 'hulmur' || data.isoleringType === 'begge') {
    const murMultiplier = config.hulmur.murtykkelse_multiplier[data.murTykkelse ?? '23cm'] ?? 1
    const prisPerKvm = Math.round(config.hulmur.basis_per_kvm * murMultiplier)

    // Hulmur areal ≈ omkreds × højde ≈ 4 × √boligAreal × (etager × 2.8)
    const estimertHulmurAreal = Math.round(4 * Math.sqrt(data.boligAreal) * 2.8)
    const total = Math.round(estimertHulmurAreal * prisPerKvm)

    lineItems.push({
      description: `Hulmursisolering (${data.murTykkelse ?? '23cm'} mur)`,
      quantity: estimertHulmurAreal,
      unit: 'm²',
      unit_price: prisPerKvm,
      total,
    })
  }

  const subtotal = Math.max(lineItems.reduce((s, i) => s + i.total, 0), config.minimum_pris)
  const vatAmount = Math.round(subtotal * (config.moms_procent / 100))

  return { lineItems, subtotal, vatAmount, totalExclVat: subtotal, totalInclVat: subtotal + vatAmount }
}
