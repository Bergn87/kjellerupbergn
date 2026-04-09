'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const OMRAADER = [
  { value: 'indkoersel', label: 'Indkørsel' },
  { value: 'terrasse', label: 'Terrasse' },
  { value: 'fliser', label: 'Fliser/Stier' },
  { value: 'belaegningssten', label: 'Belægningssten' },
  { value: 'traedaek', label: 'Trædæk' },
  { value: 'andet', label: 'Andet' },
]

interface FliserensArealStepProps {
  primaryColor: string
  estimatedOutdoorArea?: number
  onComplete: (data: {
    omraade: string; areal: number; inkluderImpraegnering: boolean
    erMegetBeskidt: boolean; harTrapper: boolean; antalTrapper: number
  }) => void
}

export default function FliserensArealStep({ primaryColor, estimatedOutdoorArea, onComplete }: FliserensArealStepProps) {
  const [omraade, setOmraade] = useState('terrasse')
  const [areal, setAreal] = useState(estimatedOutdoorArea ?? 30)
  const [impraegnering, setImpraegnering] = useState(false)
  const [beskidt, setBeskidt] = useState(false)
  const [trapper, setTrapper] = useState(false)
  const [antalTrapper, setAntalTrapper] = useState(0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Hvad skal renses?</h2>
        <p className="text-sm text-muted-foreground mt-1">Fortæl os om arealet</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Type område</Label>
          <Select value={omraade} onValueChange={(v) => { if (v) setOmraade(v) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OMRAADER.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Areal (m²)</Label>
          <Input type="number" min={1} value={areal || ''} onChange={(e) => setAreal(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">Tip: En standard terrasse er ca. 25 m². En parkerings-plads er ca. 15 m².</p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="imp" checked={impraegnering} onCheckedChange={(v) => setImpraegnering(v === true)} />
            <Label htmlFor="imp" className="text-sm cursor-pointer">Inkluder imprægnering</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="beskidt" checked={beskidt} onCheckedChange={(v) => setBeskidt(v === true)} />
            <Label htmlFor="beskidt" className="text-sm cursor-pointer">Meget beskidt (lang tid siden sidst)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="trapper" checked={trapper} onCheckedChange={(v) => setTrapper(v === true)} />
            <Label htmlFor="trapper" className="text-sm cursor-pointer">Har trapper</Label>
          </div>
          {trapper && (
            <div className="ml-6 space-y-1">
              <Label>Antal trapper</Label>
              <Input type="number" min={1} value={antalTrapper || ''} onChange={(e) => setAntalTrapper(Number(e.target.value))} className="max-w-[100px]" />
            </div>
          )}
        </div>
      </div>

      <Button className="w-full" style={{ backgroundColor: primaryColor }} disabled={areal <= 0}
        onClick={() => onComplete({ omraade, areal, inkluderImpraegnering: impraegnering, erMegetBeskidt: beskidt, harTrapper: trapper, antalTrapper: trapper ? antalTrapper : 0 })}
      >
        Se min pris<ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
