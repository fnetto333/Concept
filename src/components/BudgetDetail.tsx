import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Orcamento, OrcamentoEtapa, OrcamentoInsumo } from '@/lib/types';
import type { AuthState } from '@/lib/useAuth';
import { STATUS_OPTIONS, UNIDADES, INSUMO_TIPOS } from '@/lib/constants';
import { generateClientPDF, generateFuncionarioPDF } from '@/lib/pdf';
import { ArrowLeft, Save, FileDown, Plus, Trash2, Check, FileText, Download } from 'lucide-react';

export function BudgetDetail({ id, auth, onBack }: { id: string; auth: AuthState; onBack: () => void }) {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [etapas, setEtapas] = useState<OrcamentoEtapa[]>([]);
  const [insumos, setInsumos] = useState<OrcamentoInsumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [activeTab, setActiveTab] = useState<'etapas' | 'insumos'>('etapas');
  const [editingInsumo, setEditingInsumo] = useState<OrcamentoInsumo | null>(null);
  const [showInsumoForm, setShowInsumoForm] = useState(false);

  const fetchData = useCallback(async () => {
    const [orcRes, etapasRes, insumosRes] = await Promise.all([
      supabase.from('orcamentos').select('*').eq('id', id).maybeSingle(),
      supabase.from('orcamento_etapas').select('*').eq('orcamento_id', id).order('ordem', { ascending: true }),
      supabase.from('orcamento_insumos').select('*').eq('orcamento_id', id).order('etapa_nome', { ascending: true }),
    ]);
    if (orcRes.data) setOrcamento(orcRes.data as Orcamento);
    if (etapasRes.data) setEtapas(etapasRes.data as OrcamentoEtapa[]);
    if (insumosRes.data) setInsumos(insumosRes.data as OrcamentoInsumo[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateOrcamentoField = (field: keyof Orcamento, value: string | number) => {
    setOrcamento((prev) => prev ? { ...prev, [field]: value } : null);
    setSavedMsg(false);
  };

  const updateEtapa = (index: number, field: keyof OrcamentoEtapa, value: string) => {
    setEtapas((prev) => prev.map((e, i) => i === index ? { ...e, [field]: field === 'nome' ? value : Number(value) } : e));
    setSavedMsg(false);
  };

  const recalcEtapas = () => {
    if (!orcamento) return;
    const totalPct = etapas.reduce((s, e) => s + e.percentual, 0) || 1;
    const valorComBDI = Number(orcamento.valor_total);
    setEtapas((prev) => prev.map((e) => ({ ...e, valor: (e.percentual / totalPct) * valorComBDI })));
  };

  const handleSave = async () => {
    if (!orcamento) return;
    setSaving(true);
    recalcEtapas();
    const { error } = await supabase.from('orcamentos').update({
      cliente_nome: orcamento.cliente_nome,
      cliente_telefone: orcamento.cliente_telefone,
      cliente_email: orcamento.cliente_email,
      endereco_obra: orcamento.endereco_obra,
      area_total: orcamento.area_total,
      padrao: orcamento.padrao,
      tipo_obra: orcamento.tipo_obra,
      cub_m2: orcamento.cub_m2,
      valor_total: orcamento.valor_total,
      status: orcamento.status,
      bdi_percent: orcamento.bdi_percent,
      prazo_meses: orcamento.prazo_meses,
      criado_por_nome: orcamento.criado_por_nome || auth.colaborador?.nome || '',
    }).eq('id', orcamento.id);
    if (!error) {
      for (const etapa of etapas) {
        await supabase.from('orcamento_etapas').update({
          nome: etapa.nome,
          percentual: etapa.percentual,
          valor: etapa.valor,
          duracao_meses: etapa.duracao_meses,
        }).eq('id', etapa.id);
      }
      setSavedMsg(true);
    }
    setSaving(false);
  };

  const handleDeleteInsumo = async (insumoId: string) => {
    if (!confirm('Excluir este insumo?')) return;
    await supabase.from('orcamento_insumos').delete().eq('id', insumoId);
    setInsumos((prev) => prev.filter((i) => i.id !== insumoId));
  };

  const handleSaveInsumo = async (data: Partial<OrcamentoInsumo>) => {
    if (!orcamento) return;
    if (editingInsumo) {
      await supabase.from('orcamento_insumos').update(data).eq('id', editingInsumo.id);
    } else {
      await supabase.from('orcamento_insumos').insert({ ...data, orcamento_id: orcamento.id });
    }
    setShowInsumoForm(false);
    setEditingInsumo(null);
    fetchData();
  };

  if (loading) return <div className="workspace-top"><h1>Carregando...</h1></div>;
  if (!orcamento) return <div className="workspace-top"><h1>Orçamento não encontrado</h1><button className="text-button" onClick={onBack}><ArrowLeft size={16} /> Voltar</button></div>;

  return (
    <>
      <div className="workspace-top">
        <div><span className="eyebrow">Orçamento · {orcamento.cliente_nome}</span><h1>Editar orçamento</h1></div>
        <div className="detail-actions">
          <button className="text-button" onClick={onBack}><ArrowLeft size={16} /> Voltar à lista</button>
        </div>
      </div>

      <section className="budget-editor">
        <div className="detail-header">
          <div className="detail-header-left">
            <div className="status-selector">
              <span className="eyebrow">Status</span>
              <div className="status-buttons">
                {STATUS_OPTIONS.map((s) => <button key={s} className={`status-pill ${orcamento.status === s ? 'active' : ''}`} onClick={() => updateOrcamentoField('status', s)}>{s}</button>)}
              </div>
            </div>
          </div>
          <div className="detail-header-right">
            <button className="button button-outline" onClick={() => generateClientPDF(orcamento, etapas)}><FileText size={16} /> PDF Cliente</button>
            <button className="button button-outline" onClick={() => generateFuncionarioPDF(orcamento, etapas, insumos)}><Download size={16} /> PDF Funcionário</button>
            <button className="button button-dark" onClick={handleSave} disabled={saving}><Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}</button>
            {savedMsg && <span className="saved-inline"><Check size={14} /> Salvo</span>}
          </div>
        </div>

        <div className="form-section-title">Dados do cliente</div>
        <div className="form-grid">
          <label>Nome do cliente<input value={orcamento.cliente_nome} onChange={(e) => updateOrcamentoField('cliente_nome', e.target.value)} /></label>
          <label>Telefone<input value={orcamento.cliente_telefone} onChange={(e) => updateOrcamentoField('cliente_telefone', e.target.value)} /></label>
          <label>E-mail<input value={orcamento.cliente_email} onChange={(e) => updateOrcamentoField('cliente_email', e.target.value)} /></label>
          <label className="wide">Endereço da obra<input value={orcamento.endereco_obra} onChange={(e) => updateOrcamentoField('endereco_obra', e.target.value)} /></label>
        </div>

        <div className="form-section-title">Parâmetros</div>
        <div className="form-grid">
          <label>Tipo de obra<input value={orcamento.tipo_obra} onChange={(e) => updateOrcamentoField('tipo_obra', e.target.value)} /></label>
          <label>Área (m²)<input type="number" value={orcamento.area_total} onChange={(e) => updateOrcamentoField('area_total', Number(e.target.value))} /></label>
          <label>CUB / m²<input type="number" value={orcamento.cub_m2} onChange={(e) => updateOrcamentoField('cub_m2', Number(e.target.value))} /></label>
          <label>BDI (%)<input type="number" value={orcamento.bdi_percent} onChange={(e) => updateOrcamentoField('bdi_percent', Number(e.target.value))} /></label>
          <label>Prazo (meses)<input type="number" value={orcamento.prazo_meses} onChange={(e) => updateOrcamentoField('prazo_meses', Number(e.target.value))} /></label>
        </div>

        <div className="calculation-summary">
          <div><span>Valor total</span><strong>{formatBRL(Number(orcamento.valor_total))}</strong></div>
          <div className="summary-divider" />
          <div><span>Criado por</span><strong>{orcamento.criado_por_nome || '—'}</strong></div>
          <div className="summary-divider" />
          <div><span>Atualizado</span><strong>{new Date(orcamento.updated_at).toLocaleDateString('pt-BR')}</strong></div>
        </div>

        <div className="detail-tabs">
          <button className={activeTab === 'etapas' ? 'active' : ''} onClick={() => setActiveTab('etapas')}>Etapas</button>
          <button className={activeTab === 'insumos' ? 'active' : ''} onClick={() => setActiveTab('insumos')}>Insumos e materiais</button>
        </div>

        {activeTab === 'etapas' && (
          <div className="stages-list">
            <div className="stage-row stage-header"><span>Etapa</span><span>Percentual</span><span>Duração</span><span>Valor</span></div>
            {etapas.map((etapa, i) => (
              <div className="stage-row stage-editable" key={etapa.id}>
                <input className="stage-name-input" value={etapa.nome} onChange={(e) => updateEtapa(i, 'nome', e.target.value)} />
                <div className="stage-input-group"><input type="number" className="stage-num-input" value={etapa.percentual} onChange={(e) => updateEtapa(i, 'percentual', e.target.value)} /><span>%</span></div>
                <div className="stage-input-group"><input type="number" className="stage-num-input" value={etapa.duracao_meses} onChange={(e) => updateEtapa(i, 'duracao_meses', e.target.value)} /><span>mês</span></div>
                <strong>{formatBRL(Number(etapa.valor))}</strong>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'insumos' && (
          <div className="insumos-section">
            <div className="stages-head">
              <div><span className="eyebrow">Composição detalhada</span><h3>Insumos e materiais</h3></div>
              <button className="text-button small-text" onClick={() => { setEditingInsumo(null); setShowInsumoForm(true); }}><Plus size={15} /> Adicionar insumo</button>
            </div>
            {insumos.length === 0 ? (
              <div className="empty-state"><p>Nenhum insumo cadastrado. Clique em "Adicionar insumo" para começar.</p></div>
            ) : (
              <div className="insumos-table">
                <div className="insumo-row insumo-header"><span>Etapa</span><span>Descrição</span><span>Tipo</span><span>Un.</span><span>Qtd.</span><span>Custo Unit.</span><span>Custo Total</span><span></span></div>
                {insumos.map((insumo) => (
                  <div className="insumo-row insumo-body" key={insumo.id}>
                    <span>{insumo.etapa_nome}</span>
                    <span>{insumo.descricao}</span>
                    <span className={`insumo-type ${insumo.tipo === 'Material' ? 'mat' : 'mob'}`}>{insumo.tipo}</span>
                    <span>{insumo.unidade}</span>
                    <span>{insumo.quantidade}</span>
                    <span>{formatBRL(Number(insumo.custo_unitario))}</span>
                    <strong>{formatBRL(Number(insumo.custo_total))}</strong>
                    <div className="budget-row-actions">
                      <button className="row-action-btn" onClick={() => { setEditingInsumo(insumo); setShowInsumoForm(true); }}>Editar</button>
                      <button className="row-action-btn danger" onClick={() => handleDeleteInsumo(insumo.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {showInsumoForm && (
        <InsumoForm
          insumo={editingInsumo}
          etapas={etapas.map((e) => e.nome)}
          onSave={handleSaveInsumo}
          onCancel={() => { setShowInsumoForm(false); setEditingInsumo(null); }}
        />
      )}
    </>
  );
}

function InsumoForm({ insumo, etapas, onSave, onCancel }: {
  insumo: OrcamentoInsumo | null;
  etapas: string[];
  onSave: (data: Partial<OrcamentoInsumo>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    etapa_nome: insumo?.etapa_nome || etapas[0] || '',
    descricao: insumo?.descricao || '',
    tipo: insumo?.tipo || 'Material',
    unidade: insumo?.unidade || 'm²',
    quantidade: String(insumo?.quantidade || 1),
    custo_unitario: String(insumo?.custo_unitario || 0),
  });

  const custoTotal = (Number(form.quantidade) || 0) * (Number(form.custo_unitario) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      etapa_nome: form.etapa_nome,
      descricao: form.descricao,
      tipo: form.tipo,
      unidade: form.unidade,
      quantidade: Number(form.quantidade) || 0,
      custo_unitario: Number(form.custo_unitario) || 0,
      custo_total: custoTotal,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="insumo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="insumo-modal-head">
          <h2>{insumo ? 'Editar insumo' : 'Novo insumo'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Etapa<select value={form.etapa_nome} onChange={(e) => setForm((f) => ({ ...f, etapa_nome: e.target.value }))}>{etapas.map((e) => <option key={e}>{e}</option>)}</select></label>
          <label>Descrição<input value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Ex.: Cimento CP-II 50kg" required /></label>
          <div className="insumo-form-row">
            <label>Tipo<select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>{INSUMO_TIPOS.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label>Unidade<select value={form.unidade} onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</select></label>
          </div>
          <div className="insumo-form-row">
            <label>Quantidade<input type="number" step="0.01" value={form.quantidade} onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))} required /></label>
            <label>Custo unitário (R$)<input type="number" step="0.01" value={form.custo_unitario} onChange={(e) => setForm((f) => ({ ...f, custo_unitario: e.target.value }))} required /></label>
          </div>
          <div className="insumo-total">Custo total: <strong>{formatBRL(custoTotal)}</strong></div>
          <div className="editor-actions">
            <button type="submit" className="button button-dark"><Save size={16} /> Salvar insumo</button>
            <button type="button" className="button button-outline" onClick={onCancel}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
