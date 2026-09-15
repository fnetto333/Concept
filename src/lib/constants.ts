export const DEFAULT_CUB = 3190;

export const PADRAO_MULTIPLIER: Record<string, number> = {
  Baixo: 0.75,
  Normal: 1.0,
  Alto: 1.29,
};

export const TIPOS_OBRA = [
  'Casa térrea',
  'Sobrado',
  'Edifício residencial',
  'Reforma',
  'Comercial',
  'Galpão',
];

export const PADROES = ['Baixo', 'Normal', 'Alto'];

export const STATUS_OPTIONS = ['Rascunho', 'Enviado', 'Aprovado'];

export const UNIDADES = ['m²', 'm³', 'm', 'kg', 'un', 'h', 'dia', 'serviço'];

export const INSUMO_TIPOS = ['Material', 'Mão de obra'];

export const DEFAULT_ETAPAS = [
  { nome: 'Serviços preliminares', percentual: 4, duracao_meses: 1 },
  { nome: 'Fundação e estrutura', percentual: 18, duracao_meses: 2 },
  { nome: 'Alvenaria e cobertura', percentual: 18, duracao_meses: 2 },
  { nome: 'Instalações', percentual: 16, duracao_meses: 2 },
  { nome: 'Revestimentos', percentual: 20, duracao_meses: 2 },
  { nome: 'Esquadrias e acabamentos', percentual: 18, duracao_meses: 2 },
  { nome: 'Entrega e limpeza', percentual: 6, duracao_meses: 1 },
];

export const ADMIN_CREATION_PASSWORD = 'concept2026';
