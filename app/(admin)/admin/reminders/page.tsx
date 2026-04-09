'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Bell, Plus, Trash2, Save, Loader2, GripVertical } from 'lucide-react'

interface ReminderRule {
  id: string
  name: string
  delay_days: number
  channel: 'mail' | 'sms' | 'both'
  mail_subject: string | null
  mail_body_html: string | null
  sms_body: string | null
  is_active: boolean
  sort_order: number
}

export default function RemindersPage() {
  const supabase = createClient()
  const [rules, setRules] = useState<ReminderRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tu } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).limit(1).single()
      if (!tu) return
      const tenantId = (tu as { tenant_id: string }).tenant_id
      const { data } = await supabase.from('reminder_rules').select('*').eq('tenant_id', tenantId).order('sort_order')
      setRules((data as unknown as ReminderRule[]) ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: active } : r))
    await supabase.from('reminder_rules').update({ is_active: active } as never).eq('id', id)
  }, [supabase])

  const handleSave = useCallback(async (rule: ReminderRule) => {
    setSaving(true)
    await supabase.from('reminder_rules').update({
      name: rule.name,
      delay_days: rule.delay_days,
      channel: rule.channel,
      mail_subject: rule.mail_subject,
      mail_body_html: rule.mail_body_html,
      sms_body: rule.sms_body,
    } as never).eq('id', rule.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [supabase])

  const handleDelete = useCallback(async (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
    await supabase.from('reminder_rules').delete().eq('id', id)
  }, [supabase])

  const updateRule = (id: string, updates: Partial<ReminderRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Påmindelser</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Automatiske påmindelser sendes til kunder der ikke har svaret på et tilbud.
      </p>

      {rules.length === 0 ? (
        <Card className="border border-[#E8EAF0]">
          <CardContent className="py-16 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="font-semibold mb-1">Ingen påmindelser sat op</h3>
            <p className="text-sm text-muted-foreground">Påmindelser oprettes automatisk ved onboarding.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="border border-[#E8EAF0]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={rule.is_active} onCheckedChange={(v) => handleToggle(rule.id, v)} />
                  <button onClick={() => handleDelete(rule.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Navn</Label>
                    <Input value={rule.name} onChange={(e) => updateRule(rule.id, { name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dage efter tilbud</Label>
                    <Input type="number" min={1} value={rule.delay_days} onChange={(e) => updateRule(rule.id, { delay_days: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kanal</Label>
                    <Select value={rule.channel} onValueChange={(v) => { if (v) updateRule(rule.id, { channel: v as ReminderRule['channel'] }) }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mail">Kun email</SelectItem>
                        <SelectItem value="sms">Kun SMS</SelectItem>
                        <SelectItem value="both">Email + SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(rule.channel === 'mail' || rule.channel === 'both') && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Email emne</Label>
                      <Input value={rule.mail_subject ?? ''} onChange={(e) => updateRule(rule.id, { mail_subject: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email indhold</Label>
                      <Textarea rows={4} value={rule.mail_body_html ?? ''} onChange={(e) => updateRule(rule.id, { mail_body_html: e.target.value })} />
                      <p className="text-xs text-muted-foreground">Variabler: {'{{kunde_navn}}'}, {'{{firma_navn}}'}, {'{{tilbud_link}}'}, {'{{tilbud_nummer}}'}</p>
                    </div>
                  </>
                )}

                {(rule.channel === 'sms' || rule.channel === 'both') && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>SMS tekst</Label>
                      <Textarea rows={2} value={rule.sms_body ?? ''} onChange={(e) => updateRule(rule.id, { sms_body: e.target.value })} />
                    </div>
                  </>
                )}

                <Button size="sm" onClick={() => handleSave(rule)} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                  {saved ? 'Gemt!' : 'Gem'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
