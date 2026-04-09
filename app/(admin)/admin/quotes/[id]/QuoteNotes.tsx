'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

export default function QuoteNotes({ quoteId, initialNotes }: { quoteId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  async function handleBlur() {
    if (notes === initialNotes) return
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('quotes').update({ internal_notes: notes } as never).eq('id', quoteId)
    } catch {
      // Ignorer fejl stille
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        placeholder="Tilføj interne noter..."
        rows={4}
        className="text-sm"
      />
      {saving && <p className="text-xs text-muted-foreground">Gemmer...</p>}
    </div>
  )
}
