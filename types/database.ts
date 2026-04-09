// Bergn.dk Database Types
// Manuelt oprettet til at matche 001_initial_schema.sql
// Erstattes senere af: npx supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
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
          feature_flags: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          company_name: string
          company_cvr?: string | null
          company_address?: string | null
          company_phone?: string | null
          company_email: string
          company_logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          plan?: 'trial' | 'starter' | 'pro' | 'business' | 'expired'
          trial_ends_at?: string | null
          plan_expires_at?: string | null
          leads_used_this_month?: number
          leads_quota?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          quote_counter?: number
          quote_prefix?: string
          feature_flags?: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          company_name?: string
          company_cvr?: string | null
          company_address?: string | null
          company_phone?: string | null
          company_email?: string
          company_logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          plan?: 'trial' | 'starter' | 'pro' | 'business' | 'expired'
          trial_ends_at?: string | null
          plan_expires_at?: string | null
          leads_used_this_month?: number
          leads_quota?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          quote_counter?: number
          quote_prefix?: string
          feature_flags?: Json
          is_active?: boolean
          created_at?: string
        }
      }
      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: 'owner' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role?: 'owner' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          created_at?: string
        }
      }
      calculators: {
        Row: {
          id: string
          tenant_id: string
          type: string
          name: string
          slug: string
          is_active: boolean
          price_config: Json
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          type: string
          name: string
          slug: string
          is_active?: boolean
          price_config?: Json
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          type?: string
          name?: string
          slug?: string
          is_active?: boolean
          price_config?: Json
          settings?: Json
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          tenant_id: string
          calculator_id: string | null
          customer_id: string | null
          quote_uuid: string
          quote_number: string
          status: 'draft' | 'pending' | 'accepted' | 'rejected' | 'expired'
          source: 'calculator' | 'manual'
          customer_name: string
          customer_email: string
          customer_phone: string | null
          customer_address: string | null
          bbr_data: Json | null
          house_details: Json | null
          extra_details: Json | null
          line_items: Json
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
        Insert: {
          id?: string
          tenant_id: string
          calculator_id?: string | null
          customer_id?: string | null
          quote_uuid?: string
          quote_number: string
          status?: 'draft' | 'pending' | 'accepted' | 'rejected' | 'expired'
          source?: 'calculator' | 'manual'
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          customer_address?: string | null
          bbr_data?: Json | null
          house_details?: Json | null
          extra_details?: Json | null
          line_items?: Json
          subtotal?: number | null
          vat_amount?: number | null
          total_excl_vat?: number | null
          total_incl_vat?: number | null
          pdf_url?: string | null
          mail_sent_at?: string | null
          sms_sent_at?: string | null
          reminders_sent?: number
          last_reminder_at?: string | null
          accepted_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          expired_at?: string | null
          expires_at?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          calculator_id?: string | null
          customer_id?: string | null
          quote_uuid?: string
          quote_number?: string
          status?: 'draft' | 'pending' | 'accepted' | 'rejected' | 'expired'
          source?: 'calculator' | 'manual'
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          customer_address?: string | null
          bbr_data?: Json | null
          house_details?: Json | null
          extra_details?: Json | null
          line_items?: Json
          subtotal?: number | null
          vat_amount?: number | null
          total_excl_vat?: number | null
          total_incl_vat?: number | null
          pdf_url?: string | null
          mail_sent_at?: string | null
          sms_sent_at?: string | null
          reminders_sent?: number
          last_reminder_at?: string | null
          accepted_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          expired_at?: string | null
          expires_at?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quote_line_items: {
        Row: {
          id: string
          quote_id: string
          description: string
          quantity: number
          unit: string
          unit_price: number
          total: number
          sort_order: number
        }
        Insert: {
          id?: string
          quote_id: string
          description: string
          quantity?: number
          unit?: string
          unit_price: number
          total: number
          sort_order?: number
        }
        Update: {
          id?: string
          quote_id?: string
          description?: string
          quantity?: number
          unit?: string
          unit_price?: number
          total?: number
          sort_order?: number
        }
      }
      reminder_rules: {
        Row: {
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
        Insert: {
          id?: string
          tenant_id: string
          calculator_id?: string | null
          name: string
          delay_days: number
          channel: 'mail' | 'sms' | 'both'
          mail_subject?: string | null
          mail_body_html?: string | null
          sms_body?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          calculator_id?: string | null
          name?: string
          delay_days?: number
          channel?: 'mail' | 'sms' | 'both'
          mail_subject?: string | null
          mail_body_html?: string | null
          sms_body?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      tenant_settings: {
        Row: {
          tenant_id: string
          key: string
          value: string | null
        }
        Insert: {
          tenant_id: string
          key: string
          value?: string | null
        }
        Update: {
          tenant_id?: string
          key?: string
          value?: string | null
        }
      }
      rate_limits: {
        Row: {
          id: string
          ip_address: string
          tenant_id: string | null
          endpoint: string
          created_at: string
        }
        Insert: {
          id?: string
          ip_address: string
          tenant_id?: string | null
          endpoint: string
          created_at?: string
        }
        Update: {
          id?: string
          ip_address?: string
          tenant_id?: string | null
          endpoint?: string
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          admin_user_id: string | null
          action: string
          target_tenant_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id?: string | null
          action: string
          target_tenant_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string | null
          action?: string
          target_tenant_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_next_quote_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      cleanup_old_quotes: {
        Args: Record<string, never>
        Returns: number
      }
      seed_tenant_settings: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
    }
  }
}
