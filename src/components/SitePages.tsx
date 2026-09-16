import { useState } from 'react';
import { ArrowUpRight, Send, Mail, Phone, MapPin, Check, LockKeyhole, Building2, Ruler, Home, Settings2, Calculator } from 'lucide-react';

export function ServicesPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const services = [
    { icon: <Home />, title: 'Construção residencial', text: 'Casas feitas para traduzir a rotina e os sonhos de cada família.' },
    { icon: <Building2 />, title: 'Incorporação', text: 'Empreendimentos com visão de longo prazo, da aquisição à entrega.' },
    { icon: <Ruler />, title: 'Reformas & interiores', text: 'Novas camadas de vida para espaços que já têm uma história.' },
    { icon: <Settings2 />, title: 'Gestão de obras', text: 'Planejamento, orçamento e acompanhamento para uma obra tranquila.' },
  ];
  return <>
    <section className="page-hero compact"><span className="eyebrow"><span /> 03 / Serviços</span><h1>Do conceito<br /><em>à entrega.</em></h1><p>Um olhar completo para que cada etapa do seu projeto aconteça com clareza.</p></section>
    <section className="services-page container">
      <div className="service-list">{services.map((service, index) => <div className="service-row" key={service.title}><span className="service-number">0{index + 1}</span><div className="service-icon">{service.icon}</div><div><h2>{service.title}</h2><p>{service.text}</p></div><ArrowUpRight className="service-arrow" size={24} /></div>)}</div>
      <div className="service-note"><div className="note-icon"><Calculator /></div><div><span className="eyebrow">Para colaboradores</span><h3>Orçamentos mais inteligentes.</h3><p>Uma área exclusiva para estimar, detalhar e acompanhar cada obra.</p><button className="text-button" onClick={() => onNavigate('login')}>Acessar área interna <ArrowUpRight size={17} /></button></div></div>
    </section>
  </>;
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <section className="contact-page container">
      <div className="contact-intro">
        <span className="eyebrow"><span /> 04 / Contato</span>
        <h1>Vamos criar algo<br /><em>extraordinário?</em></h1>
        <p>Conte um pouco sobre o seu projeto. Nossa equipe retorna em até 2 dias úteis.</p>
        <div className="contact-details">
          <span><Mail size={16} /> contato@conceptempreendimentos.com.br</span>
          <span><Phone size={16} /> +55 11 98888 2200</span>
          <span><MapPin size={16} /> São Paulo · Brasil</span>
        </div>
      </div>
      <div className="contact-form">
        {sent ? (
          <div className="success-state"><div><Check /></div><h2>Mensagem recebida.</h2><p>Obrigado por entrar em contato. Em breve nossa equipe fala com você.</p><button className="text-button" onClick={() => setSent(false)}>Enviar outra mensagem <ArrowUpRight size={17} /></button></div>
        ) : (
          <>
            <label>Seu nome<input placeholder="Como podemos te chamar?" /></label>
            <label>Seu e-mail<input type="email" placeholder="voce@email.com" /></label>
            <label>Conte sobre o projeto<textarea placeholder="O que você está imaginando?" rows={4} /></label>
            <button className="button button-dark" onClick={() => setSent(true)}>Enviar mensagem <Send size={16} /></button>
          </>
        )}
      </div>
    </section>
  );
}

export function LoginPage({ onEnter }: { onEnter: (username: string, password: string) => Promise<string | null> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await onEnter(username, password);
    if (res) setError(res);
    setLoading(false);
  };

  return (
    <section className="login-page">
      <div className="login-brand">
        <img src="/image.png" alt="Concept Empreendimentos" />
        <span>Ambiente exclusivo para colaboradores</span>
      </div>
      <div className="login-card">
        <div className="login-card-head">
          <span className="eyebrow">Área interna</span>
          <h1>Acesse seu <em>espaço.</em></h1>
          <p>Entre para gerenciar orçamentos, obras e conteúdos da Concept.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Usuário<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu.usuario" required /></label>
          <label>Senha<div className="password-field"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /><LockKeyhole size={16} /></div></label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="button button-dark full-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar na área interna'} <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="login-hint">Use seu usuário e senha corporativos para acessar.</p>
      </div>
    </section>
  );
}
