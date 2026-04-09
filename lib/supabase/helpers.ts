import { createClient } from './server'
import type { Tenant, TenantUser } from '@/types'
import type { User } from '@supabase/supabase-js'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Hent den aktuelt loggede bruger.
 * Bruger getUser() (server-verificeret) — sikkert til autorisering.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Hent tenant for den aktuelt loggede bruger.
 * Returnerer null hvis bruger ikke har en tenant.
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single<{ tenant_id: string }>()

  if (!tenantUser) return null

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantUser.tenant_id)
    .single()

  return tenant as Tenant | null
}

/**
 * Hent tenant via slug (til public beregner-sider).
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return tenant as Tenant | null
}

/**
 * Tjek om en bruger er superadmin.
 * Superadmin identificeres via SUPERADMIN_EMAIL env var.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) return false

  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (!superadminEmail) return false

  return user.email === superadminEmail
}

/**
 * Verificér at den aktuelle bruger har adgang til en given tenant.
 * Kaster AuthError hvis ikke.
 */
export async function assertTenantAccess(tenantId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError('Ikke logget ind')
  }

  const supabase = await createClient()
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    throw new AuthError('Ingen adgang til denne virksomhed')
  }
}

/**
 * Hent brugerens rolle i en given tenant.
 */
export async function getTenantRole(
  tenantId: string,
  userId: string
): Promise<TenantUser['role'] | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single<{ role: TenantUser['role'] }>()

  return data?.role ?? null
}
