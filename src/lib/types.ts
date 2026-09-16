export type Colaborador = {
  id: string;
  nome: string;
  cargo: string;
  username: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Orcamento = {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string;
  endereco_obra: string;
  area_total: number;
  padrao: string;
  tipo_obra: string;
  cub_m2: number;
  valor_total: number;
  status: string;
  criado_por: string | null;
  criado_por_nome: string;
  bdi_percent: number;
  prazo_meses: number;
  created_at: string;
  updated_at: string;
};

export type OrcamentoEtapa = {
  id: string;
  orcamento_id: string;
  nome: string;
  percentual: number;
  valor: number;
  duracao_meses: number;
  ordem: number;
};

export type OrcamentoInsumo = {
  id: string;
  orcamento_id: string;
  etapa_nome: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
  tipo: string;
};

export type EquipeSite = {
  id: string;
  nome: string;
  cargo: string;
  foto_url: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
};

export type ConteudoSobre = {
  id: string;
  titulo: string;
  paragrafo: string;
  ordem: number;
  created_at: string;
};
