'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { BBRData } from '@/types'
import type { TagrensPriceConfig } from '@/lib/calculators/types'

interface TagrensDetailsStepProps {
  primaryColor: string
  bbr: BBRData | null
  priceConfig: TagrensPriceConfig
  onComplete: (details: {
    tagType: string; boligAreal: number; tagFladeareal: number; tagHaeldning: number; bygningsHoejde: number
  }) => void
}

export default function TagrensDetailsStep({ primaryColor, bbr, priceConfig, onComplete }: TagrensDetailsStepProps) {
  const [tagType, setTagType] = useState(bbr?.tagType ?? 'Tegl')
  const [boligAreal, setBoligAreal] = useState(bbr?.boligAreal ?? 0)
  const [tagFladeareal, setTagFladeareal] = useState(bbr?.tagFladeareal ?? 0)
  const [tagHaeldning, setTagHaeldning] = useState(bbr?.tagHaeldning ?? 30)
  const [bygningsHoejde, setBygningsHoejde] = useState(bbr?.bygningsHoejde ?? 3)
  const [confirmed, setConfirmed] = useState(false)

  const activeTagTypes = Object.entries(priceConfig.tagtyper).filter(([, cfg]) => cfg.aktiv).map(([name]) => name)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Tjek dine oplysninger</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {bbr ? 'Hentet fra BBR-registret — ret hvis nødvendigt' : 'Udfyld oplysninger om dit tag'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tagtype</Label>
          <Select value={tagType} onValueChange={(v) => { if (v) setTagType(v) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {activeTagTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Boligareal (m²)</Label>
            <Input type="number" value={boligAreal || ''} onChange={(e) => setBoligAreal(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Tagfladeareal (m²)</Label>
            <Input type="number" value={tagFladeareal || ''} onChange={(e) => setTagFladeareal(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hældning (grader)</Label>
            <Input type="number" value={tagHaeldning || ''} onChange={(e) => setTagHaeldning(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Højde til tagkant (m)</Label>
            <Input type="number" step="0.1" value={bygningsHoejde || ''} onChange={(e) => setBygningsHoejde(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox id="confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} />
          <Label htmlFor="confirm" className="text-sm cursor-pointer">Oplysningerne er korrekte</Label>
        </div>
      </div>

      <Button
        className="w-full" style={{ backgroundColor: primaryColor }}
        disabled={!confirmed}
        onClick={() => onComplete({ tagType, boligAreal, tagFladeareal, tagHaeldning, bygningsHoejde })}
      >
        Fortsæt<ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
