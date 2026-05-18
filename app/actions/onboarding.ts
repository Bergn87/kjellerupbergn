'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/helpers'
import { DEFAULT_TAGRENS_PRICE_CONFIG } from '@/lib/calculators/tagrens'

interface OnboardingData {
  companyName: string
  companyCvr: string
  companyPhone: string
  companyEmail: string
}

export async function completeOnboarding(data: OnboardingData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Ikke logget ind')

  const supabase = await createAdminClient()

  // 1. Opret slug fra firmanavn
  const slug = data.companyName
    .toLowerCase()
    .replace(/[^a-zæøå0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

  // Check unik slug
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  const finalSlug = existing ? `${slug}-${Date.now().toString(36).slice(-4)}` : slug

  // 2. Opret tenant med standardindstillinger
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      slug: finalSlug,
      company_name: data.companyName,
      company_cvr: data.companyCvr || null,
      company_phone: data.companyPhone || null,
      company_email: data.companyEmail || user.email,
      company_logo_url: null,
      primary_color: '#1B3C2E',
    } as never)
    .select('id')
    .single<{ id: string }>()

  if (tenantError || !tenant) {
    console.error('Tenant oprettelse fejl:', JSON.stringify(tenantError, null, 2))
    throw new Error(`Kunne ikke oprette virksomhed: ${tenantError?.message ?? 'ukendt fejl'}`)
  }

  // 3. Opret tenant_user relation
  await supabase
    .from('tenant_users')
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
    } as never)

  // 4. Opret standard tagrens-beregner (brugeren tilføjer flere i admin)
  await supabase
    .from('calculators')
    .insert({
      tenant_id: tenant.id,
      type: 'tagrens',
      name: 'Tagrens',
      slug: 'tagrens',
      price_config: DEFAULT_TAGRENS_PRICE_CONFIG,
    } as never)

  // 5. Seed standard reminder_rules
  await supabase
    .from('reminder_rules')
    .insert([
      {
        tenant_id: tenant.id,
        name: 'Første påmindelse (3 dage)',
        delay_days: 3,
        channel: 'mail',
        mail_subject: 'Påmindelse: Dit tilbud fra {{firma_navn}}',
        mail_body_html: 'Hej {{kunde_navn}},\n\nVi følger op på det tilbud vi sendte dig.\n\nDu kan stadig se dit tilbud her: {{tilbud_link}}\n\nVenlig hilsen\n{{firma_navn}}',
        is_active: true,
        sort_order: 0,
      },
      {
        tenant_id: tenant.id,
        name: 'Anden påmindelse (7 dage)',
        delay_days: 7,
        channel: 'both',
        mail_subject: 'Sidste påmindelse: Dit tilbud fra {{firma_navn}}',
        mail_body_html: 'Hej {{kunde_navn}},\n\nDit tilbud udløber snart.\n\nSe det her: {{tilbud_link}}\n\nVenlig hilsen\n{{firma_navn}}',
        sms_body: 'Hej {{kunde_navn}}, dit tilbud fra {{firma_navn}} udløber snart. Se det her: {{tilbud_link}}',
        is_active: true,
        sort_order: 1,
      },
    ] as never[])

  // 6. Seed tenant_settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)('seed_tenant_settings', { p_tenant_id: tenant.id })

  redirect('/admin/dashboard')
}
