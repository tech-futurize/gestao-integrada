import { supabase } from '@/lib/supabaseClient';

const TABLE_MAP = {
  Projeto: 'projetos',
  DocumentoContratual: 'documentos_contratuais',
  Incidente: 'incidentes',
  Caso: 'casos',
  Acao: 'acoes',
  Engenharia: 'engenharias',
  Financeiro: 'financeiros',
  Recurso: 'recursos',
  Histograma: 'histogramas',
  AvancoFisico: 'avanco_fisico',
  MudancaContratual: 'mudancas_contratuais',
  Contrato: 'contratos',
  Medicao: 'medicoes',
  Aditivo: 'aditivos',
  RequisicaoCompra: 'requisicoes_compra',
  Cotacao: 'cotacoes',
  TarefaCronograma: 'tarefas_cronograma',
  Relacionamento: 'relacionamentos',
  Rotina: 'rotinas',
  Ruido: 'ruidos',
  Commodity: 'commodities',
  LancamentoCommodity: 'lancamentos_commodity',
  RNC: 'rncs',
  ItemMAS: 'itens_mas',
  DocumentoEngenharia: 'documentos_engenharia',
  LicaoAprendida: 'licoes_aprendidas',
  AtaReuniao: 'atas_reuniao',
  Item6WLA: 'itens_6wla',
  Risco: 'riscos',
  ItemTakeOff: 'itens_takeof',
};

function createEntityClient(tableName) {
  return {
    async list(filters = {}) {
      let query = supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async filter(filters = {}) {
      return this.list(filters);
    },

    async create(data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return result;
    },

    async update(id, data) {
      const { id: _id, created_at, ...payload } = data;
      const { data: result, error } = await supabase
        .from(tableName)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return result;
    },

    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
  };
}

export const entities = Object.fromEntries(
  Object.entries(TABLE_MAP).map(([entityName, tableName]) => [
    entityName,
    createEntityClient(tableName),
  ])
);
