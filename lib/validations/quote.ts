import { z } from 'zod/v4'

/**
 * Validering af dansk telefonnummer.
 * Accepterer: 12345678, +4512345678, 004512345678, 45 12 34 56 78
 */
const danishPhoneRegex = /^(\+45|0045|45)?[\s-]?[0-9\s-]{8,}$/

export const CreateQuoteSchema = z.object({
  tenantId: z.string().uuid(),
  calculatorId: z.string().uuid(),
  name: z.string().min(2, 'Navn skal være mindst 2 tegn').max(100),
  email: z.string().email('Ugyldig email'),
  phone: z.string().regex(danishPhoneRegex, 'Ugyldigt telefonnummer'),
  address: z.string().min(5, 'Adresse er påkrævet'),
  message: z.string().max(1000).optional(),
  bbrData: z.unknown(),
  houseDetails: z.record(z.string(), z.unknown()),
  extraDetails: z.record(z.string(), z.unknown()),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unit: z.string(),
      unit_price: z.number(),
      total: z.number(),
    })
  ),
  totalExclVat: z.number().positive(),
  totalInclVat: z.number().positive(),
  gdprAccepted: z.literal(true, {
    error: 'Du skal acceptere privatlivspolitikken',
  }),
})

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>

/**
 * Normalisér dansk telefonnummer til format: 4512345678
 */
export function normalizePhone(phone: string): string {
  // Fjern alt der ikke er cifre
  const digits = phone.replace(/\D/g, '')

  // Hvis det starter med 0045, fjern prefix
  if (digits.startsWith('0045')) {
    return digits.slice(4).length === 8 ? '45' + digits.slice(4) : digits
  }

  // Hvis det starter med 45 og er 10 cifre
  if (digits.startsWith('45') && digits.length === 10) {
    return digits
  }

  // Hvis det er 8 cifre, tilføj 45
  if (digits.length === 8) {
    return '45' + digits
  }

  return digits
}
