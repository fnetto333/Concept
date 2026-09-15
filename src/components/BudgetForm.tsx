import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthState } from '@/lib/useAuth';
import { DEFAULT_CUB, DEFAULT_ETAPAS, PADRAO_MULTIPLIER, PADROES, TIPOS_OBRA } from '@/lib/constants';
import { Check, ArrowLeft, Save } from 'lucide-react';

export function BudgetForm({ auth, onSaved, onCancel }: {
  auth: AuthState;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_email: '',
    endereco_obra: '',
    area_total: '120',
    padrao: 'Normal',
    tipo_obra: 'Casa térrea',
    cub_m2: String(DEFAULT_CUB),
    bdi_percent: '0',
    prazo_meses: '12',
  });
  const [etapas, setEtapas] = useState(DEFAULT_ETAPAS.map((e, i) => ({ ...e, ordem: i })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valorBase = useMemo(() => {
    const area = Number(form.area_total) || 0;
    const cub = Number(form.cub_m2) || 0;
    return area * cub;
  }, [form.area_total, form.cub_m2]);

  const valorComPadrao = useMemo(() => {
    return valorBase * (PADRAO_MULTIPLIER[form.padrao] ?? 1);
  }, [valorBase, form.padrao]);

  const valorComBDI = useMemo(() => {
    return valorComPadrao * (1 + (Number(form.bdi_percent) || 0) / 100);
  }, [valorComPadrao, form.bdi_percent]);

  const etapasCalculadas = useMemo(() => {
    const totalPercent = etapas.reduce((s, e) => s + e.percentual, 0) || 1;
    return etapas.map((e) => ({
      ...e,
      valor: (e.percentual / totalPercent) * valorComBDI,
    }));
  }, [etapas, valorComBDI]);

  const updateForm = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const updateEtapa = (index: number, field: string, value: string) => {
    setEtapas((prev) => prev.map((e, i) => i === index ? { ...e, [field]: field === 'nome' ? value : Number(value) } : e));
  };
  const addEtapa = () => setEtapas((prev) => [...prev, { nome: 'Nova etapa', percentual: 0, duracao_meses: 1, ordem: prev.length }]);
  const removeEtapa = (index: number) => setEtapas((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!form.cliente_nome.trim()) { setError('Informe o nome do cliente'); return; }
    setSaving(true);
    setError(null);

    const orcamentoData = {
      cliente_nome: form.cliente_nome,
      cliente_telefone: form.cliente_telefone,
      cliente_email: form.cliente_email,
      endereco_obra: form.endereco_obra,
      area_total: Number(form.area_total) || 0,
      padrao: form.padrao,
      tipo_obra: form.tipo_obra,
      cub_m2: Number(form.cub_m2) || 0,
      valor_total: valorComBDI,
      status: 'Rascunho',
      criado_por: auth.user?.id ?? null,
      criado_por_nome: auth.colaborador?.nome ?? '',
      bdi_percent: Number(form.bdi_percent) || 0,
      prazo_meses: Number(form.prazo_meses) || 12,
    };

    const { data, error: insertErr } = await supabase.from('orcamentos').insert(orcamentoData).select().single();
    if (insertErr) { setError(insertErr.message); setSaving(false); return; }

    const etapasData = etapasCalculadas.map((e, i) => ({
      orcamento_id: data.id,
      nome: e.nome,
      percentual: e.percentual,
      valor: e.valor,
      duracao_meses: e.duracao_meses,
      ordem: i,
    }));
    await supabase.from('orcamento_etapas').insert(etapasData);

    setSaving(false);
    onSaved(data.id);
  };

  return (
    <>
      <div className="workspace-top">
        <div><span className="eyebrow">Nova estimativa</span><h1>Calculadora de obra</h1></div>
        <button className="text-button" onClick={onCancel}><ArrowLeft size={16} /> Voltar</button>
      </div>
      <section className="budget-editor">
        {error && <div className="form-error">{error}</div>}
        <div className="form-section-title">Dados do cliente</div>
        <div className="form-grid">
          <label>Nome do cliente<input value={form.cliente_nome} onChange={(e) => updateForm('cliente_nome', e.target.value)} placeholder="Ex.: Família Oliveira" /></label>
          <label>Telefone<input value={form.cliente_telefone} onChange={(e) => updateForm('cliente_telefone', e.target.value)} placeholder="(11) 99999-9999" /></label>
          <label>E-mail<input type="email" value={form.cliente_email} onChange={(e) => updateForm('cliente_email', e.target.value)} placeholder="cliente@email.com" /></label>
          <label className="wide">Endereço da obra<input value={form.endereco_obra} onChange={(e) => updateForm('endereco_obra', e.target.value)} placeholder="Rua, número · Cidade / UF" /></label>
        </div>
        <div className="form-section-title">Parâmetros da obra</div>
        <div className="form-grid">
          <label>Tipo de obra<select value={form.tipo_obra} onChange={(e) => updateForm('tipo_obra', e.target.value)}>{TIPOS_OBRA.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>Área total (m²)<input type="number" value={form.area_total} onChange={(e) => updateForm('area_total', e.target.value)} /></label>
          <label>Padrão construtivo<select value={form.padrao} onChange={(e) => updateForm('padrao', e.target.value)}>{PADROES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>CUB / m² (R$)<input type="number" value={form.cub_m2} onChange={(e) => updateForm('cub_m2', e.target.value)} /></label>
          <label>BDI / Lucro (%)<input type="number" value={form.bdi_percent} onChange={(e) => updateForm('bdi_percent', e.target.value)} /></label>
          <label>Prazo (meses)<input type="number" value={form.prazo_meses} onChange={(e) => updateForm('prazo_meses', e.target.value)} /></label>
        </div>
        <div className="calculation-summary">
          <div><span>Valor base (área × CUB)</span><strong>{formatBRL(valorBase)}</strong><small>Sem ajuste de padrão</small></div>
          <div className="summary-divider" />
          <div><span>Valor com padrão {form.padrao}</span><strong>{formatBRL(valorComPadrao)}</strong><small>× {PADRAO_MULTIPLIER[form.padrao]}</small></div>
          <div className="summary-divider" />
          <div><span>Valor total com BDI</span><strong>{formatBRL(valorComBDI)}</strong><small>+{form.bdi_percent}%</small></div>
        </div>
        <div className="stages-head">
          <div><span className="eyebrow">Composição estimada</span><h3>Etapas da obra</h3></div>
          <button className="text-button small-text" onClick={addEtapa}>+ Adicionar etapa</button>
        </div>
        <div className="stages-list">
          <div className="stage-row stage-header"><span>Etapa</span><span>Percentual</span><span>Duração</span><span>Valor</span></div>
          {etapasCalculadas.map((etapa, i) => (
            <div className="stage-row stage-editable" key={i}>
              <input className="stage-name-input" value={etapa.nome} onChange={(e) => updateEtapa(i, 'nome', e.target.value)} />
              <div className="stage-input-group"><input type="number" className="stage-num-input" value={etapa.percentual} onChange={(e) => updateEtapa(i, 'percentual', e.target.value)} /><span>%</span></div>
              <div className="stage-input-group"><input type="number" className="stage-num-input" value={etapa.duracao_meses} onChange={(e) => updateEtapa(i, 'duracao_meses', e.target.value)} /><span>mês</span></div>
              <strong>{formatBRL(etapa.valor)}</strong>
              {etapas.length > 1 && <button className="stage-remove" onClick={() => removeEtapa(i)}>×</button>}
            </div>
          ))}
        </div>
        <div className="editor-actions">
          <button className="button button-dark" onClick={handleSave} disabled={saving}><Save size={16} /> {saving ? 'Salvando...' : 'Salvar orçamento'}</button>
          <button className="button button-outline" onClick={onCancel}>Cancelar</button>
        </div>
      </section>
    </>
  );
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
