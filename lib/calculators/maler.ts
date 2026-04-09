import type { MalerPriceConfig, MalerCalculatorData, PriceResult, PriceLineItem } from './types'

export const DEFAULT_MALER_PRICE_CONFIG: MalerPriceConfig = {
  indvendig: {
    vaeg_per_kvm: 180,
    loft_per_kvm: 200,
    karme_per_stk: 300,
    doer_per_stk: 500,
  },
  udvendig: {
    facade: {
      mur: 250,
      trae: 300,
      puds: 220,
      fiberplade: 200,
    },
  },
  tilstand_multiplier: {
    god: 1.0,
    middel: 1.2,
    daarlig: 1.5,
  },
  minimum_pris: 5000,
  moms_procent: 25,
  rumtyper: [
    { id: 'stue', name: 'Stue', defaultAreal: 20, prisPerKvm: 180 },
    { id: 'sovevaer', name: 'Soveværelse', defaultAreal: 12, prisPerKvm: 180 },
    { id: 'boernevaer', name: 'Børneværelse', defaultAreal: 10, prisPerKvm: 180 },
    { id: 'koekken', name: 'Køkken', defaultAreal: 12, prisPerKvm: 180 },
    { id: 'bad', name: 'Badeværelse', defaultAreal: 6, prisPerKvm: 200 },
    { id: 'entre', name: 'Entre/Gang', defaultAreal: 8, prisPerKvm: 180 },
    { id: 'kontor', name: 'Kontor', defaultAreal: 10, prisPerKvm: 180 },
    { id: 'bryggers', name: 'Bryggers', defaultAreal: 6, prisPerKvm: 180 },
  ],
}

export function calculateMalerPrice(
  data: MalerCalculatorData,
  config: MalerPriceConfig = DEFAULT_MALER_PRICE_CONFIG
): PriceResult {
  const lineItems: PriceLineItem[] = []
  const tilstandMultiplier = config.tilstand_multiplier[data.tilstand] ?? 1

  // Indvendig maling
  if (data.malertype === 'indvendig' || data.malertype === 'begge') {
    for (const rum of data.rum) {
      const rumType = config.rumtyper.find(r => r.id === rum.typeId)
      if (!rumType || rum.antal === 0) continue

      const areal = rum.areal ?? rumType.defaultAreal
      const loftHoejde = 2.5

      if (rum.inkluderVaegge) {
        const omkreds = 4 * Math.sqrt(areal)
        const vaegAreal = Math.round(omkreds * loftHoejde)
        const pris = Math.round(vaegAreal * config.indvendig.vaeg_per_kvm * tilstandMultiplier)
        lineItems.push({
          description: `${rumType.name} — vægge (${rum.antal} stk)`,
          quantity: vaegAreal * rum.antal, unit: 'm²',
          unit_price: Math.round(config.indvendig.vaeg_per_kvm * tilstandMultiplier),
          total: pris * rum.antal,
        })
      }

      if (rum.inkluderLoft) {
        const pris = Math.round(areal * config.indvendig.loft_per_kvm * tilstandMultiplier)
        lineItems.push({
          description: `${rumType.name} — loft (${rum.antal} stk)`,
          quantity: areal * rum.antal, unit: 'm²',
          unit_price: Math.round(config.indvendig.loft_per_kvm * tilstandMultiplier),
          total: pris * rum.antal,
        })
      }

      if (rum.inkluderKarme) {
        lineItems.push({
          description: `${rumType.name} — karme`,
          quantity: 2 * rum.antal, unit: 'stk',
          unit_price: config.indvendig.karme_per_stk,
          total: 2 * rum.antal * config.indvendig.karme_per_stk,
        })
      }

      if (rum.inkluderDoere) {
        lineItems.push({
          description: `${rumType.name} — døre`,
          quantity: rum.antal, unit: 'stk',
          unit_price: config.indvendig.doer_per_stk,
          total: rum.antal * config.indvendig.doer_per_stk,
        })
      }
    }
  }

  // Udvendig maling
  if ((data.malertype === 'udvendig' || data.malertype === 'begge') && data.facadeType && data.facadeAreal) {
    const facadePris = config.udvendig.facade[data.facadeType] ?? 250
    const pris = Math.round(data.facadeAreal * facadePris * tilstandMultiplier)
    lineItems.push({
      description: `Udvendig facade — ${data.facadeType}`,
      quantity: data.facadeAreal, unit: 'm²',
      unit_price: Math.round(facadePris * tilstandMultiplier),
      total: pris,
    })
  }

  const subtotal = Math.max(lineItems.reduce((s, i) => s + i.total, 0), config.minimum_pris)
  const vatAmount = Math.round(subtotal * (config.moms_procent / 100))

  return { lineItems, subtotal, vatAmount, totalExclVat: subtotal, totalInclVat: subtotal + vatAmount }
}
