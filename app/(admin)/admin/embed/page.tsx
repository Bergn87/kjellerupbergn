'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Copy, Check, ExternalLink, Code2 } from 'lucide-react'

interface CalcItem {
  id: string
  name: string
  type: string
  slug: string
  tenant_id: string
}

export default function EmbedPage() {
  const supabase = createClient()
  const [calculators, setCalculators] = useState<CalcItem[]>([])
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tu } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).limit(1).single()
      if (!tu) return
      const tenantId = (tu as { tenant_id: string }).tenant_id

      const { data: tenant } = await supabase.from('tenants').select('slug').eq('id', tenantId).single()
      if (tenant) setSlug((tenant as { slug: string }).slug)

      const { data } = await supabase.from('calculators').select('id, name, type, slug, tenant_id').eq('tenant_id', tenantId).eq('is_active', true)
      setCalculators((data as unknown as CalcItem[]) ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.bergn.dk'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Embed-kode</h1>
      <p className="text-sm text-muted-foreground">
        Indsæt beregneren på din hjemmeside med en simpel kode-snippet.
      </p>

      {/* Hosted URL */}
      <Card className="border border-[#E8EAF0]">
        <CardHeader><CardTitle className="text-base">Din hosted beregner-side</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border bg-gray-50 px-4 py-2.5 font-mono text-sm">
              {slug}.bergn.dk
            </div>
            <a href={`/b/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /></Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Denne URL kan deles direkte med kunder.</p>
        </CardContent>
      </Card>

      {/* Embed per beregner */}
      {calculators.length === 0 ? (
        <Card className="border border-[#E8EAF0]">
          <CardContent className="py-12 text-center">
            <Code2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Opret en beregner for at få embed-kode.</p>
          </CardContent>
        </Card>
      ) : (
        calculators.map((calc) => {
          const embedCode = `<div id="bergn-calculator"></div>\n<script src="${appUrl}/embed.js"\n  data-tenant="${calc.tenant_id}"\n  data-calculator="${calc.id}">\n</script>`

          return (
            <Card key={calc.id} className="border border-[#E8EAF0]">
              <CardHeader>
                <CardTitle className="text-base">{calc.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <pre className="rounded-lg bg-gray-900 text-green-400 p-4 text-xs overflow-x-auto pr-12">
                    {embedCode}
                  </pre>
                  <button
                    type="button"
                    className="absolute top-3 right-3 rounded bg-gray-700 p-1.5 text-white hover:bg-gray-600 transition-colors"
                    onClick={() => copyToClipboard(embedCode, calc.id)}
                  >
                    {copiedId === calc.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                    WordPress-guide
                  </summary>
                  <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-muted-foreground space-y-2">
                    <p>1. Gå til den side hvor beregneren skal vises</p>
                    <p>2. Tilføj en &quot;Custom HTML&quot; blok</p>
                    <p>3. Indsæt embed-koden ovenfor</p>
                    <p>4. Gem og udgiv siden</p>
                  </div>
                </details>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
