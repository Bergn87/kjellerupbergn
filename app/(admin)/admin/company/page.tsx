'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Save, Loader2, Building2 } from 'lucide-react'

interface TenantData {
  id: string
  slug: string
  company_name: string
  company_cvr: string | null
  company_address: string | null
  company_phone: string | null
  company_email: string
  company_logo_url: string | null
  primary_color: string
  secondary_color: string
  quote_prefix: string
}

const COLOR_PRESETS = ['#1B3C2E', '#1e3a5f', '#7c2d12', '#581c87', '#0f766e', '#92400e', '#be123c', '#1d4ed8']

export default function CompanyPage() {
  const supabase = createClient()
  const [tenant, setTenant] = useState<TenantData | null>(null)
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
      const { data } = await supabase.from('tenants').select('id, slug, company_name, company_cvr, company_address, company_phone, company_email, company_logo_url, primary_color, secondary_color, quote_prefix').eq('id', tenantId).single()
      if (data) setTenant(data as unknown as TenantData)
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSave = useCallback(async () => {
    if (!tenant) return
    setSaving(true)
    await supabase.from('tenants').update({
      company_name: tenant.company_name,
      company_cvr: tenant.company_cvr,
      company_address: tenant.company_address,
      company_phone: tenant.company_phone,
      company_email: tenant.company_email,
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
      quote_prefix: tenant.quote_prefix,
    } as never).eq('id', tenant.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [tenant, supabase])

  const update = (field: keyof TenantData, value: string) => {
    setTenant(prev => prev ? { ...prev, [field]: value } : null)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (!tenant) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Virksomhed</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-[#1B3C2E] hover:bg-[#152F24]">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? 'Gemt!' : 'Gem ændringer'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-[#E8EAF0]">
          <CardHeader><CardTitle className="text-base">Firmaoplysninger</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Firmanavn</Label><Input value={tenant.company_name} onChange={(e) => update('company_name', e.target.value)} /></div>
            <div className="space-y-2"><Label>CVR</Label><Input value={tenant.company_cvr ?? ''} onChange={(e) => update('company_cvr', e.target.value)} maxLength={8} /></div>
            <div className="space-y-2"><Label>Adresse</Label><Input value={tenant.company_address ?? ''} onChange={(e) => update('company_address', e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefon</Label><Input value={tenant.company_phone ?? ''} onChange={(e) => update('company_phone', e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={tenant.company_email} onChange={(e) => update('company_email', e.target.value)} /></div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-[#E8EAF0]">
            <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primærfarve</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COLOR_PRESETS.map(c => (
                    <button key={c} type="button"
                      className={`h-8 w-8 rounded-lg border-2 transition-all ${tenant.primary_color === c ? 'border-black scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => update('primary_color', c)}
                    />
                  ))}
                </div>
                <Input value={tenant.primary_color} onChange={(e) => update('primary_color', e.target.value)} className="max-w-[140px]" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Tilbuds-prefix</Label>
                <Input value={tenant.quote_prefix} onChange={(e) => update('quote_prefix', e.target.value)} className="max-w-[80px]" maxLength={5} />
                <p className="text-xs text-muted-foreground">Tilbudsnumre formateres som: {tenant.quote_prefix}-2026-0001</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#E8EAF0]">
            <CardHeader><CardTitle className="text-base">Hosted URL</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                <span className="font-mono">{tenant.slug}.bergn.dk</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
