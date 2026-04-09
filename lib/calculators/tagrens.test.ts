import { describe, it, expect } from 'vitest'
import { calculateTagrensPrice, DEFAULT_TAGRENS_PRICE_CONFIG } from './tagrens'
import type { TagrensHouseDetails, TagrensExtraDetails } from './types'

// ============================================
// HJÆLPERE
// ============================================

const baseHouse: TagrensHouseDetails = {
  tagType: 'Tegl',
  boligAreal: 120,
  tagFladeareal: 170,
  tagHaeldning: 30,
  bygningsHoejde: 3.0,
}

const baseExtra: TagrensExtraDetails = {
  oenskerMaling: false,
  antalOvenlysvinduer: 0,
  antalTagkviste: 0,
  harTagrender: true,
  harSkjulteTagrender: false,
  harSolceller: false,
}

// ============================================
// TESTS
// ============================================

describe('calculateTagrensPrice', () => {
  it('beregner korrekt pris for standard hus (120m², 30°, 3m)', () => {
    const result = calculateTagrensPrice(baseHouse, baseExtra)

    // Grundpris: 170 m² × 150 kr = 25.500 kr
    expect(result.lineItems).toHaveLength(1)
    expect(result.lineItems[0].total).toBe(25500)
    expect(result.subtotal).toBe(25500)
    expect(result.vatAmount).toBe(6375) // 25% moms
    expect(result.totalExclVat).toBe(25500)
    expect(result.totalInclVat).toBe(31875)
  })

  it('tilføjer tillæg for stejlt tag (hældning > 30°)', () => {
    const house: TagrensHouseDetails = {
      ...baseHouse,
      tagHaeldning: 45,
    }

    const result = calculateTagrensPrice(house, baseExtra)

    // Grundpris: 170 × 150 = 25.500
    // Hældningstillæg: 170 × 80 = 13.600
    expect(result.lineItems).toHaveLength(2)
    expect(result.lineItems[1].description).toContain('stejlt tag')
    expect(result.lineItems[1].total).toBe(13600)
    expect(result.subtotal).toBe(39100)
  })

  it('tilføjer tillæg for højt hus (≥ 3.5m)', () => {
    const house: TagrensHouseDetails = {
      ...baseHouse,
      bygningsHoejde: 3.5,
    }

    const result = calculateTagrensPrice(house, baseExtra)

    // Grundpris: 25.500
    // Højdetillæg: 6.000
    expect(result.lineItems).toHaveLength(2)
    expect(result.lineItems[1].description).toContain('bygningshøjde')
    expect(result.lineItems[1].total).toBe(6000)
    expect(result.subtotal).toBe(31500)
  })

  it('beregner korrekt med alle tillæg aktive', () => {
    const house: TagrensHouseDetails = {
      ...baseHouse,
      tagHaeldning: 45,
      bygningsHoejde: 4.0,
    }

    const extra: TagrensExtraDetails = {
      oenskerMaling: false,
      antalOvenlysvinduer: 3,
      antalTagkviste: 2,
      harTagrender: false,
      harSkjulteTagrender: true,
      harSolceller: true,
    }

    const result = calculateTagrensPrice(house, extra)

    // Grundpris:         170 × 150  = 25.500
    // Hældning:          170 × 80   = 13.600
    // Højde:                          6.000
    // Ingen tagrender:                5.000
    // Skjulte tagrender:              2.500
    // Ovenlysvinduer:    3 × 500    = 1.500
    // Tagkviste:         2 × 1.200  = 2.400
    // Solceller:                      3.000
    // Total:                         59.500

    expect(result.lineItems).toHaveLength(8)
    expect(result.subtotal).toBe(59500)
    expect(result.vatAmount).toBe(14875) // 25%
    expect(result.totalInclVat).toBe(74375)
  })

  it('kaster fejl ved inaktiv tagtype', () => {
    const config = {
      ...DEFAULT_TAGRENS_PRICE_CONFIG,
      tagtyper: {
        ...DEFAULT_TAGRENS_PRICE_CONFIG.tagtyper,
        'Tegl': { pris_per_kvm: 150, aktiv: false },
      },
    }

    expect(() =>
      calculateTagrensPrice(baseHouse, baseExtra, config)
    ).toThrow('ikke aktiv')
  })

  it('kaster fejl ved ukendt tagtype', () => {
    const house: TagrensHouseDetails = {
      ...baseHouse,
      tagType: 'Ukendt materiale',
    }

    expect(() =>
      calculateTagrensPrice(house, baseExtra)
    ).toThrow('Ukendt tagtype')
  })

  it('beregner korrekt for Eternit-tag', () => {
    const house: TagrensHouseDetails = {
      ...baseHouse,
      tagType: 'Eternit',
    }

    const result = calculateTagrensPrice(house, baseExtra)

    // 170 × 140 = 23.800
    expect(result.lineItems[0].total).toBe(23800)
    expect(result.subtotal).toBe(23800)
  })

  it('afrunder alle beløb til hele kroner', () => {
    const house: TagrensHouseDetails = {
      ...baseHouse,
      tagFladeareal: 133, // Kan give decimaler
    }

    const result = calculateTagrensPrice(house, baseExtra)

    // Alle beløb skal være hele tal
    result.lineItems.forEach((item) => {
      expect(Number.isInteger(item.total)).toBe(true)
    })
    expect(Number.isInteger(result.subtotal)).toBe(true)
    expect(Number.isInteger(result.vatAmount)).toBe(true)
    expect(Number.isInteger(result.totalInclVat)).toBe(true)
  })

  it('håndterer nul ovenlysvinduer og tagkviste uden at tilføje linjer', () => {
    const result = calculateTagrensPrice(baseHouse, baseExtra)

    const hasOvenlysvinduer = result.lineItems.some((i) =>
      i.description.includes('Ovenlysvinduer')
    )
    const hasTagkviste = result.lineItems.some((i) =>
      i.description.includes('Tagkviste')
    )

    expect(hasOvenlysvinduer).toBe(false)
    expect(hasTagkviste).toBe(false)
  })
})
