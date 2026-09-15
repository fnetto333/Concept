import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Orcamento, Colaborador } from '@/lib/types';
import type { AuthState } from '@/lib/useAuth';
import { BudgetForm } from '@/components/BudgetForm';
import { BudgetList } from '@/components/BudgetList';
import { BudgetDetail } from '@/components/BudgetDetail';
import { TeamManagement, SiteContentManagement } from '@/components/SiteManagement';
import { UserManagement } from '@/components/UserManagement';
import {
  BarChart3, ClipboardList, UsersRound, Pencil,
  Check, ArrowUpRight, Plus, Home, LogOut, ChevronDown,
  TrendingUp,
} from 'lucide-react';

type WorkspaceView = 'dashboard' | 'new-budget' | 'budgets' | 'budget-detail' | 'team' | 'site-content' | 'users';

export function Workspace({
  auth, onSignOut, onNavigateHome,
}: {
  auth: AuthState;
  onSignOut: () => void;
  onNavigateHome: () => void;
}) {
  const [view, setView] = useState<WorkspaceView>('dashboard');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Orcamento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  const fetchBudgets = useCallback(async () => {
    const { data } = await supabase.from('orcamentos').select('*').order('created_at', { ascending: false });
    if (data) setBudgets(data as Orcamento[]);
  }, []);

  const fetchColaboradores = useCallback(async () => {
    const { data } = await supabase.from('colaboradores').select('*').order('nome', { ascending: true });
    if (data) setColaboradores(data as Colaborador[]);
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchColaboradores();
  }, [fetchBudgets, fetchColaboradores]);

  const openBudgetDetail = (id: string) => {
    setEditingBudgetId(id);
    setView('budget-detail');
  };

  const navItems: { view: WorkspaceView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { view: 'dashboard', label: 'Visão geral', icon: <BarChart3 size={17} /> },
    { view: 'new-budget', label: 'Novo orçamento', icon: <Plus size={17} /> },
    { view: 'budgets', label: 'Meus orçamentos', icon: <ClipboardList size={17} />, badge: String(budgets.length) },
  ];

  const mgmtItems: { view: WorkspaceView; label: string; icon: React.ReactNode }[] = [
    { view: 'team', label: 'Equipe do site', icon: <UsersRound size={17} /> },
    { view: 'site-content', label: 'Conteúdo do site', icon: <Pencil size={17} /> },
  ];

  if (auth.colaborador?.is_admin) {
    mgmtItems.push({ view: 'users', label: 'Colaboradores', icon: <ChevronDown size={17} /> });
  }

  const initials = auth.colaborador?.nome?.split(' ').map((w: string) => w[0]).slice(0, 2).join('') ?? '??';

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <button className="workspace-logo" onClick={onNavigateHome}><img src="/images/WhatsApp_Image_2026-09-14_at_15.13.25.jpeg" alt="Concept" /></button>
        <div className="workspace-user">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{auth.colaborador?.nome ?? 'Usuário'}</strong>
            <span>{auth.colaborador?.cargo}</span>
          </div>
        </div>
        <nav>
          <span>Menu principal</span>
          {navItems.map((item) => (
            <button key={item.view} className={view === item.view ? 'current' : ''} onClick={() => { setView(item.view); setEditingBudgetId(null); }}>
              {item.icon} {item.label} {item.badge && <b>{item.badge}</b>}
            </button>
          ))}
          <span>Gerenciamento</span>
          {mgmtItems.map((item) => (
            <button key={item.view} className={view === item.view ? 'current' : ''} onClick={() => { setView(item.view); setEditingBudgetId(null); }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button className="exit-workspace" onClick={onSignOut}>Sair da área interna <LogOut size={16} /></button>
      </aside>
      <main className="workspace-main">
        {view === 'dashboard' && <Dashboard auth={auth} budgets={budgets} onNavigate={setView} onOpenBudget={openBudgetDetail} onNewBudget={() => setView('new-budget')} />}
        {view === 'new-budget' && <BudgetForm auth={auth} onSaved={(id) => { fetchBudgets(); openBudgetDetail(id); }} onCancel={() => setView('dashboard')} />}
        {view === 'budgets' && <BudgetList budgets={budgets} onOpen={openBudgetDetail} onRefresh={fetchBudgets} />}
        {view === 'budget-detail' && editingBudgetId && <BudgetDetail id={editingBudgetId} auth={auth} onBack={() => { setView('budgets'); fetchBudgets(); }} />}
        {view === 'team' && <TeamManagement />}
        {view === 'site-content' && <SiteContentManagement />}
        {view === 'users' && <UserManagement auth={auth} onRefresh={fetchColaboradores} />}
      </main>
    </div>
  );
}

function Dashboard({ auth, budgets, onNavigate, onOpenBudget, onNewBudget }: {
  auth: AuthState; budgets: Orcamento[];
  onNavigate: (v: WorkspaceView) => void; onOpenBudget: (id: string) => void; onNewBudget: () => void;
}) {
  const aprovados = budgets.filter(b => b.status === 'Aprovado').length;
  const rascunhos = budgets.filter(b => b.status === 'Rascunho').length;
  const enviados = budgets.filter(b => b.status === 'Enviado').length;
  const valorTotal = budgets.reduce((s, b) => s + Number(b.valor_total), 0);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  return (
    <>
      <div className="workspace-top">
        <div>
          <span className="eyebrow">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1>{greeting}, {auth.colaborador?.nome?.split(' ')[0]}.</h1>
        </div>
      </div>
      <div className="workspace-stats">
        <StatCard label="Orçamentos ativos" value={String(budgets.length)} note={`${rascunhos} rascunhos`} icon={<ClipboardList />} />
        <StatCard label="Aprovados" value={String(aprovados)} note={`${enviados} enviados`} icon={<Check />} />
        <StatCard label="Valor total" value={formatShortBRL(valorTotal)} note="Em orçamentos" icon={<TrendingUp />} />
      </div>
      <div className="workspace-grid">
        <section className="budget-editor">
          <div className="workspace-section-head">
            <div><span className="eyebrow">Acesso rápido</span><h2>Criar orçamento</h2></div>
          </div>
          <div className="quick-action" onClick={onNewBudget}>
            <div className="quick-action-icon"><Plus /></div>
            <div><strong>Novo orçamento</strong><p>Comece uma nova estimativa baseada no CUB</p></div>
            <ArrowUpRight size={20} />
          </div>
        </section>
        <section className="recent-budgets">
          <div className="workspace-section-head">
            <div><span className="eyebrow">Histórico</span><h2>Orçamentos recentes</h2></div>
            <button className="text-button small-text" onClick={() => onNavigate('budgets')}>Ver todos <ArrowUpRight size={15} /></button>
          </div>
          {budgets.length === 0 ? (
            <div className="empty-state"><p>Nenhum orçamento cadastrado ainda.</p></div>
          ) : budgets.slice(0, 5).map((b) => (
            <div className="budget-item" key={b.id} onClick={() => onOpenBudget(b.id)}>
              <div className="budget-item-icon"><Home size={16} /></div>
              <div><strong>{b.cliente_nome || 'Sem nome'}</strong><span>{new Date(b.created_at).toLocaleDateString('pt-BR')}</span></div>
              <div className="budget-item-value"><strong>{formatShortBRL(Number(b.valor_total))}</strong><span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span></div>
              <ArrowUpRight size={16} />
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function formatShortBRL(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)} mi`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`;
  return `R$ ${value.toFixed(0)}`;
}
