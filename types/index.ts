export type { Database, Json } from './database'

// ============================================
// TENANT
// ============================================
export interface Tenant {
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
  plan: 'trial' | 'starter' | 'pro' | 'business' | 'expired'
  trial_ends_at: string | null
  plan_expires_at: string | null
  leads_used_this_month: number
  leads_quota: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  quote_counter: number
  quote_prefix: string
  feature_flags: Record<string, boolean>
  is_active: boolean
  created_at: string
}

// ============================================
// TENANT USER
// ============================================
export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
}

// ============================================
// CALCULATOR
// ============================================
export interface Calculator {
  id: string
  tenant_id: string
  type: string
  name: string
  slug: string
  is_active: boolean
  price_config: Record<string, unknown>
  settings: Record<string, unknown>
  created_at: string
}

// ============================================
// CUSTOMER
// ============================================
export interface Customer {
  id: string
  tenant_id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
}

// ============================================
// QUOTE
// ============================================
export type QuoteStatus = 'draft' | 'pending' | 'accepted' | 'rejected' | 'expired'
export type QuoteSource = 'calculator' | 'manual'

export interface Quote {
  id: string
  tenant_id: string
  calculator_id: string | null
  customer_id: string | null
  quote_uuid: string
  quote_number: string
  status: QuoteStatus
  source: QuoteSource
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null
  bbr_data: Record<string, unknown> | null
  house_details: Record<string, unknown> | null
  extra_details: Record<string, unknown> | null
  line_items: QuoteLineItem[]
  subtotal: number | null
  vat_amount: number | null
  total_excl_vat: number | null
  total_incl_vat: number | null
  pdf_url: string | null
  mail_sent_at: string | null
  sms_sent_at: string | null
  reminders_sent: number
  last_reminder_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  expired_at: string | null
  expires_at: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

// ============================================
// QUOTE LINE ITEM
// ============================================
export interface QuoteLineItem {
  id: string
  quote_id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number
  sort_order: number
}

// ============================================
// REMINDER RULE
// ============================================
export interface ReminderRule {
  id: string
  tenant_id: string
  calculator_id: string | null
  name: string
  delay_days: number
  channel: 'mail' | 'sms' | 'both'
  mail_subject: string | null
  mail_body_html: string | null
  sms_body: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

// ============================================
// TENANT SETTING
// ============================================
export interface TenantSetting {
  tenant_id: string
  key: string
  value: string | null
}

// ============================================
// PRICE CALCULATION
// ============================================
export interface PriceLineItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number
}

export interface PriceResult {
  lineItems: PriceLineItem[]
  subtotal: number
  vatAmount: number
  totalExclVat: number
  totalInclVat: number
}

// ============================================
// BBR
// ============================================
export interface BBRData {
  tagType: string | null
  tagTypeKode: string | null
  boligAreal: number | null
  tagHaeldning: number | null
  tagFladeareal: number | null
  bygningsHoejde: number | null
  byggeaar: number | null
  raw: unknown
}

// ============================================
// DAWA
// ============================================
export interface DAWAResult {
  tekst: string
  adresse: {
    id: string
    adgangsadresseid: string
    vejnavn: string
    husnr: string
    postnr: string
    postnrnavn: string
  }
}

export interface AddressSelection {
  displayText: string
  adresseId: string
  adgAdrId: string
  postnr: string
  by: string
  vejnavn: string
  husnr: string
}
