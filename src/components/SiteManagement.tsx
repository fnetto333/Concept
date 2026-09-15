import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { EquipeSite, ConteudoSobre } from '@/lib/types';
import { Plus, Trash2, Save, Check, ArrowUp, ArrowDown, Pencil, UsersRound } from 'lucide-react';

export function TeamManagement() {
  const [team, setTeam] = useState<EquipeSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EquipeSite | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('equipe_site').select('*').order('ordem', { ascending: true });
    if (data) setTeam(data as EquipeSite[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async (data: Partial<EquipeSite>) => {
    if (editing?.id) {
      await supabase.from('equipe_site').update(data).eq('id', editing.id);
    } else {
      const maxOrdem = team.reduce((m, t) => Math.max(m, t.ordem), 0);
      await supabase.from('equipe_site').insert({ ...data, ordem: maxOrdem + 1, ativo: true });
    }
    setShowForm(false);
    setEditing(null);
    setSavedMsg(true);
    fetch();
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este membro da equipe?')) return;
    await supabase.from('equipe_site').delete().eq('id', id);
    fetch();
  };

  const moveOrder = async (item: EquipeSite, direction: 'up' | 'down') => {
    const sorted = [...team].sort((a, b) => a.ordem - b.ordem);
    const index = sorted.findIndex((t) => t.id === item.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const swapItem = sorted[swapIndex];
    await Promise.all([
      supabase.from('equipe_site').update({ ordem: swapItem.ordem }).eq('id', item.id),
      supabase.from('equipe_site').update({ ordem: item.ordem }).eq('id', swapItem.id),
    ]);
    fetch();
  };

  return (
    <>
      <div className="workspace-top">
        <div><span className="eyebrow">Gestão do site</span><h1>Equipe do site</h1></div>
        {savedMsg && <span className="saved-inline"><Check size={14} /> Salvo</span>}
      </div>
      <section className="budget-editor">
        <div className="stages-head">
          <div><span className="eyebrow">Membros ativos</span><h3>Pessoas que aparecem na página Sobre Nós</h3></div>
          <button className="text-button small-text" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={15} /> Adicionar membro</button>
        </div>
        {loading ? <p>Carregando...</p> : team.length === 0 ? <div className="empty-state"><p>Nenhum membro cadastrado.</p></div> : (
          <div className="team-mgmt-list">
            {team.map((member, i) => (
              <div className="team-mgmt-row" key={member.id}>
                <div className="team-mgmt-photo">{member.foto_url ? <img src={member.foto_url} alt={member.nome} /> : <div className="team-photo-placeholder">{member.nome.charAt(0)}</div>}</div>
                <div className="team-mgmt-info"><strong>{member.nome}</strong><span>{member.cargo}</span><small>{member.ativo ? 'Visível no site' : 'Oculto'}</small></div>
                <div className="team-mgmt-actions">
                  <button onClick={() => moveOrder(member, 'up')} disabled={i === 0}><ArrowUp size={16} /></button>
                  <button onClick={() => moveOrder(member, 'down')} disabled={i === team.length - 1}><ArrowDown size={16} /></button>
                  <button onClick={() => { setEditing(member); setShowForm(true); }}><Pencil size={16} /></button>
                  <button className="danger" onClick={() => handleDelete(member.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {showForm && <TeamForm member={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}
    </>
  );
}

function TeamForm({ member, onSave, onCancel }: { member: EquipeSite | null; onSave: (d: Partial<EquipeSite>) => void; onCancel: () => void }) {
  const [nome, setNome] = useState(member?.nome || '');
  const [cargo, setCargo] = useState(member?.cargo || '');
  const [foto_url, setFotoUrl] = useState(member?.foto_url || '');
  const [ativo, setAtivo] = useState(member?.ativo ?? true);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="insumo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="insumo-modal-head"><h2>{member ? 'Editar membro' : 'Novo membro'}</h2><button className="modal-close" onClick={onCancel}>×</button></div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ nome, cargo, foto_url, ativo }); }}>
          <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} required /></label>
          <label>Cargo<input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Arquiteta" required /></label>
          <label>URL da foto<input value={foto_url} onChange={(e) => setFotoUrl(e.target.value)} placeholder="https://..." /></label>
          {foto_url && <img src={foto_url} alt="Preview" className="photo-preview" />}
          <label className="check-label"><input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Visível no site</label>
          <div className="editor-actions"><button type="submit" className="button button-dark"><Save size={16} /> Salvar</button><button type="button" className="button button-outline" onClick={onCancel}>Cancelar</button></div>
        </form>
      </div>
    </div>
  );
}

export function SiteContentManagement() {
  const [conteudos, setConteudos] = useState<ConteudoSobre[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('conteudo_sobre').select('*').order('ordem', { ascending: true });
    if (data) setConteudos(data as ConteudoSobre[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateField = (id: string, field: keyof ConteudoSobre, value: string) => {
    setConteudos((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = async (item: ConteudoSobre) => {
    await supabase.from('conteudo_sobre').update({ titulo: item.titulo, paragrafo: item.paragrafo }).eq('id', item.id);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleAdd = async () => {
    const maxOrdem = conteudos.reduce((m, c) => Math.max(m, c.ordem), 0);
    const { data } = await supabase.from('conteudo_sobre').insert({ titulo: 'Novo parágrafo', paragrafo: 'Escreva aqui...', ordem: maxOrdem + 1 }).select().single();
    if (data) fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este texto?')) return;
    await supabase.from('conteudo_sobre').delete().eq('id', id);
    fetch();
  };

  return (
    <>
      <div className="workspace-top">
        <div><span className="eyebrow">Gestão do site</span><h1>Conteúdo do Sobre Nós</h1></div>
        {savedMsg && <span className="saved-inline"><Check size={14} /> Salvo</span>}
      </div>
      <section className="budget-editor">
        <div className="stages-head">
          <div><span className="eyebrow">Textos editáveis</span><h3>Parágrafos que aparecem na página Sobre Nós</h3></div>
          <button className="text-button small-text" onClick={handleAdd}><Plus size={15} /> Adicionar parágrafo</button>
        </div>
        {loading ? <p>Carregando...</p> : conteudos.map((c) => (
          <div className="content-edit-row" key={c.id}>
            <label>Título<input value={c.titulo} onChange={(e) => updateField(c.id, 'titulo', e.target.value)} /></label>
            <label>Parágrafo<textarea value={c.paragrafo} onChange={(e) => updateField(c.id, 'paragrafo', e.target.value)} rows={3} /></label>
            <div className="editor-actions"><button className="button button-dark" onClick={() => handleSave(c)}><Save size={16} /> Salvar</button><button className="row-action-btn danger" onClick={() => handleDelete(c.id)}><Trash2 size={16} /> Excluir</button></div>
          </div>
        ))}
      </section>
    </>
  );
}
