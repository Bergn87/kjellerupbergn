'use client'

import { useState } from 'react'
import { Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export interface ContactData {
  name: string
  email: string
  phone: string
  message: string
  gdprAccepted: boolean
}

interface ContactStepProps {
  primaryColor: string
  onSubmit: (data: ContactData) => Promise<void>
  initialData?: Partial<ContactData>
  isSubmitting?: boolean
  error?: string | null
}

export default function ContactStep({ primaryColor, onSubmit, initialData, isSubmitting, error }: ContactStepProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [message, setMessage] = useState(initialData?.message ?? '')
  const [gdpr, setGdpr] = useState(initialData?.gdprAccepted ?? false)

  const canSubmit = name.length >= 2 && email.includes('@') && phone.length >= 8 && gdpr

  async function handleSubmit() {
    if (!canSubmit) return
    await onSubmit({ name, email, phone, message, gdprAccepted: gdpr })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Modtag dit tilbud</h2>
        <p className="text-sm text-muted-foreground mt-1">Vi sender et detaljeret tilbud inden for 1 time</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Navn *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dit fulde navn" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@email.dk" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon *</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="12 34 56 78" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Besked</Label>
          <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
        </div>
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox id="gdpr" checked={gdpr} onCheckedChange={(v) => setGdpr(v === true)} />
          <Label htmlFor="gdpr" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
            Jeg accepterer at mine oplysninger behandles i henhold til{' '}
            <a href="/privatlivspolitik" className="underline" target="_blank">privatlivspolitikken</a>
          </Label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        style={{ backgroundColor: primaryColor }}
        size="lg"
        disabled={!canSubmit || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sender tilbud...</>
        ) : (
          <>Send og modtag tilbud<ChevronRight className="ml-2 h-4 w-4" /></>
        )}
      </Button>
    </div>
  )
}
