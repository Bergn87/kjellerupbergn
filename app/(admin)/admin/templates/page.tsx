'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Save, Loader2, Mail } from 'lucide-react'

interface SettingsMap {
  [key: string]: string
}

const TEMPLATE_FIELDS = [
  { key: 'quote_mail_subject', label: 'Tilbuds-email: Emne', type: 'input' },
  { key: 'quote_mail_body', label: 'Tilbuds-email: Indhold', type: 'textarea' },
  { key: 'quote_sms_body', label: 'Tilbuds-SMS: Tekst', type: 'textarea' },
  { key: 'confirmation_mail_subject', label: 'Bekræftelses-email: Emne', type: 'input' },
  { key: 'confirmation_mail_body', label: 'Bekræftelses-email: Indhold', type: 'textarea' },
  { key: 'reminder_mail_subject', label: 'Påmindelses-email: Emne', type: 'input' },
  { key: 'reminder_mail_body', label: 'Påmindelses-email: Indhold', type: 'textarea' },
  { key: 'reminder_sms_body', label: 'Påmindelses-SMS: Tekst', type: 'textarea' },
  { key: 'terms_and_conditions', label: 'Handelsbetingelser', type: 'textarea' },
]

export default function TemplatesPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<SettingsMap>({})
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tu } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).limit(1).single()
      if (!tu) return
      const tid = (tu as { tenant_id: string }).tenant_id
      setTenantId(tid)

      const { data } = await supabase.from('tenant_settings').select('key, value').eq('tenant_id', tid)
      const map: SettingsMap = {}
      ;(data as { key: string; value: string | null }[] | null)?.forEach(r => { if (r.value) map[r.key] = r.value })
      setSettings(map)
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSave = useCallback(async () => {
    if (!tenantId) return
    setSaving(true)

    const upserts = Object.entries(settings).map(([key, value]) => ({
      tenant_id: tenantId,
      key,
      value,
    }))

    for (const row of upserts) {
      await supabase.from('tenant_settings').upsert(row as never, { onConflict: 'tenant_id,key' })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [tenantId, settings, supabase])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Skabeloner</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-[#1B3C2E] hover:bg-[#152F24]">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? 'Gemt!' : 'Gem alle skabeloner'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Tilpas tekster i emails, SMS-beskeder og handelsbetingelser. Brug {'{{variabler}}'} til dynamisk indhold.
      </p>

      <div className="rounded-lg border border-[#E8EAF0] bg-gray-50 p-4 text-xs text-muted-foreground">
        <strong>Tilgængelige variabler:</strong> {'{{kunde_navn}}'}, {'{{firma_navn}}'}, {'{{firma_telefon}}'}, {'{{tilbud_nummer}}'}, {'{{tilbud_link}}'}, {'{{tilbud_udloeber}}'}
      </div>

      <div className="space-y-4">
        {TEMPLATE_FIELDS.map((field) => (
          <Card key={field.key} className="border border-[#E8EAF0]">
            <CardContent className="pt-5 space-y-2">
              <Label className="text-sm font-medium">{field.label}</Label>
              {field.type === 'input' ? (
                <Input
                  value={settings[field.key] ?? ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : (
                <Textarea
                  rows={4}
                  value={settings[field.key] ?? ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-[#1B3C2E] hover:bg-[#152F24]">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {saved ? 'Gemt!' : 'Gem alle skabeloner'}
      </Button>
    </div>
  )
}
