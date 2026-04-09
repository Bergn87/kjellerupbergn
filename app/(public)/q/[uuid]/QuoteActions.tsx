'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, X, Loader2 } from 'lucide-react'

interface QuoteActionsProps {
  quoteUuid: string
  primaryColor: string
}

const REJECTION_REASONS = [
  'For dyrt',
  'Valgte anden håndværker',
  'Ikke relevant længere',
  'Andet',
]

export default function QuoteActions({ quoteUuid, primaryColor }: QuoteActionsProps) {
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionComment, setRejectionComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<'accepted' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/quotes/${quoteUuid}/accept`, {
        method: 'POST',
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Der opstod en fejl')
        return
      }

      setResult('accepted')
      setAcceptDialogOpen(false)
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReject() {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/quotes/${quoteUuid}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectionReason,
          comment: rejectionComment,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Der opstod en fejl')
        return
      }

      setResult('rejected')
      setRejectDialogOpen(false)
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Vis resultat
  if (result === 'accepted') {
    return (
      <div className="rounded-lg border-2 border-green-300 bg-green-50 px-6 py-4 text-center">
        <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
        <p className="text-lg font-semibold text-green-800">Tak for din accept!</p>
        <p className="text-sm text-green-700 mt-1">Vi kontakter dig snart for at aftale det videre forløb.</p>
      </div>
    )
  }

  if (result === 'rejected') {
    return (
      <div className="rounded-lg border-2 border-gray-300 bg-gray-50 px-6 py-4 text-center">
        <p className="text-lg font-semibold text-gray-700">Din afvisning er registreret.</p>
        <p className="text-sm text-gray-500 mt-1">Tak fordi du lod os vide.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1 text-white"
          style={{ backgroundColor: '#16a34a' }}
          onClick={() => setAcceptDialogOpen(true)}
        >
          <Check className="mr-2 h-5 w-5" />
          Acceptér tilbud
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => setRejectDialogOpen(true)}
        >
          <X className="mr-2 h-5 w-5" />
          Afvis tilbud
        </Button>
      </div>

      {/* ACCEPT DIALOG */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceptér tilbud</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil acceptere dette tilbud? Du vil blive kontaktet
              for at aftale det videre forløb.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)} disabled={isSubmitting}>
              Annullér
            </Button>
            <Button
              className="text-white"
              style={{ backgroundColor: '#16a34a' }}
              onClick={handleAccept}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Behandler...
                </>
              ) : (
                'Ja, acceptér tilbud'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Afvis tilbud</DialogTitle>
            <DialogDescription>
              Fortæl os gerne hvorfor, så vi kan forbedre os.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select value={rejectionReason} onValueChange={(v) => { if (v) setRejectionReason(v) }}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg en årsag" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Evt. uddybende kommentar (valgfrit)"
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isSubmitting}>
              Annullér
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Behandler...
                </>
              ) : (
                'Afvis tilbud'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
