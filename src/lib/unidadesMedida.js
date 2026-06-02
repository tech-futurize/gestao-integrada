/**
 * Fonte única de unidades de medida do sistema.
 * Consumida por todos os módulos: Suprimentos, Take Off, Medições, Configurações.
 *
 * Para adicionar ou remover uma unidade, edite esta lista e faça deploy.
 * Não há persistência em banco — a lista é global e idêntica para todos os usuários.
 */
export const UNIDADES_MEDIDA = [
  { sigla: "un",  nome: "Unidade" },
  { sigla: "m",   nome: "Metro" },
  { sigla: "m²",  nome: "Metro quadrado" },
  { sigla: "m³",  nome: "Metro cúbico" },
  { sigla: "kg",  nome: "Quilograma" },
  { sigla: "ton", nome: "Tonelada" },
  { sigla: "l",   nome: "Litro" },
  { sigla: "hr",  nome: "Hora" },
];

/** Apenas as siglas — para selects e filtros simples. */
export const UNIDADE_SIGLAS = UNIDADES_MEDIDA.map((u) => u.sigla);

/** Rótulo padrão de cabeçalho de coluna de unidade em todo o sistema. */
export const UNIDADE_COLUMN_LABEL = "Und";
