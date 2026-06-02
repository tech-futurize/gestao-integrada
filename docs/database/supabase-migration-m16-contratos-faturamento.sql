-- ============================================================
-- M16 — Reestruturação Contratos + Faturamento
-- Aplicada em 2026-06-02 via mcp apply_migration (name: m16_contratos_faturamento)
-- Espelho versionado (a fonte da verdade é o banco real — ver L013–L016)
-- ============================================================

-- Faturamento do projeto (medição da construtora → alimenta Avanço Financeiro real)
create table if not exists public.faturamentos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  numero text,
  mes_referencia date not null,
  itens jsonb not null default '[]'::jsonb,
  valor_medido numeric not null default 0,
  status text not null default 'Elaboração' check (status in ('Elaboração','Concluído')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.faturamentos enable row level security;
create policy "faturamentos_authenticated_all" on public.faturamentos
  for all to authenticated using (true) with check (true);
create index if not exists idx_faturamentos_projeto on public.faturamentos(projeto_id);
create index if not exists idx_faturamentos_mes on public.faturamentos(mes_referencia);

-- Campos novos da Visão Geral do contrato + PQP-base
alter table public.contratos add column if not exists modalidade text
  check (modalidade is null or modalidade in ('Preço unitário','Global'));
alter table public.contratos add column if not exists origem text;
alter table public.contratos add column if not exists itens jsonb not null default '[]'::jsonb;

-- Medição de subcontrato: status simples (amplia o check para incluir 'Concluído')
alter table public.medicoes drop constraint if exists medicoes_status_check;
alter table public.medicoes add constraint medicoes_status_check
  check (status in ('Elaboração','Em Revisão','Em Aprovação','Aprovada','Paga','Rejeitada','Concluído'));
