import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Orcamento } from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/constants';
import { ArrowUpRight, Home, Trash2, ArrowLeft, Search } from 'lucide-react';

export function BudgetList({ budgets, onOpen, onRefresh }: {
  budgets: Orcamento[];
  onOpen: (id: string) => void;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = budgets.filter((b) => {
    const matchesSearch = b.cliente_nome.toLowerCase().includes(search.toLowerCase())
      || b.endereco_obra.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || b.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir este orçamento?')) return;
    await supabase.from('orcamentos').delete().eq('id', id);
    onRefresh();
  };

  return (
    <>
      <div className="workspace-top">
        <div><span className="eyebrow">Histórico completo</span><h1>Meus orçamentos</h1></div>
      </div>
      <section className="budget-editor">
        <div className="list-filters">
          <div className="search-box"><Search size={16} /><input placeholder="Buscar por cliente ou endereço..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos os status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><p>Nenhum orçamento encontrado.</p></div>
        ) : (
          <div className="budget-table">
            <div className="budget-table-row budget-table-header">
              <span>Cliente</span><span>Tipo</span><span>Área</span><span>Valor</span><span>Status</span><span>Data</span><span></span>
            </div>
            {filtered.map((b) => (
              <div className="budget-table-row budget-table-body" key={b.id} onClick={() => onOpen(b.id)}>
                <div className="budget-client-cell"><div className="budget-item-icon"><Home size={16} /></div><div><strong>{b.cliente_nome || 'Sem nome'}</strong><small>{b.criado_por_nome && `por ${b.criado_por_nome}`}</small></div></div>
                <span>{b.tipo_obra}</span>
                <span>{b.area_total} m²</span>
                <strong>{formatBRL(Number(b.valor_total))}</strong>
                <span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span>
                <small>{new Date(b.created_at).toLocaleDateString('pt-BR')}</small>
                <div className="budget-row-actions">
                  <button className="row-action-btn" onClick={(e) => { e.stopPropagation(); onOpen(b.id); }}><ArrowUpRight size={16} /></button>
                  <button className="row-action-btn danger" onClick={(e) => handleDelete(b.id, e)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}
