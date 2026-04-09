'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, Trash2, Plus } from 'lucide-react'
import { DEFAULT_TAGRENS_PRICE_CONFIG } from '@/lib/calculators/tagrens'
import type { TagrensPriceConfig } from '@/lib/calculators/types'
import { calculateTagrensPrice } from '@/lib/calculators/tagrens'

interface CalcData {
  id: string
  name: string
  type: string
  slug: string
  is_active: boolean
  price_config: TagrensPriceConfig
  tenant_id: string
}

function formatKr(n: number) {
  return Math.round(n).toLocaleString('da-DK') + ' kr.'
}

export default function CalculatorDetailPage() {
  const params = useParams()
  const calcId = params.id as string
  const supabase = createClient()

  const [calc, setCalc] = useState<CalcData | null>(null)
  const [config, setConfig] = useState<TagrensPriceConfig>(DEFAULT_TAGRENS_PRICE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newTagType, setNewTagType] = useState('')

  // Load
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('calculators')
        .select('*')
        .eq('id', calcId)
        .single()

      if (data) {
        const c = data as unknown as CalcData
        setCalc(c)
        const pc = c.price_config && Object.keys(c.price_config).length > 0
          ? c.price_config
          : DEFAULT_TAGRENS_PRICE_CONFIG
        setConfig(pc)
      }
      setLoading(false)
    }
    load()
  }, [calcId, supabase])

  // Save
  const handleSave = useCallback(async () => {
    if (!calc) return
    setSaving(true)
    setSaved(false)

    await supabase
      .from('calculators')
      .update({ price_config: config as unknown as Record<string, unknown> } as never)
      .eq('id', calc.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [calc, config, supabase])

  // Live eksempel
  const liveExample = useCallback(() => {
    try {
      return calculateTagrensPrice(
        { tagType: 'Tegl', boligAreal: 120, tagFladeareal: 170, tagHaeldning: 45, bygningsHoejde: 3.5 },
        { oenskerMaling: false, antalOvenlysvinduer: 0, antalTagkviste: 0, harTagrender: true, harSkjulteTagrender: false, harSolceller: false },
        config
      )
    } catch {
      return null
    }
  }, [config])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (!calc) {
    return <div className="text-center py-20 text-muted-foreground">Beregner ikke fundet</div>
  }

  const example = liveExample()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{calc.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">{calc.type}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? 'Gemt!' : 'Gem priser'}
        </Button>
      </div>

      <Tabs defaultValue="priser">
        <TabsList>
          <TabsTrigger value="priser">Priser</TabsTrigger>
          <TabsTrigger value="embed">Embed-kode</TabsTrigger>
          <TabsTrigger value="indstillinger">Indstillinger</TabsTrigger>
        </TabsList>

        {/* ── PRISER TAB ──────────────────── */}
        <TabsContent value="priser" className="space-y-6 mt-6">

          {/* Sektion A: Tagtyper */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pris per m² per tagtype</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
                  <div className="col-span-5">Tagtype</div>
                  <div className="col-span-3">Pris per m²</div>
                  <div className="col-span-2">Aktiv</div>
                  <div className="col-span-2"></div>
                </div>

                {Object.entries(config.tagtyper).map(([name, cfg]) => (
                  <div key={name} className="grid grid-cols-12 gap-2 items-center rounded-lg border p-2">
                    <div className="col-span-5 text-sm font-medium">{name}</div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={cfg.pris_per_kvm}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            setConfig((prev) => ({
                              ...prev,
                              tagtyper: {
                                ...prev.tagtyper,
                                [name]: { ...cfg, pris_per_kvm: val },
                              },
                            }))
                          }}
                          className="h-8 w-20"
                        />
                        <span className="text-xs text-muted-foreground">kr/m²</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Switch
                        checked={cfg.aktiv}
                        onCheckedChange={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            tagtyper: { ...prev.tagtyper, [name]: { ...cfg, aktiv: v } },
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setConfig((prev) => {
                            const updated = { ...prev.tagtyper }
                            delete updated[name]
                            return { ...prev, tagtyper: updated }
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Tilføj tagtype */}
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Ny tagtype..."
                    value={newTagType}
                    onChange={(e) => setNewTagType(e.target.value)}
                    className="max-w-[200px] h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTagType.trim()) {
                        setConfig((prev) => ({
                          ...prev,
                          tagtyper: {
                            ...prev.tagtyper,
                            [newTagType.trim()]: { pris_per_kvm: 150, aktiv: true },
                          },
                        }))
                        setNewTagType('')
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!newTagType.trim()}
                    onClick={() => {
                      if (newTagType.trim()) {
                        setConfig((prev) => ({
                          ...prev,
                          tagtyper: {
                            ...prev.tagtyper,
                            [newTagType.trim()]: { pris_per_kvm: 150, aktiv: true },
                          },
                        }))
                        setNewTagType('')
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tilføj
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sektion B: Tillæg */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tillæg og ekstraydelser</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TillaegField label="Tillæg for stejl hældning (>30°)" desc="Lægges oven i basisprisen per m²" suffix="kr/m²"
                value={config.tillaeg.haeldning_over_30_per_kvm}
                onChange={(v) => setConfig((p) => ({ ...p, tillaeg: { ...p.tillaeg, haeldning_over_30_per_kvm: v } }))}
              />
              <TillaegField label="Tillæg for høj bygning (≥3,5m)" desc="Fast beløb per opgave" suffix="kr"
                value={config.tillaeg.hoejde_over_35m_fast}
                onChange={(v) => setConfig((p) => ({ ...p, tillaeg: { ...p.tillaeg, hoejde_over_35m_fast: v } }))}
              />
              <TillaegField label="Tillæg for manglende tagrender" desc="Fast beløb per opgave" suffix="kr"
                value={config.tillaeg.ingen_tagrender_fast}
                onChange={(v) => setConfig((p) => ({ ...p, tillaeg: { ...p.tillaeg, ingen_tagrender_fast: v } }))}
              />
              <TillaegField label="Tillæg for skjulte tagrender" desc="Fast beløb per opgave" suffix="kr"
                value={config.tillaeg.skjulte_tagrender_fast}
                onChange={(v) => setConfig((p) => ({ ...p, tillaeg: { ...p.tillaeg, skjulte_tagrender_fast: v } }))}
              />
              <TillaegField label="Ovenlysvinduer" desc="Per styk" suffix="kr/stk"
                value={config.tillaeg.ovenlysvinduer_per_stk}
                onChange={(v) => setConfig((p) => ({ ...p, tillaeg: { ...p.tillaeg, ovenlysvinduer_per_stk: v } }))}
              />
              <TillaegField label="Tagkviste" desc="Per styk" suffix="kr/stk"
                value={config.tillaeg.tagkviste_per_stk}
                onChange={(v) => setConfig((p) => ({ ...p, tillaeg: { ...p.tillaeg, tagkviste_per_stk: v } }))}
              />
              <TillaegField label="Tillæg for solceller" desc="Fast beløb per opgave" suffix="kr"
                value={config.tillaeg.solceller_fast}
                onChange={(v) => setConfig((p) => ({ ...p, tillaeg: { ...p.tillaeg, solceller_fast: v } }))}
              />
            </CardContent>
          </Card>

          {/* Sektion C: Generelt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generelle indstillinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="min-w-[160px]">Antal lag maling</Label>
                <Input
                  type="number"
                  min={1}
                  className="w-20 h-8"
                  value={config.generelt.antal_lag_maling}
                  onChange={(e) => setConfig((p) => ({ ...p, generelt: { ...p.generelt, antal_lag_maling: parseInt(e.target.value) || 1 } }))}
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="min-w-[160px]">Tilbud gyldigt i</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="w-20 h-8"
                    value={config.generelt.tilbud_gyldigt_dage}
                    onChange={(e) => setConfig((p) => ({ ...p, generelt: { ...p.generelt, tilbud_gyldigt_dage: parseInt(e.target.value) || 30 } }))}
                  />
                  <span className="text-sm text-muted-foreground">dage</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live priseksempel */}
          {example && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-1">Live priseksempel</p>
                <p className="text-xs text-muted-foreground mb-2">120 m² tegltag, 45° hældning, 3,5m højt</p>
                <Separator className="my-2" />
                {example.lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span>{item.description}</span>
                    <span className="font-medium">{formatKr(item.total)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total inkl. moms</span>
                  <span>{formatKr(example.totalInclVat)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saved ? 'Gemt!' : 'Gem priser'}
          </Button>
        </TabsContent>

        {/* ── EMBED TAB ───────────────────── */}
        <TabsContent value="embed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Embed-kode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Kopiér koden herunder og indsæt den på din hjemmeside for at vise beregneren.
              </p>
              <pre className="rounded-lg bg-gray-900 text-green-400 p-4 text-xs overflow-x-auto">
{`<div id="bergn-calculator"></div>
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://app.bergn.dk'}/embed.js"
  data-tenant="${calc.tenant_id}"
  data-calculator="${calc.id}">
</script>`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INDSTILLINGER TAB ───────────── */}
        <TabsContent value="indstillinger" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Beregner-indstillinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input value={calc.name} readOnly className="text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={calc.type} readOnly className="text-muted-foreground capitalize" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={calc.slug} readOnly className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Tillæg felt ────────────────────────────

function TillaegField({
  label, desc, suffix, value, onChange,
}: {
  label: string; desc: string; suffix: string; value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          className="h-8 w-24 text-right"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        />
        <span className="text-xs text-muted-foreground min-w-[40px]">{suffix}</span>
      </div>
    </div>
  )
}
