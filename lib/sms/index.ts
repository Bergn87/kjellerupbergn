import type { Quote, Tenant } from '@/types'
import { normalizePhone } from '@/lib/validations/quote'

/**
 * Send tilbuds-SMS via GatewayAPI.
 * Kun for Pro+ planer.
 *
 * API: POST https://gatewayapi.com/rest/mtsms
 * Auth: Token-baseret
 */
export async function sendQuoteSMS(
  quote: Quote,
  tenant: Tenant,
  settings: Record<string, string>
): Promise<void> {
  const token = process.env.GATEWAYAPI_TOKEN
  if (!token) {
    console.warn('GATEWAYAPI_TOKEN mangler — springer SMS over')
    return
  }

  // Kun Pro+ planer har SMS
  if (!['pro', 'business'].includes(tenant.plan)) {
    return
  }

  const phone = quote.customer_phone
  if (!phone) {
    console.warn('Ingen telefonnummer — springer SMS over')
    return
  }

  const normalizedPhone = normalizePhone(phone)
  const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bergn.dk'}/q/${quote.quote_uuid}`

  // Byg SMS-tekst
  const senderName = settings['sms_sender_name'] || 'Bergn'
  const template =
    settings['quote_sms_body'] ??
    'Hej {{kunde_navn}}, du har modtaget et tilbud fra {{firma_navn}}. Se det her: {{tilbud_link}}'

  const message = template
    .replace(/\{\{kunde_navn\}\}/g, quote.customer_name)
    .replace(/\{\{firma_navn\}\}/g, tenant.company_name)
    .replace(/\{\{tilbud_link\}\}/g, quoteUrl)
    .replace(/\{\{tilbud_nummer\}\}/g, quote.quote_number)

  try {
    const res = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        sender: senderName.slice(0, 11), // GatewayAPI max 11 chars
        message,
        recipients: [{ msisdn: parseInt(normalizedPhone, 10) }],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`GatewayAPI fejl (${res.status}):`, errBody)
    }
  } catch (err) {
    console.error('Fejl ved SMS-afsendelse:', err)
    // Fejl stopper IKKE quote-oprettelsen
  }
}
