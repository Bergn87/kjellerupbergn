'use client'

import { useState } from 'react'
import { Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AddressSearch from '@/components/calculator/AddressSearch'
import type { AddressSelection } from '@/components/calculator/AddressSearch'
import type { BBRData } from '@/types'

interface AddressStepProps {
  primaryColor: string
  onComplete: (address: AddressSelection, bbr: BBRData | null) => void
  initialAddress?: AddressSelection | null
  skipBBR?: boolean
}

export default function AddressStep({ primaryColor, onComplete, initialAddress, skipBBR }: AddressStepProps) {
  const [address, setAddress] = useState<AddressSelection | null>(initialAddress ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    if (!address) return

    if (skipBBR) {
      onComplete(address, null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bbr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adgAdrId: address.adgAdrId }),
      })
      const json = await res.json()

      if (!res.ok || !json.data) {
        // BBR fejlede — fortsæt uden
        onComplete(address, null)
        return
      }

      onComplete(address, json.data)
    } catch {
      // Netværksfejl — fortsæt uden BBR
      onComplete(address, null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Find din adresse</h2>
        <p className="text-sm text-muted-foreground mt-1">Vi henter automatisk oplysninger om din bolig</p>
      </div>

      <AddressSearch
        onSelect={setAddress}
        initialValue={initialAddress?.displayText}
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Henter oplysninger fra BBR...
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        style={{ backgroundColor: primaryColor }}
        disabled={!address || loading}
        onClick={handleContinue}
      >
        {loading ? 'Henter data...' : 'Fortsæt'}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
