import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Colaborador } from '@/lib/types';
import type { AuthState } from '@/lib/useAuth';
import { ADMIN_CREATION_PASSWORD } from '@/lib/constants';
import { Plus, Save, Check, ShieldCheck } from 'lucide-react';

export function UserManagement({ auth, onRefresh }: { auth: AuthState; onRefresh: () => void }) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchColabs = useCallback(async () => {
    const { data } = await supabase.from('colaboradores').select('*').order('nome', { ascending: true });
    if (data) setColaboradores(data as Colaborador[]);
    onRefresh();
  }, [onRefresh]);

  useEffect(() => { fetchColabs(); }, [fetchColabs]);

  const handleCreate = async (formData: { email: string; password: string; nome: string; cargo: string; is_admin: boolean; confirmPassword: string }) => {
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) { setError('Sessão expirada'); return; }

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        nome: formData.nome,
        cargo: formData.cargo,
        is_admin: formData.is_admin,
      }),
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      setError(result.error || 'Erro ao criar usuário');
      return;
    }
    setShowForm(false);
    setSavedMsg(true);
    fetchColabs();
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <>
      <div className="workspace-top">
        <div><span className="eyebrow">Administração</span><h1>Colaboradores</h1></div>
        {savedMsg && <span className="saved-inline"><Check size={14} /> Criado com sucesso</span>}
      </div>
      <section className="budget-editor">
        <div className="stages-head">
          <div><span className="eyebrow">Usuários do sistema</span><h3>Colaboradores com acesso à área interna</h3></div>
          <button className="text-button small-text" onClick={() => setShowForm(true)}><Plus size={15} /> Novo colaborador</button>
        </div>
        <div className="users-list">
          {colaboradores.map((c) => (
            <div className="user-row" key={c.id}>
              <div className="user-avatar">{c.nome.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
              <div className="user-info"><strong>{c.nome}</strong><span>{c.cargo}</span></div>
              {c.is_admin && <span className="admin-badge"><ShieldCheck size={13} /> Admin</span>}
              <small>{c.id === auth.user?.id ? 'Você' : ''}</small>
            </div>
          ))}
        </div>
      </section>
      {showForm && <UserForm onCreate={handleCreate} onCancel={() => { setShowForm(false); setError(null); }} error={error} />}
    </>
  );
}

function UserForm({ onCreate, onCancel, error }: {
  onCreate: (d: { email: string; password: string; nome: string; cargo: string; is_admin: boolean; confirmPassword: string }) => void;
  onCancel: () => void;
  error: string | null;
}) {
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [is_admin, setIsAdmin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== ADMIN_CREATION_PASSWORD) {
      alert('Senha de confirmação incorreta. Use a senha de administrador principal.');
      return;
    }
    const email = `${username.trim()}@concept.com.br`;
    onCreate({ email, password, nome, cargo, is_admin, confirmPassword });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="insumo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="insumo-modal-head"><h2>Novo colaborador</h2><button className="modal-close" onClick={onCancel}>×</button></div>
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <label>Nome completo<input value={nome} onChange={(e) => setNome(e.target.value)} required /></label>
          <label>Cargo<input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Arquiteta" required /></label>
          <label>Usuário<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: marina.costa" required /></label>
          <div className="insumo-form-row">
            <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            <label>Confirmar senha<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></label>
          </div>
          <label className="check-label"><input type="checkbox" checked={is_admin} onChange={(e) => setIsAdmin(e.target.checked)} /> Este usuário é administrador (pode criar outros logins)</label>
          <div className="admin-confirm">
            <label>Senha de confirmação (admin)<input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Senha principal do sistema" required /></label>
          </div>
          <div className="editor-actions"><button type="submit" className="button button-dark"><Save size={16} /> Criar colaborador</button><button type="button" className="button button-outline" onClick={onCancel}>Cancelar</button></div>
        </form>
      </div>
    </div>
  );
}
