import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { buildQuoteHTML } from './quoteTemplate'
import { createAdminClient } from '@/lib/supabase/server'
import type { Quote, Tenant } from '@/types'

// Chromium binary URL for Vercel serverless
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'

/**
 * Generér PDF fra quote og tenant.
 * Bruger Puppeteer + Chromium til serverless PDF-generering.
 *
 * @returns Buffer med PDF-indhold
 */
export async function generateQuotePDF(
  quote: Quote,
  tenant: Tenant,
  termsAndConditions?: string
): Promise<Buffer> {
  const html = buildQuoteHTML(quote, tenant, termsAndConditions)

  let browser = null

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1123 },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Generér PDF og upload til Supabase Storage.
 * Returnerer signeret URL (1 times gyldighed).
 */
export async function generateAndUploadQuotePDF(
  quote: Quote,
  tenant: Tenant,
  termsAndConditions?: string
): Promise<string | null> {
  try {
    const pdfBuffer = await generateQuotePDF(quote, tenant, termsAndConditions)
    const supabase = await createAdminClient()

    const filePath = `${tenant.id}/${quote.quote_uuid}.pdf`

    // Upload til Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('quotes')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('PDF upload fejl:', uploadError)
      return null
    }

    // Hent signeret URL (1 time)
    const { data: signedUrl } = await supabase.storage
      .from('quotes')
      .createSignedUrl(filePath, 3600)

    const pdfUrl = signedUrl?.signedUrl ?? null

    // Gem pdf_url i quote
    if (pdfUrl) {
      await supabase
        .from('quotes')
        .update({ pdf_url: pdfUrl } as never)
        .eq('id', quote.id)
    }

    return pdfUrl
  } catch (err) {
    console.error('PDF generering fejl:', err)
    return null
  }
}
