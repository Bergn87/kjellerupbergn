import type { FliserensPriceConfig, FliserensCalculatorData, PriceResult, PriceLineItem } from './types'

export const DEFAULT_FLISERENS_PRICE_CONFIG: FliserensPriceConfig = {
  basis_per_kvm: 50,
  impraegnering_per_kvm: 30,
  beskidt_tillaeg_procent: 20,
  trappe_per_stk: 200,
  minimum_pris: 1500,
  moms_procent: 25,
  omraade_multiplier: {
    indkoersel: 1.0,
    terrasse: 1.0,
    fliser: 1.0,
    belaegningssten: 1.1,
    traedaek: 1.2,
    andet: 1.0,
  },
}

export function calculateFliserensPrice(
  data: FliserensCalculatorData,
  config: FliserensPriceConfig = DEFAULT_FLISERENS_PRICE_CONFIG
): PriceResult {
  const lineItems: PriceLineItem[] = []

  const multiplier = config.omraade_multiplier[data.omraade] ?? 1
  const basisPris = Math.round(data.areal * config.basis_per_kvm * multiplier)

  lineItems.push({
    description: `Fliserens — ${data.omraade}`,
    quantity: data.areal,
    unit: 'm²',
    unit_price: Math.round(config.basis_per_kvm * multiplier),
    total: basisPris,
  })

  if (data.inkluderImpraegnering) {
    const impPris = Math.round(data.areal * config.impraegnering_per_kvm)
    lineItems.push({
      description: 'Imprægnering',
      quantity: data.areal, unit: 'm²',
      unit_price: config.impraegnering_per_kvm, total: impPris,
    })
  }

  if (data.erMegetBeskidt) {
    const tillaeg = Math.round(basisPris * (config.beskidt_tillaeg_procent / 100))
    lineItems.push({
      description: 'Tillæg for meget beskidte fliser',
      quantity: 1, unit: 'stk', unit_price: tillaeg, total: tillaeg,
    })
  }

  if (data.harTrapper && data.antalTrapper > 0) {
    const trappePris = data.antalTrapper * config.trappe_per_stk
    lineItems.push({
      description: 'Trapper',
      quantity: data.antalTrapper, unit: 'stk',
      unit_price: config.trappe_per_stk, total: trappePris,
    })
  }

  const subtotal = Math.max(
    lineItems.reduce((s, i) => s + i.total, 0),
    config.minimum_pris
  )
  const vatAmount = Math.round(subtotal * (config.moms_procent / 100))

  return {
    lineItems, subtotal, vatAmount,
    totalExclVat: subtotal,
    totalInclVat: subtotal + vatAmount,
  }
}
