-- ============================================
-- Bergn.dk — Initial Database Schema
-- Version: 1.0
-- ============================================

-- ============================================
-- 1. TABELLER
-- ============================================

-- TENANTS
CREATE TABLE tenants (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text UNIQUE NOT NULL,
  -- Firma
  company_name           text NOT NULL,
  company_cvr            text,
  company_address        text,
  company_phone          text,
  company_email          text NOT NULL,
  company_logo_url       text,
  -- Branding
  primary_color          text DEFAULT '#1B4332',
  secondary_color        text DEFAULT '#E8500A',
  -- Plan
  plan                   text DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'business', 'expired')),
  trial_ends_at          timestamptz DEFAULT now() + interval '14 days',
  plan_expires_at        timestamptz,
  leads_used_this_month  int DEFAULT 0,
  leads_quota            int DEFAULT 20,
  -- Stripe
  stripe_customer_id     text,
  stripe_subscription_id text,
  -- Tilbud nummerering
  quote_counter          int DEFAULT 0,
  quote_prefix           text DEFAULT 'T',
  -- Feature flags
  feature_flags          jsonb DEFAULT '{}',
  is_active              bool DEFAULT true,
  created_at             timestamptz DEFAULT now()
);

-- TENANT BRUGERE
CREATE TABLE tenant_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- BEREGNERE
CREATE TABLE calculators (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type         text NOT NULL,
  name         text NOT NULL,
  slug         text NOT NULL,
  is_active    bool DEFAULT true,
  price_config jsonb NOT NULL DEFAULT '{}',
  settings     jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- KUNDER (CRM-light)
CREATE TABLE customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  address     text,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- TILBUD
CREATE TABLE quotes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  calculator_id    uuid REFERENCES calculators(id),
  customer_id      uuid REFERENCES customers(id),
  quote_uuid       uuid UNIQUE DEFAULT gen_random_uuid(),
  quote_number     text NOT NULL,
  -- Status
  status           text DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'accepted', 'rejected', 'expired')),
  source           text DEFAULT 'calculator' CHECK (source IN ('calculator', 'manual')),
  -- Kundeinfo (snapshot ved oprettelse)
  customer_name    text NOT NULL,
  customer_email   text NOT NULL,
  customer_phone   text,
  customer_address text,
  -- Data
  bbr_data         jsonb,
  house_details    jsonb,
  extra_details    jsonb,
  line_items       jsonb NOT NULL DEFAULT '[]',
  -- Beløb
  subtotal         numeric,
  vat_amount       numeric,
  total_excl_vat   numeric,
  total_incl_vat   numeric,
  -- Kommunikation
  pdf_url          text,
  mail_sent_at     timestamptz,
  sms_sent_at      timestamptz,
  reminders_sent   int DEFAULT 0,
  last_reminder_at timestamptz,
  -- Accept/afvis
  accepted_at      timestamptz,
  rejected_at      timestamptz,
  rejection_reason text,
  expired_at       timestamptz,
  expires_at       timestamptz,
  -- Admin
  internal_notes   text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- TILBUD LINJER
CREATE TABLE quote_line_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity    numeric DEFAULT 1,
  unit        text DEFAULT 'stk',
  unit_price  numeric NOT NULL,
  total       numeric NOT NULL,
  sort_order  int DEFAULT 0
);

-- PÅMINDELSESREGLER
CREATE TABLE reminder_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  calculator_id   uuid REFERENCES calculators(id),
  name            text NOT NULL,
  delay_days      int NOT NULL,
  channel         text NOT NULL CHECK (channel IN ('mail', 'sms', 'both')),
  mail_subject    text,
  mail_body_html  text,
  sms_body        text,
  is_active       bool DEFAULT true,
  sort_order      int DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- TENANT INDSTILLINGER
CREATE TABLE tenant_settings (
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key         text NOT NULL,
  value       text,
  PRIMARY KEY (tenant_id, key)
);

-- RATE LIMITING
CREATE TABLE rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  text NOT NULL,
  tenant_id   uuid REFERENCES tenants(id),
  endpoint    text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- AUDIT LOG
CREATE TABLE audit_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id    uuid,
  action           text NOT NULL,
  target_tenant_id uuid,
  metadata         jsonb,
  created_at       timestamptz DEFAULT now()
);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

-- Tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read own tenant"
  ON tenants FOR SELECT
  USING (id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenant owners can update own tenant"
  ON tenants FOR UPDATE
  USING (id IN (
    SELECT tenant_id FROM tenant_users
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Tenant Users
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read own tenant users"
  ON tenant_users FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenant owners can manage own tenant users"
  ON tenant_users FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Calculators
ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active calculators"
  ON calculators FOR SELECT
  USING (is_active = true);

CREATE POLICY "Tenant members manage own calculators"
  ON calculators FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read own customers"
  ON customers FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenant members can manage own customers"
  ON customers FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- Quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see own quotes"
  ON quotes FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenant members manage own quotes"
  ON quotes FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can read quote by uuid"
  ON quotes FOR SELECT
  USING (quote_uuid IS NOT NULL);

-- Quote Line Items
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members see own quote line items"
  ON quote_line_items FOR SELECT
  USING (quote_id IN (
    SELECT id FROM quotes WHERE tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Tenant members manage own quote line items"
  ON quote_line_items FOR ALL
  USING (quote_id IN (
    SELECT id FROM quotes WHERE tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  ));

-- Reminder Rules
ALTER TABLE reminder_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read own reminder rules"
  ON reminder_rules FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenant owners can manage own reminder rules"
  ON reminder_rules FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Tenant Settings
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read own settings"
  ON tenant_settings FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenant owners can manage own settings"
  ON tenant_settings FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- Rate Limits (ingen RLS — bruges server-side med service role)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Audit Log (ingen RLS — bruges server-side med service role)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_uuid ON quotes(quote_uuid);
CREATE INDEX idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_calculators_tenant ON calculators(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_email ON customers(tenant_id, email);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX idx_rate_limits_ip ON rate_limits(ip_address, endpoint, created_at);
CREATE INDEX idx_quotes_expires ON quotes(expires_at) WHERE status = 'pending';
CREATE INDEX idx_quotes_reminders ON quotes(status, reminders_sent, created_at) WHERE status = 'pending';

-- ============================================
-- 4. STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('quotes', 'quotes', false),
  ('logos', 'logos', true),
  ('assets', 'assets', true);

-- ============================================
-- 5. STORAGE POLICIES
-- ============================================

-- Logos: public read
CREATE POLICY "Public can read logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

-- Logos: authenticated write (egen tenant-mappe)
CREATE POLICY "Tenant members can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM tenants t
      INNER JOIN tenant_users tu ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can update logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM tenants t
      INNER JOIN tenant_users tu ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can delete logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM tenants t
      INNER JOIN tenant_users tu ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid()
    )
  );

-- Quotes bucket: authenticated read (kun eget tenant)
CREATE POLICY "Tenant members can read own quote PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'quotes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM tenants t
      INNER JOIN tenant_users tu ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can upload quote PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'quotes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM tenants t
      INNER JOIN tenant_users tu ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid()
    )
  );

-- Assets: public read
CREATE POLICY "Public can read assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

CREATE POLICY "Authenticated can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assets'
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- 6. FUNKTIONER
-- ============================================

-- Atomisk tilbudsnummerering
CREATE OR REPLACE FUNCTION get_next_quote_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_counter int;
  v_prefix text;
  v_year text;
BEGIN
  UPDATE tenants
  SET quote_counter = quote_counter + 1
  WHERE id = p_tenant_id
  RETURNING quote_counter, quote_prefix INTO v_counter, v_prefix;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found: %', p_tenant_id;
  END IF;

  v_year := extract(year FROM now())::text;

  RETURN v_prefix || '-' || v_year || '-' || lpad(v_counter::text, 4, '0');
END;
$$;

-- GDPR cleanup: slet leads ældre end 24 måneder
CREATE OR REPLACE FUNCTION cleanup_old_quotes()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted int;
BEGIN
  WITH deleted AS (
    DELETE FROM quotes
    WHERE created_at < now() - interval '24 months'
      AND status IN ('rejected', 'expired')
    RETURNING id
  )
  SELECT count(*) INTO v_deleted FROM deleted;

  INSERT INTO audit_log (action, metadata)
  VALUES (
    'gdpr_cleanup',
    jsonb_build_object('deleted_quotes', v_deleted, 'executed_at', now())
  );

  RETURN v_deleted;
END;
$$;

-- Auto-update updated_at på quotes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. SEED: Standard tenant_settings (bruges ved oprettelse)
-- ============================================

-- Denne funktion seeder standardindstillinger for en ny tenant
CREATE OR REPLACE FUNCTION seed_tenant_settings(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO tenant_settings (tenant_id, key, value) VALUES
    (p_tenant_id, 'quote_mail_subject', 'Dit tilbud fra {{firma_navn}}'),
    (p_tenant_id, 'quote_mail_body', E'Hej {{kunde_navn}},\n\nTak for din henvendelse. Vedhæftet finder du dit tilbud.\n\nSe dit tilbud her: {{tilbud_link}}\n\nVenlig hilsen\n{{firma_navn}}\n{{firma_telefon}}'),
    (p_tenant_id, 'quote_sms_body', 'Hej {{kunde_navn}}, du har modtaget et tilbud fra {{firma_navn}}. Se det her: {{tilbud_link}}'),
    (p_tenant_id, 'confirmation_mail_subject', 'Tak for din accept — {{firma_navn}}'),
    (p_tenant_id, 'confirmation_mail_body', E'Hej {{kunde_navn}},\n\nTak fordi du har accepteret tilbud {{tilbud_nummer}}.\n\nVi kontakter dig hurtigst muligt for at aftale det videre forløb.\n\nVenlig hilsen\n{{firma_navn}}\n{{firma_telefon}}'),
    (p_tenant_id, 'reminder_mail_subject', 'Påmindelse: Dit tilbud fra {{firma_navn}}'),
    (p_tenant_id, 'reminder_mail_body', E'Hej {{kunde_navn}},\n\nVi følger op på det tilbud vi sendte dig for {{dage_siden_tilbud}} dage siden.\n\nDu kan stadig se dit tilbud her: {{tilbud_link}}\n\nTilbuddet udløber {{tilbud_udloeber}}.\n\nVenlig hilsen\n{{firma_navn}}'),
    (p_tenant_id, 'reminder_sms_body', 'Hej {{kunde_navn}}, husk dit tilbud fra {{firma_navn}} udløber snart. Se det her: {{tilbud_link}}'),
    (p_tenant_id, 'terms_and_conditions', 'Tilbuddet er gyldigt i 30 dage fra tilbudsdato. Alle priser er inkl. moms. Arbejdet udføres efter gældende branchestandarder.'),
    (p_tenant_id, 'admin_notification_email', ''),
    (p_tenant_id, 'sms_sender_name', 'Bergn.dk')
  ON CONFLICT (tenant_id, key) DO NOTHING;
END;
$$;
