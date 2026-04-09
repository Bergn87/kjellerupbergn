import { describe, it, expect } from 'vitest'
import { calculateTagrensPrice } from './tagrens'
import { calculateVinduesPrice, DEFAULT_VINDUES_PRICE_CONFIG } from './vinduespolering'
import { calculateMalerPrice, DEFAULT_MALER_PRICE_CONFIG } from './maler'
import { calculateFliserensPrice, DEFAULT_FLISERENS_PRICE_CONFIG } from './fliserens'
import { calculateIsoleringsPrice, DEFAULT_ISOLERINGS_PRICE_CONFIG } from './isolering'
import { getCalculatorConfig } from './registry'

// ============================================
// TAGRENS
// ============================================

describe('calculateTagrensPrice', () => {
  it('beregner korrekt for standard hus', () => {
    const result = calculateTagrensPrice(
      { tagType: 'Tegl', boligAreal: 120, tagFladeareal: 170, tagHaeldning: 30, bygningsHoejde: 3 },
      { oenskerMaling: false, antalOvenlysvinduer: 0, antalTagkviste: 0, harTagrender: true, harSkjulteTagrender: false, harSolceller: false },
    )
    expect(result.subtotal).toBe(25500)
    expect(result.totalInclVat).toBe(31875)
  })

  it('tilføjer hældningstillæg over 30°', () => {
    const result = calculateTagrensPrice(
      { tagType: 'Tegl', boligAreal: 120, tagFladeareal: 170, tagHaeldning: 45, bygningsHoejde: 3 },
      { oenskerMaling: false, antalOvenlysvinduer: 0, antalTagkviste: 0, harTagrender: true, harSkjulteTagrender: false, harSolceller: false },
    )
    expect(result.subtotal).toBe(39100) // 25500 + 13600
  })
})

// ============================================
// VINDUESPOLERING
// ============================================

describe('calculateVinduesPrice', () => {
  it('beregner pris for 10 standardvinduer', () => {
    const result = calculateVinduesPrice({
      vinduer: [{ typeId: 'standard', antal: 10 }],
      rengoeringstype: 'begge',
      vandtype: 'traditionel',
      ordreType: 'engangskob',
      kundeType: 'privat',
      etage: 0,
    })
    expect(result.subtotal).toBeGreaterThan(0)
    expect(result.lineItems.length).toBeGreaterThan(0)
  })

  it('giver abonnementsrabat', () => {
    const engangResult = calculateVinduesPrice({
      vinduer: [{ typeId: 'standard', antal: 10 }],
      rengoeringstype: 'begge', vandtype: 'traditionel',
      ordreType: 'engangskob', kundeType: 'privat', etage: 0,
    })
    const aboResult = calculateVinduesPrice({
      vinduer: [{ typeId: 'standard', antal: 10 }],
      rengoeringstype: 'begge', vandtype: 'traditionel',
      ordreType: 'abonnement', interval: '8_uger', kundeType: 'privat', etage: 0,
    })
    expect(aboResult.subtotal).toBeLessThan(engangResult.subtotal)
  })
})

// ============================================
// MALER
// ============================================

describe('calculateMalerPrice', () => {
  it('beregner indvendig maling for stue', () => {
    const result = calculateMalerPrice({
      malertype: 'indvendig',
      tilstand: 'god',
      rum: [{ typeId: 'stue', antal: 1, inkluderVaegge: true, inkluderLoft: true, inkluderKarme: false, inkluderDoere: false }],
    })
    expect(result.subtotal).toBeGreaterThan(0)
    expect(result.lineItems.length).toBeGreaterThanOrEqual(2) // vægge + loft
  })

  it('beregner udvendig maling', () => {
    const result = calculateMalerPrice({
      malertype: 'udvendig',
      facadeType: 'mur',
      facadeAreal: 100,
      tilstand: 'middel',
      rum: [],
    })
    expect(result.subtotal).toBeGreaterThan(0)
  })

  it('tilstand-multiplier øger prisen', () => {
    const god = calculateMalerPrice({ malertype: 'udvendig', facadeType: 'mur', facadeAreal: 100, tilstand: 'god', rum: [] })
    const daarlig = calculateMalerPrice({ malertype: 'udvendig', facadeType: 'mur', facadeAreal: 100, tilstand: 'daarlig', rum: [] })
    expect(daarlig.subtotal).toBeGreaterThan(god.subtotal)
  })
})

// ============================================
// FLISERENS
// ============================================

describe('calculateFliserensPrice', () => {
  it('beregner standard fliserens', () => {
    const result = calculateFliserensPrice({
      omraade: 'terrasse', areal: 30,
      inkluderImpraegnering: false, erMegetBeskidt: false,
      harTrapper: false, antalTrapper: 0,
    })
    expect(result.subtotal).toBe(1500) // 30 × 50 = 1500 = minimum
  })

  it('tilføjer imprægnering', () => {
    const uden = calculateFliserensPrice({ omraade: 'terrasse', areal: 50, inkluderImpraegnering: false, erMegetBeskidt: false, harTrapper: false, antalTrapper: 0 })
    const med = calculateFliserensPrice({ omraade: 'terrasse', areal: 50, inkluderImpraegnering: true, erMegetBeskidt: false, harTrapper: false, antalTrapper: 0 })
    expect(med.subtotal).toBeGreaterThan(uden.subtotal)
  })
})

// ============================================
// ISOLERING
// ============================================

describe('calculateIsoleringsPrice', () => {
  it('beregner loftisolering', () => {
    const result = calculateIsoleringsPrice({
      isoleringType: 'loft', boligAreal: 120, byggeaar: 1975,
      loftTykkelse: '200mm',
    })
    expect(result.subtotal).toBe(120 * 180) // 150 + 30 = 180/m²
  })

  it('beregner hulmursisolering', () => {
    const result = calculateIsoleringsPrice({
      isoleringType: 'hulmur', boligAreal: 120, byggeaar: 1975,
      murTykkelse: '23cm',
    })
    expect(result.subtotal).toBeGreaterThan(0)
  })

  it('begge typer er dyrere end én', () => {
    const loft = calculateIsoleringsPrice({ isoleringType: 'loft', boligAreal: 120, byggeaar: 1975, loftTykkelse: '200mm' })
    const begge = calculateIsoleringsPrice({ isoleringType: 'begge', boligAreal: 120, byggeaar: 1975, loftTykkelse: '200mm', murTykkelse: '23cm' })
    expect(begge.subtotal).toBeGreaterThan(loft.subtotal)
  })
})

// ============================================
// REGISTRY
// ============================================

describe('Calculator Registry', () => {
  it('returnerer config for alle typer', () => {
    const types = ['tagrens', 'vinduespolering', 'maler', 'fliserens', 'isolering', 'generisk'] as const
    for (const type of types) {
      const config = getCalculatorConfig(type)
      expect(config.type).toBe(type)
      expect(config.steps.length).toBeGreaterThan(0)
      expect(config.label).toBeTruthy()
    }
  })

  it('generisk har ingen prisberegning', () => {
    const config = getCalculatorConfig('generisk')
    const result = config.calculatePrice({}, {})
    expect(result.subtotal).toBe(0)
  })
})
