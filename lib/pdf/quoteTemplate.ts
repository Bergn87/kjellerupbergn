import type { Quote, Tenant, QuoteLineItem } from '@/types'

/**
 * Formatér tal som dansk valuta: 25.500 kr.
 */
function formatKr(n: number | null): string {
  if (n == null) return '0 kr.'
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

/**
 * Formatér dato som dansk: 8. april 2026
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Byg komplet HTML til PDF-generering.
 * Alt CSS er inline — ingen eksterne filer.
 */
export function buildQuoteHTML(
  quote: Quote,
  tenant: Tenant,
  termsAndConditions?: string
): string {
  const primary = tenant.primary_color || '#1B4332'
  const lineItems = (quote.line_items ?? []) as QuoteLineItem[]

  const logoHtml = tenant.company_logo_url
    ? `<img src="${tenant.company_logo_url}" alt="${tenant.company_name}" style="max-height: 60px; max-width: 200px;" />`
    : `<span style="font-size: 24px; font-weight: bold; color: white;">${tenant.company_name}</span>`

  // Ejendomsdata (kun hvis fra beregner)
  const houseDetails = quote.house_details as Record<string, unknown> | null
  let propertyHtml = ''
  if (houseDetails && quote.source === 'calculator') {
    propertyHtml = `
      <div style="margin: 24px 0; background: #f8f9fa; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Ejendomsdata</h3>
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td style="padding: 4px 16px 4px 0; color: #666;">Tagtype</td>
            <td style="font-weight: 600;">${houseDetails.tagType ?? '-'}</td>
            <td style="padding: 4px 16px 4px 0; color: #666;">Areal</td>
            <td style="font-weight: 600;">${houseDetails.tagFladeareal ?? '-'} m²</td>
          </tr>
          <tr>
            <td style="padding: 4px 16px 4px 0; color: #666;">Hældning</td>
            <td style="font-weight: 600;">${houseDetails.tagHaeldning ?? '-'}°</td>
            <td style="padding: 4px 16px 4px 0; color: #666;">Højde</td>
            <td style="font-weight: 600;">${houseDetails.bygningsHoejde ?? '-'} m</td>
          </tr>
        </table>
      </div>
    `
  }

  // Linjer
  const lineItemRows = lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #eee;">
          ${item.description}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: center; color: #666; font-size: 13px;">
          ${item.quantity} ${item.unit} × ${formatKr(item.unit_price)}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
          ${formatKr(item.total)}
        </td>
      </tr>
    `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; font-size: 14px; line-height: 1.5; }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  <div style="width: 794px; min-height: 1123px; margin: 0 auto; position: relative;">

    <!-- HEADER -->
    <div style="background: ${primary}; color: white; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center;">
      <div>${logoHtml}</div>
      <div style="text-align: right; font-size: 12px; line-height: 1.6;">
        <div style="font-weight: 600; font-size: 14px;">${tenant.company_name}</div>
        ${tenant.company_address ? `<div>${tenant.company_address}</div>` : ''}
        ${tenant.company_cvr ? `<div>CVR: ${tenant.company_cvr}</div>` : ''}
        ${tenant.company_phone ? `<div>Tlf: ${tenant.company_phone}</div>` : ''}
        <div>${tenant.company_email}</div>
      </div>
    </div>

    <div style="padding: 40px;">

      <!-- TILBUDSHOVED -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 32px; font-weight: 700; color: ${primary}; margin-bottom: 8px;">TILBUD</h1>
        <table style="font-size: 13px; color: #666;">
          <tr><td style="padding-right: 16px;">Nr:</td><td style="font-weight: 600; color: #333;">${quote.quote_number}</td></tr>
          <tr><td style="padding-right: 16px;">Dato:</td><td>${formatDate(quote.created_at)}</td></tr>
          ${quote.expires_at ? `<tr><td style="padding-right: 16px;">Udløber:</td><td>${formatDate(quote.expires_at)}</td></tr>` : ''}
        </table>
      </div>

      <!-- TO KOLONNER: TIL / FRA -->
      <div style="display: flex; gap: 32px; margin-bottom: 32px;">
        <div style="flex: 1; background: #f8f9fa; border-radius: 8px; padding: 16px;">
          <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 8px;">Til</h3>
          <div style="font-weight: 600;">${quote.customer_name}</div>
          ${quote.customer_address ? `<div style="font-size: 13px; color: #666;">${quote.customer_address}</div>` : ''}
          <div style="font-size: 13px; color: #666;">${quote.customer_email}</div>
          ${quote.customer_phone ? `<div style="font-size: 13px; color: #666;">Tlf: ${quote.customer_phone}</div>` : ''}
        </div>
        <div style="flex: 1; background: #f8f9fa; border-radius: 8px; padding: 16px;">
          <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 8px;">Fra</h3>
          <div style="font-weight: 600;">${tenant.company_name}</div>
          ${tenant.company_address ? `<div style="font-size: 13px; color: #666;">${tenant.company_address}</div>` : ''}
          <div style="font-size: 13px; color: #666;">${tenant.company_email}</div>
          ${tenant.company_phone ? `<div style="font-size: 13px; color: #666;">Tlf: ${tenant.company_phone}</div>` : ''}
        </div>
      </div>

      <!-- EJENDOMSDATA -->
      ${propertyHtml}

      <!-- PRISSPECIFIKATION -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: ${primary}; color: white;">
            <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 13px;">Ydelse</th>
            <th style="padding: 10px 8px; text-align: center; font-weight: 600; font-size: 13px;">Beregning</th>
            <th style="padding: 10px 8px; text-align: right; font-weight: 600; font-size: 13px;">Beløb</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemRows}
        </tbody>
      </table>

      <!-- TOTALER -->
      <div style="display: flex; justify-content: flex-end;">
        <table style="min-width: 280px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #666;">Subtotal ekskl. moms:</td>
            <td style="padding: 6px 0; text-align: right;">${formatKr(quote.total_excl_vat)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #666;">Moms (25%):</td>
            <td style="padding: 6px 0; text-align: right;">${formatKr(quote.vat_amount)}</td>
          </tr>
          <tr style="border-top: 2px solid ${primary};">
            <td style="padding: 12px 16px 6px 0; font-size: 16px; font-weight: 700;">Total inkl. moms:</td>
            <td style="padding: 12px 0 6px; text-align: right; font-size: 16px; font-weight: 700; color: ${primary};">${formatKr(quote.total_incl_vat)}</td>
          </tr>
        </table>
      </div>

      <!-- HANDELSBETINGELSER -->
      ${
        termsAndConditions
          ? `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 8px;">Handelsbetingelser</h3>
          <p style="font-size: 11px; color: #999; line-height: 1.6;">${termsAndConditions}</p>
        </div>
      `
          : ''
      }

      <!-- FOOTER -->
      <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center;">
        ${quote.expires_at ? `<p>Tilbuddet er gyldigt til ${formatDate(quote.expires_at)}</p>` : ''}
        <p>${tenant.company_name} · ${tenant.company_email}${tenant.company_phone ? ` · Tlf: ${tenant.company_phone}` : ''}${tenant.company_cvr ? ` · CVR: ${tenant.company_cvr}` : ''}</p>
      </div>

    </div>
  </div>
</body>
</html>`
}
