'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Calculator, Paintbrush, Droplets, Sparkles, Home, Settings, Loader2 } from 'lucide-react'

interface CalcItem {
  id: string
  name: string
  type: string
  slug: string
  is_active: boolean
  quote_count?: number
}

const CALC_TYPES = [
  { type: 'tagrens', label: 'Tagrens & Tagmaling', icon: Home },
  { type: 'maler', label: 'Malerarbejde', icon: Paintbrush },
  { type: 'fliserens', label: 'Fliserens', icon: Droplets },
  { type: 'vinduespolering', label: 'Vinduespolering', icon: Sparkles },
  { type: 'isolering', label: 'Isolering', icon: Home },
  { type: 'generisk', label: 'Generisk', icon: Settings },
]

const TYPE_ICON_MAP: Record<string, typeof Calculator> = Object.fromEntries(
  CALC_TYPES.map((t) => [t.type, t.icon])
)

export default function CalculatorsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [calculators, setCalculators] = useState<CalcItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // Hent beregnere
  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Hent tenant_id
      const { data: tu } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.user.id)
        .limit(1)
        .single()

      if (!tu) return
      const tenantId = (tu as { tenant_id: string }).tenant_id

      const { data } = await supabase
        .from('calculators')
        .select('id, name, type, slug, is_active')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true })

      setCalculators((data as CalcItem[] | null) ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  // Toggle aktiv
  async function handleToggle(id: string, active: boolean) {
    setCalculators((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: active } : c)))
    await supabase.from('calculators').update({ is_active: active } as never).eq('id', id)
  }

  // Opret beregner
  async function handleCreate() {
    if (!selectedType || !newName.trim()) return
    setCreating(true)

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { data: tu } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.user.id)
      .limit(1)
      .single()

    if (!tu) return
    const tenantId = (tu as { tenant_id: string }).tenant_id

    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9æøå]/g, '-').replace(/-+/g, '-')

    const { data: created } = await supabase
      .from('calculators')
      .insert({
        tenant_id: tenantId,
        type: selectedType,
        name: newName.trim(),
        slug,
        price_config: {},
      } as never)
      .select('id')
      .single()

    if (created) {
      router.push(`/admin/calculators/${(created as { id: string }).id}`)
    }

    setCreating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Beregnere</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tilføj beregner
        </Button>
      </div>

      {calculators.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calculator className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">Ingen beregnere endnu</h3>
            <p className="text-sm text-muted-foreground mb-4">Opret din første beregner for at komme i gang</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tilføj beregner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculators.map((calc) => {
            const Icon = TYPE_ICON_MAP[calc.type] ?? Calculator
            return (
              <Card
                key={calc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/admin/calculators/${calc.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{calc.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{calc.type}</p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={calc.is_active}
                        onCheckedChange={(v) => handleToggle(calc.id, v)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* OPRET DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? 'Giv beregneren et navn' : 'Vælg beregner-type'}
            </DialogTitle>
          </DialogHeader>

          {!selectedType ? (
            <div className="grid grid-cols-2 gap-3 py-4">
              {CALC_TYPES.map((ct) => {
                const Icon = ct.icon
                return (
                  <button
                    key={ct.type}
                    type="button"
                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-transparent bg-gray-50 p-4 hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={() => setSelectedType(ct.type)}
                  >
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium text-center">{ct.label}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Navn på beregner</Label>
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="F.eks. Tagrens Sjælland"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedType && (
              <Button variant="outline" onClick={() => setSelectedType(null)}>
                Tilbage
              </Button>
            )}
            {selectedType && (
              <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Opret beregner
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
