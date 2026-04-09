import { Resend } from 'resend'
import type { Quote, Tenant } from '@/types'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? '')
  }
  return _resend
}

interface TemplateVars {
  kunde_navn: string
  firma_navn: string
  firma_telefon: string
  firma_email: string
  tilbud_nummer: string
  tilbud_link: string
  tilbud_udloeber: string
  dage_siden_tilbud: string
}

/**
 * Erstat {{variabel}} placeholders i en template-streng.
 */
function processTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return (vars as unknown as Record<string, string>)[key] ?? `{{${key}}}`
  })
}

/**
 * Byg standard template-variable fra quote og tenant.
 */
function buildTemplateVars(quote: Quote, tenant: Tenant): TemplateVars {
  const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bergn.dk'}/q/${quote.quote_uuid}`

  return {
    kunde_navn: quote.customer_name,
    firma_navn: tenant.company_name,
    firma_telefon: tenant.company_phone ?? '',
    firma_email: tenant.company_email,
    tilbud_nummer: quote.quote_number,
    tilbud_link: quoteUrl,
    tilbud_udloeber: quote.expires_at
      ? new Date(quote.expires_at).toLocaleDateString('da-DK')
      : '',
    dage_siden_tilbud: String(
      Math.floor(
        (Date.now() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    ),
  }
}

/**
 * Send tilbuds-email til kunden via Resend.
 */
export async function sendQuoteMail(
  quote: Quote,
  tenant: Tenant,
  settings: Record<string, string>,
  pdfBuffer?: Buffer
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY mangler — springer mail over')
    return
  }

  const vars = buildTemplateVars(quote, tenant)
  const subject = processTemplate(
    settings['quote_mail_subject'] ?? 'Dit tilbud fra {{firma_navn}}',
    vars
  )
  const htmlBody = processTemplate(
    settings['quote_mail_body'] ?? 'Hej {{kunde_navn}},\n\nSe dit tilbud her: {{tilbud_link}}',
    vars
  ).replace(/\n/g, '<br/>')

  const fromDomain = process.env.RESEND_FROM_DOMAIN ?? 'bergn.dk'

  try {
    await getResend().emails.send({
      from: `${tenant.company_name} <noreply@${fromDomain}>`,
      replyTo: tenant.company_email,
      to: quote.customer_email,
      subject,
      html: htmlBody,
      attachments: pdfBuffer
        ? [{ filename: 'tilbud.pdf', content: pdfBuffer }]
        : undefined,
    })
  } catch (err) {
    console.error('Fejl ved afsendelse af mail:', err)
    throw err
  }
}

/**
 * Send admin-notifikation når et nyt lead modtages.
 */
export async function sendAdminNotification(
  quote: Quote,
  tenant: Tenant,
  settings: Record<string, string>
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const adminEmail = settings['admin_notification_email'] || tenant.company_email
  if (!adminEmail) return

  const fromDomain = process.env.RESEND_FROM_DOMAIN ?? 'bergn.dk'

  try {
    await getResend().emails.send({
      from: `Bergn.dk <noreply@${fromDomain}>`,
      to: adminEmail,
      subject: `Nyt lead: ${quote.customer_name} — ${quote.quote_number}`,
      html: `
        <h2>Nyt lead modtaget</h2>
        <p><strong>Kunde:</strong> ${quote.customer_name}</p>
        <p><strong>Email:</strong> ${quote.customer_email}</p>
        <p><strong>Telefon:</strong> ${quote.customer_phone ?? 'Ikke oplyst'}</p>
        <p><strong>Adresse:</strong> ${quote.customer_address ?? 'Ikke oplyst'}</p>
        <p><strong>Tilbudsnummer:</strong> ${quote.quote_number}</p>
        <p><strong>Beløb:</strong> ${quote.total_incl_vat ? Math.round(quote.total_incl_vat).toLocaleString('da-DK') + ' kr. inkl. moms' : 'Ikke beregnet'}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/quotes/${quote.id}">Se tilbud i admin</a></p>
      `,
    })
  } catch (err) {
    console.error('Fejl ved admin-notifikation:', err)
    // Fejl stopper IKKE quote-oprettelsen
  }
}
