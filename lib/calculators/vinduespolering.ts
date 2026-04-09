import type { VinduesPriceConfig, VinduesCalculatorData, VinduesType, PriceResult, PriceLineItem } from './types'

export const DEFAULT_VINDUES_PRICE_CONFIG: VinduesPriceConfig = {
  timepris: 700,
  vandtype: {
    traditionel: { multiplier: 1.0 },
    rentvandsanlaeg: { multiplier: 0.85 },
  },
  ordreType: {
    engangskob: { multiplier: 1.0 },
    abonnement: {
      '4_uger': { rabat_procent: 60 },
      '6_uger': { rabat_procent: 55 },
      '8_uger': { rabat_procent: 50 },
      '12_uger': { rabat_procent: 40 },
    },
  },
  etageGebyr: { '0': 0, '1': 0, '2': 100, '3': 200, '4+': 300 },
  servicefradrag_procent: 26,
  minimum_pris: 400,
  moms_procent: 25,
  vinduestyper: [
    { id: 'standard', name: 'Standardvindue', type: 'enkelt', indvendigTidMinutter: 4, udvendigTidMinutter: 3, isActive: true, sortOrder: 0 },
    { id: 'dobbelt', name: 'Dobbeltvindue', type: 'dobbelt', indvendigTidMinutter: 6, udvendigTidMinutter: 5, isActive: true, sortOrder: 1 },
    { id: 'terrassedoer', name: 'Terrassedør/Altandør', type: 'special', indvendigTidMinutter: 8, udvendigTidMinutter: 6, isActive: true, sortOrder: 2 },
    { id: 'ovenlys', name: 'Ovenlysvindue', type: 'special', indvendigTidMinutter: 10, udvendigTidMinutter: 8, isActive: true, sortOrder: 3 },
    { id: 'facadevindue', name: 'Stort facadevindue', type: 'special', indvendigTidMinutter: 12, udvendigTidMinutter: 10, isActive: true, sortOrder: 4 },
  ],
}

export function calculateVinduesPrice(
  data: VinduesCalculatorData,
  config: VinduesPriceConfig = DEFAULT_VINDUES_PRICE_CONFIG
): PriceResult {
  const lineItems: PriceLineItem[] = []
  let totalMinutter = 0

  // Beregn tid per vinduestype
  for (const valg of data.vinduer) {
    const type = config.vinduestyper.find((t: VinduesType) => t.id === valg.typeId)
    if (!type || valg.antal === 0) continue

    let tidPerVindue = 0
    if (data.rengoeringstype === 'indvendig') tidPerVindue = type.indvendigTidMinutter
    else if (data.rengoeringstype === 'udvendig') tidPerVindue = type.udvendigTidMinutter
    else tidPerVindue = type.indvendigTidMinutter + type.udvendigTidMinutter

    const tid = tidPerVindue * valg.antal
    totalMinutter += tid

    lineItems.push({
      description: `${type.name} (${data.rengoeringstype})`,
      quantity: valg.antal,
      unit: 'stk',
      unit_price: Math.round((tidPerVindue / 60) * config.timepris),
      total: Math.round((tid / 60) * config.timepris),
    })
  }

  // Vandtype multiplier
  const vandMultiplier = config.vandtype[data.vandtype]?.multiplier ?? 1
  if (vandMultiplier !== 1) {
    const rabat = lineItems.reduce((s, i) => s + i.total, 0) * (1 - vandMultiplier)
    if (rabat > 0) {
      lineItems.push({
        description: 'Rentvandsanlæg (hurtigere)',
        quantity: 1, unit: 'stk', unit_price: -Math.round(rabat), total: -Math.round(rabat),
      })
    }
  }

  // Etagegebyr
  const etageKey = data.etage >= 4 ? '4+' : String(data.etage)
  const etageGebyr = config.etageGebyr[etageKey] ?? 0
  if (etageGebyr > 0) {
    lineItems.push({
      description: `Etagegebyr (${data.etage}. sal)`,
      quantity: 1, unit: 'stk', unit_price: etageGebyr, total: etageGebyr,
    })
  }

  let subtotal = Math.max(
    lineItems.reduce((s, i) => s + i.total, 0),
    config.minimum_pris
  )

  // Abonnementsrabat
  if (data.ordreType === 'abonnement' && data.interval) {
    const rabatPct = config.ordreType.abonnement[data.interval]?.rabat_procent ?? 0
    if (rabatPct > 0) {
      const rabat = Math.round(subtotal * (rabatPct / 100))
      lineItems.push({
        description: `Abonnementsrabat (${rabatPct}%)`,
        quantity: 1, unit: 'stk', unit_price: -rabat, total: -rabat,
      })
      subtotal -= rabat
    }
  }

  const vatAmount = Math.round(subtotal * (config.moms_procent / 100))

  return {
    lineItems,
    subtotal,
    vatAmount,
    totalExclVat: subtotal,
    totalInclVat: subtotal + vatAmount,
  }
}
