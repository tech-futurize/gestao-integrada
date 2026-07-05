import { supabase } from '@/lib/supabaseClient';

const TABLE_MAP = {
  Projeto: 'projetos',
  Registro: 'registros',
  Pleito: 'pleitos',
  PleitoVinculo: 'pleito_vinculos',
  Acao: 'acoes',
  Financeiro: 'financeiros',
  Histograma: 'histogramas',
  AvancoFisico: 'avanco_fisico',
  MudancaContratual: 'mudancas_contratuais',
  Contrato: 'contratos',
  Medicao: 'medicoes',
  Aditivo: 'aditivos',
  Faturamento: 'faturamentos',
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
  PacoteSuprimento: 'pacotes_suprimento',
  CategoriaImpacto: 'categorias_impacto',
  Agente: 'agentes',
  AgenteTool: 'agente_tools',
  AgenteToolLink: 'agente_tool_links',
  AgenteUsoLog: 'agente_uso_logs',
  ModeloPreco: 'modelo_precos',
  ProviderConfig: 'provider_configs',
  FormularioDigital:  'formularios_digitais',
  FormularioResposta: 'formulario_respostas',
};

// Tabelas sem coluna created_at (junções) precisam de outra coluna de ordenação
const ORDER_COLUMN_OVERRIDES = {
  agente_tool_links: 'agente_id',
};

// PostgREST limita cada resposta a 1000 linhas — blocos deste tamanho na paginação interna
const PAGE_CHUNK = 1000;

function createEntityClient(tableName) {
  return {
    async list(filters = {}, { page = null, pageSize = null } = {}) {
      const orderColumn = ORDER_COLUMN_OVERRIDES[tableName] ?? 'created_at';
      const buildQuery = (from, to) => {
        let query = supabase
          .from(tableName)
          .select('*')
          .order(orderColumn, { ascending: false });

        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        }

        return query.range(from, to);
      };

      if (pageSize !== null) {
        const start = (page ?? 0) * pageSize;
        const { data, error } = await buildQuery(start, start + pageSize - 1);
        if (error) throw new Error(error.message);
        return data ?? [];
      }

      // Sem paginação explícita: busca em blocos até a página vir incompleta,
      // senão listas com >1000 linhas seriam truncadas silenciosamente
      const all = [];
      for (let offset = 0; ; offset += PAGE_CHUNK) {
        const { data, error } = await buildQuery(offset, offset + PAGE_CHUNK - 1);
        if (error) throw new Error(error.message);
        all.push(...(data ?? []));
        if (!data || data.length < PAGE_CHUNK) break;
      }
      return all;
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
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw new Error(error.message);
      // RLS pode negar silenciosamente (0 linhas afetadas, sem erro) — sem esta checagem
      // a UI mostraria toast de sucesso e o registro reapareceria no refetch
      if (!data || data.length === 0) {
        throw new Error('Nenhum registro foi excluído — ele pode já ter sido removido ou você não tem permissão.');
      }
    },
  };
}

export const entities = Object.fromEntries(
  Object.entries(TABLE_MAP).map(([entityName, tableName]) => [
    entityName,
    createEntityClient(tableName),
  ])
);
