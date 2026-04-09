'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const FACADE_TYPER = [
  { value: 'mur', label: 'Mursten' },
  { value: 'trae', label: 'Træ' },
  { value: 'puds', label: 'Puds' },
  { value: 'fiberplade', label: 'Fibercement/Eternit' },
]

const TILSTANDE = [
  { value: 'god', label: 'God', desc: 'Små slid-mærker, let vedligehold' },
  { value: 'middel', label: 'Middel', desc: 'Synligt slidt, afskalning' },
  { value: 'daarlig', label: 'Dårlig', desc: 'Kraftig afskalning, fugt' },
]

interface MalerTypeStepProps {
  primaryColor: string
  bbrFacade?: string
  bbrAreal?: number
  onComplete: (data: {
    malertype: 'indvendig' | 'udvendig' | 'begge'
    facadeType?: string; facadeAreal?: number
    tilstand: 'god' | 'middel' | 'daarlig'
  }) => void
}

export default function MalerTypeStep({ primaryColor, bbrFacade, bbrAreal, onComplete }: MalerTypeStepProps) {
  const [malertype, setMalertype] = useState<'indvendig' | 'udvendig' | 'begge'>('indvendig')
  const [facadeType, setFacadeType] = useState(bbrFacade ?? 'mur')
  const [facadeAreal, setFacadeAreal] = useState(bbrAreal ?? 0)
  const [tilstand, setTilstand] = useState<'god' | 'middel' | 'daarlig'>('middel')

  const options = [
    { value: 'indvendig' as const, label: 'Indvendig', desc: 'Vægge, lofter, karme og døre' },
    { value: 'udvendig' as const, label: 'Udvendig', desc: 'Facade, vindskeder, udhæng' },
    { value: 'begge' as const, label: 'Begge dele', desc: 'Komplet ind- og udvendig' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Hvad skal males?</h2>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <button key={opt.value} type="button"
            className={cn('w-full text-left rounded-lg border-2 p-4 transition-colors', malertype === opt.value ? 'border-current' : 'border-gray-200 hover:border-gray-300')}
            style={malertype === opt.value ? { borderColor: primaryColor, color: primaryColor } : undefined}
            onClick={() => setMalertype(opt.value)}
          >
            <p className="font-medium text-sm" style={malertype === opt.value ? { color: primaryColor } : { color: '#1a1a1a' }}>{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>

      {(malertype === 'udvendig' || malertype === 'begge') && (
        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-medium">Facadeoplysninger</p>
          <div className="space-y-2">
            <Label>Facadetype</Label>
            <Select value={facadeType} onValueChange={(v) => { if (v) setFacadeType(v) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FACADE_TYPER.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Facadeareal (m²)</Label>
            <Input type="number" min={1} value={facadeAreal || ''} onChange={(e) => setFacadeAreal(Number(e.target.value))} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Nuværende tilstand</Label>
        <div className="grid grid-cols-3 gap-2">
          {TILSTANDE.map((t) => (
            <button key={t.value} type="button"
              className={cn('rounded-lg border-2 p-3 text-center transition-colors', tilstand === t.value ? 'border-current' : 'border-gray-200 hover:border-gray-300')}
              style={tilstand === t.value ? { borderColor: primaryColor } : undefined}
              onClick={() => setTilstand(t.value as typeof tilstand)}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full" style={{ backgroundColor: primaryColor }}
        onClick={() => onComplete({ malertype, facadeType: (malertype !== 'indvendig') ? facadeType : undefined, facadeAreal: (malertype !== 'indvendig') ? facadeAreal : undefined, tilstand })}
      >
        Fortsæt<ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
