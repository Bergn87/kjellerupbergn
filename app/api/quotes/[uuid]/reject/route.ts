import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createAdminClient } from '@/lib/supabase/server'
import type { Quote } from '@/types'

const rejectSchema = z.object({
  reason: z.string().optional(),
  comment: z.string().max(1000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params

  // Parse body
  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // Tom body er ok
  }

  const result = rejectSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Ugyldig data' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Hent quote
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_uuid', uuid)
    .single<Quote>()

  if (!quote) {
    return NextResponse.json({ error: 'Tilbud ikke fundet' }, { status: 404 })
  }

  if (quote.status !== 'pending') {
    return NextResponse.json(
      { error: 'Tilbuddet kan ikke afvises (status: ' + quote.status + ')' },
      { status: 400 }
    )
  }

  // Byg rejection reason
  const rejectionParts: string[] = []
  if (result.data.reason) rejectionParts.push(result.data.reason)
  if (result.data.comment) rejectionParts.push(result.data.comment)
  const rejectionReason = rejectionParts.join(' — ') || null

  // Opdatér status
  await supabase
    .from('quotes')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    } as never)
    .eq('id', quote.id)

  return NextResponse.json({ success: true })
}
