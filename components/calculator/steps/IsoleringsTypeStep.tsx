'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface IsoleringsTypeStepProps {
  primaryColor: string
  bbrByggeaar?: number
  bbrAreal?: number
  onComplete: (data: {
    isoleringType: 'loft' | 'hulmur' | 'begge'
    boligAreal: number; byggeaar: number
    loftTykkelse?: string; murTykkelse?: string
  }) => void
}

export default function IsoleringsTypeStep({ primaryColor, bbrByggeaar, bbrAreal, onComplete }: IsoleringsTypeStepProps) {
  const [type, setType] = useState<'loft' | 'hulmur' | 'begge'>('loft')
  const [areal, setAreal] = useState(bbrAreal ?? 100)
  const [byggeaar, setByggeaar] = useState(bbrByggeaar ?? 1975)
  const [loftTykkelse, setLoftTykkelse] = useState('200mm')
  const [murTykkelse, setMurTykkelse] = useState('23cm')

  const harHulmur = byggeaar >= 1960 && byggeaar <= 1980

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Isoleringstype</h2>
        <p className="text-sm text-muted-foreground mt-1">Vælg hvad der skal isoleres</p>
      </div>

      {harHulmur && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          Dit hus er fra {byggeaar} — huse fra 1960-1980 har typisk hulmur der kan efterisoleres.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {([
          { value: 'loft' as const, label: 'Loft', desc: 'Loftisolering' },
          { value: 'hulmur' as const, label: 'Hulmur', desc: 'Hulmursisolering' },
          { value: 'begge' as const, label: 'Begge', desc: 'Loft + hulmur' },
        ]).map((opt) => (
          <button key={opt.value} type="button" onClick={() => setType(opt.value)}
            className={cn('rounded-lg border-2 p-3 text-center transition-colors', type === opt.value ? 'border-current' : 'border-gray-200 hover:border-gray-300')}
            style={type === opt.value ? { borderColor: primaryColor } : undefined}
          >
            <p className="font-medium text-sm">{opt.label}</p>
            <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Boligareal (m²)</Label>
          <Input type="number" value={areal || ''} onChange={(e) => setAreal(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Byggeår</Label>
          <Input type="number" value={byggeaar || ''} onChange={(e) => setByggeaar(Number(e.target.value))} />
        </div>
      </div>

      {(type === 'loft' || type === 'begge') && (
        <div className="space-y-2">
          <Label>Ønsket isoleringstykkelse (loft)</Label>
          <Select value={loftTykkelse} onValueChange={(v) => { if (v) setLoftTykkelse(v) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="100mm">100 mm</SelectItem>
              <SelectItem value="200mm">200 mm</SelectItem>
              <SelectItem value="300mm">300 mm (anbefalet)</SelectItem>
              <SelectItem value="400mm">400 mm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(type === 'hulmur' || type === 'begge') && (
        <div className="space-y-2">
          <Label>Murtykkelse</Label>
          <Select value={murTykkelse} onValueChange={(v) => { if (v) setMurTykkelse(v) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="23cm">23 cm (standard)</SelectItem>
              <SelectItem value="34cm">34 cm (bred)</SelectItem>
              <SelectItem value="andet">Andet/ved ikke</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button className="w-full" style={{ backgroundColor: primaryColor }} disabled={areal <= 0}
        onClick={() => onComplete({ isoleringType: type, boligAreal: areal, byggeaar, loftTykkelse: (type !== 'hulmur') ? loftTykkelse : undefined, murTykkelse: (type !== 'loft') ? murTykkelse : undefined })}
      >
        Se min pris<ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
