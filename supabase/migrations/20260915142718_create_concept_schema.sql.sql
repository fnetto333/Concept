/*
# Create Concept Empreendimentos full database schema

## Overview
Creates the complete schema for the Concept Empreendimentos construction company system:
- colaboradores: metadata for staff members (name, role) linked to auth.users
- orcamentos: construction budget estimates based on CUB
- orcamento_etapas: construction stages with percentages and values per budget
- orcamento_insumos: detailed materials/labor breakdown per budget stage
- equipe_site: team members displayed on the public About page
- conteudo_sobre: editable text content for the About page

## Tables

### colaboradores
- id (uuid, PK, references auth.users)
- nome (text, display name)
- cargo (text, job title)
- is_admin (boolean, can create new users)
- created_at (timestamptz)

### orcamentos
- id (uuid, PK)
- cliente_nome, cliente_telefone, cliente_email (text)
- endereco_obra (text)
- area_total (numeric, m²)
- padrao (text: Baixo/Normal/Alto)
- tipo_obra (text)
- cub_m2 (numeric, CUB value per m²)
- valor_total (numeric, calculated total)
- status (text: Rascunho/Enviado/Aprovado)
- criado_por (uuid, references auth.users)
- criado_por_nome (text, denormalized)
- bdi_percent (numeric, profit margin)
- prazo_meses (integer)
- created_at, updated_at (timestamptz)

### orcamento_etapas
- id (uuid, PK)
- orcamento_id (uuid, FK CASCADE)
- nome, percentual, valor, duracao_meses, ordem

### orcamento_insumos
- id (uuid, PK)
- orcamento_id (uuid, FK CASCADE)
- etapa_nome, descricao, unidade, quantidade, custo_unitario, custo_total, tipo

### equipe_site
- id, nome, cargo, foto_url, ordem, ativo, created_at

### conteudo_sobre
- id, titulo, paragrafo, ordem, created_at

## Security
- RLS enabled on all tables
- colaboradores: authenticated read; self-update; admin insert/update all
- orcamentos/etapas/insumos: authenticated CRUD (shared among team)
- equipe_site/conteudo_sobre: public read, authenticated write
- SECURITY DEFINER function create_colaborador for admin user creation

## Important Notes
1. Initial admin user must be created via Supabase auth then inserted into colaboradores
2. All budget tables are shared among authenticated staff (no per-user isolation)
*/

-- ============================================================================
-- COLABORADORES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS colaboradores (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cargo text NOT NULL DEFAULT 'Colaborador',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_colaboradores" ON colaboradores;
CREATE POLICY "select_colaboradores" ON colaboradores FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_colaborador" ON colaboradores;
CREATE POLICY "update_own_colaborador" ON colaboradores FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_update_colaborador" ON colaboradores;
CREATE POLICY "admin_update_colaborador" ON colaboradores FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = auth.uid() AND c.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = auth.uid() AND c.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_insert_colaborador" ON colaboradores;
CREATE POLICY "admin_insert_colaborador" ON colaboradores FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM colaboradores c WHERE c.id = auth.uid() AND c.is_admin = true)
  );

-- ============================================================================
-- ORCAMENTOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome text NOT NULL DEFAULT '',
  cliente_telefone text DEFAULT '',
  cliente_email text DEFAULT '',
  endereco_obra text DEFAULT '',
  area_total numeric NOT NULL DEFAULT 0,
  padrao text NOT NULL DEFAULT 'Normal',
  tipo_obra text NOT NULL DEFAULT 'Casa térrea',
  cub_m2 numeric NOT NULL DEFAULT 3190,
  valor_total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Rascunho',
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_por_nome text DEFAULT '',
  bdi_percent numeric NOT NULL DEFAULT 0,
  prazo_meses integer NOT NULL DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_orcamentos" ON orcamentos;
CREATE POLICY "select_orcamentos" ON orcamentos FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_orcamentos" ON orcamentos;
CREATE POLICY "insert_orcamentos" ON orcamentos FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_orcamentos" ON orcamentos;
CREATE POLICY "update_orcamentos" ON orcamentos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_orcamentos" ON orcamentos;
CREATE POLICY "delete_orcamentos" ON orcamentos FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- ORCAMENTO_ETAPAS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orcamento_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  percentual numeric NOT NULL DEFAULT 0,
  valor numeric NOT NULL DEFAULT 0,
  duracao_meses integer NOT NULL DEFAULT 1,
  ordem integer NOT NULL DEFAULT 0
);

ALTER TABLE orcamento_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_etapas" ON orcamento_etapas;
CREATE POLICY "select_etapas" ON orcamento_etapas FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_etapas" ON orcamento_etapas;
CREATE POLICY "insert_etapas" ON orcamento_etapas FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_etapas" ON orcamento_etapas;
CREATE POLICY "update_etapas" ON orcamento_etapas FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_etapas" ON orcamento_etapas;
CREATE POLICY "delete_etapas" ON orcamento_etapas FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- ORCAMENTO_INSUMOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orcamento_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  etapa_nome text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  unidade text NOT NULL DEFAULT 'un',
  quantidade numeric NOT NULL DEFAULT 0,
  custo_unitario numeric NOT NULL DEFAULT 0,
  custo_total numeric NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'Material'
);

ALTER TABLE orcamento_insumos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_insumos" ON orcamento_insumos;
CREATE POLICY "select_insumos" ON orcamento_insumos FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_insumos" ON orcamento_insumos;
CREATE POLICY "insert_insumos" ON orcamento_insumos FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_insumos" ON orcamento_insumos;
CREATE POLICY "update_insumos" ON orcamento_insumos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_insumos" ON orcamento_insumos;
CREATE POLICY "delete_insumos" ON orcamento_insumos FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- EQUIPE_SITE TABLE (public read, authenticated write)
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipe_site (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text NOT NULL,
  foto_url text DEFAULT '',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipe_site ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_equipe" ON equipe_site;
CREATE POLICY "public_read_equipe" ON equipe_site FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_equipe" ON equipe_site;
CREATE POLICY "auth_insert_equipe" ON equipe_site FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_equipe" ON equipe_site;
CREATE POLICY "auth_update_equipe" ON equipe_site FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_equipe" ON equipe_site;
CREATE POLICY "auth_delete_equipe" ON equipe_site FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- CONTEUDO_SOBRE TABLE (public read, authenticated write)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conteudo_sobre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  paragrafo text NOT NULL DEFAULT '',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conteudo_sobre ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_conteudo" ON conteudo_sobre;
CREATE POLICY "public_read_conteudo" ON conteudo_sobre FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_conteudo" ON conteudo_sobre;
CREATE POLICY "auth_insert_conteudo" ON conteudo_sobre FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_conteudo" ON conteudo_sobre;
CREATE POLICY "auth_update_conteudo" ON conteudo_sobre FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_conteudo" ON conteudo_sobre;
CREATE POLICY "auth_delete_conteudo" ON conteudo_sobre FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- SECURITY DEFINER FUNCTION: create_colaborador
-- ============================================================================
CREATE OR REPLACE FUNCTION create_colaborador(
  p_email text,
  p_password text,
  p_nome text,
  p_cargo text,
  p_is_admin boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM colaboradores c WHERE c.id = auth.uid() AND c.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar novos colaboradores';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('nome', p_nome, 'cargo', p_cargo)
  ) RETURNING id INTO new_user_id;

  INSERT INTO colaboradores (id, nome, cargo, is_admin)
  VALUES (new_user_id, p_nome, p_cargo, p_is_admin);

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_colaborador TO authenticated;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at ON orcamentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orcamento_etapas_orcamento_id ON orcamento_etapas(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_insumos_orcamento_id ON orcamento_insumos(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_equipe_site_ordem ON equipe_site(ordem);
CREATE INDEX IF NOT EXISTS idx_conteudo_sobre_ordem ON conteudo_sobre(ordem);

-- ============================================================================
-- SEED DATA: Default "Sobre Nós" content
-- ============================================================================
INSERT INTO conteudo_sobre (titulo, paragrafo, ordem)
SELECT 'Uma história de presença', 'Na Concept, cada empreendimento nasce de uma escuta atenta. Entendemos o terreno, a rotina, os desejos e o futuro de quem vai ocupar aquele espaço.', 1
WHERE NOT EXISTS (SELECT 1 FROM conteudo_sobre);

INSERT INTO conteudo_sobre (titulo, paragrafo, ordem)
SELECT 'Arquitetura e engenharia juntas', 'Unimos arquitetura autoral, engenharia responsável e uma gestão próxima para fazer de cada obra uma experiência segura e especial.', 2
WHERE NOT EXISTS (SELECT 1 FROM conteudo_sobre WHERE ordem = 2);

-- ============================================================================
-- SEED DATA: Default team members
-- ============================================================================
INSERT INTO equipe_site (nome, cargo, foto_url, ordem, ativo)
SELECT 'Francisco Neto', 'Engenheiro Civil · Fundador', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600', 1, true
WHERE NOT EXISTS (SELECT 1 FROM equipe_site);

INSERT INTO equipe_site (nome, cargo, foto_url, ordem, ativo)
SELECT 'Marina Costa', 'Arquiteta', 'https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=600', 2, true
WHERE NOT EXISTS (SELECT 1 FROM equipe_site WHERE ordem = 2);

-- ============================================================================
-- TRIGGER: updated_at on orcamentos
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orcamentos_updated_at ON orcamentos;
CREATE TRIGGER trg_orcamentos_updated_at
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
