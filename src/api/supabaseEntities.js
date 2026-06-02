import { supabase } from '@/lib/supabaseClient';

const TABLE_MAP = {
  Projeto: 'projetos',
  Registro: 'registros',
  Pleito: 'pleitos',
  Acao: 'acoes',
  Financeiro: 'financeiros',
  Histograma: 'histogramas',
  AvancoFisico: 'avanco_fisico',
  MudancaContratual: 'mudancas_contratuais',
  Contrato: 'contratos',
  Medicao: 'medicoes',
  Aditivo: 'aditivos',
  TarefaCronograma: 'atividades_cronograma',
  Commodity: 'commodities',
  LancamentoCommodity: 'lancamentos_commodity',
  ItemMAS: 'itens_mas',
  DocumentoEngenharia: 'documentos_engenharia',
  Item6WLA: 'itens_6wla',
  Risco: 'riscos',
  Usuario: 'usuarios',
  PermissaoUsuario: 'permissoes_usuario',
  Rdo: 'rdo',
  UnidadeMedida: 'unidades_medida',
  Disciplina: 'disciplinas',
  Funcao: 'funcoes',
  TipoEquipamento: 'tipos_equipamento',
};

function createEntityClient(tableName) {
  return {
    async list(filters = {}, { page = null, pageSize = null } = {}) {
      let query = supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      }

      if (page !== null && pageSize !== null) {
        query = query.range(page * pageSize, (page + 1) * pageSize - 1);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async filter(filters = {}) {
      return this.list(filters);
    },

    async count(filters = {}) {
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      }

      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return count ?? 0;
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
      // eslint-disable-next-line no-unused-vars
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
