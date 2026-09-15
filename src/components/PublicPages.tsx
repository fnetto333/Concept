import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { EquipeSite, ConteudoSobre } from '@/lib/types';
import { ArrowUpRight, Compass, ShieldCheck, Sparkles, MapPin } from 'lucide-react';

type Project = { title: string; location: string; category: string; year: string; image: string };

export type { Project };

export const projects: Project[] = [
  { title: 'Casa Brisa', location: 'Jardim Europa, SP', category: 'Residencial', year: '2024', image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200' },
  { title: 'Edifício Áurea', location: 'Vila Madalena, SP', category: 'Incorporação', year: '2023', image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200' },
  { title: 'Casa das Árvores', location: 'Alphaville, SP', category: 'Residencial', year: '2024', image: 'https://images.pexels.com/photos/7031609/pexels-photo-7031609.jpeg?auto=compress&cs=tinysrgb&w=1200' },
];

export function HomePage({ onNavigate, onProject }: { onNavigate: (page: string) => void; onProject: (p: Project) => void }) {
  return <>
    <section className="hero">
      <div className="hero-glow" /><div className="hero-copy"><span className="eyebrow light"><span /> Arquitetura que permanece</span><h1>Espaços pensados para <em>viver bem.</em></h1><p>Da primeira linha no papel à entrega das chaves, construímos com presença, precisão e um olhar atento ao que faz cada projeto ser único.</p><div className="hero-actions"><button className="button button-light" onClick={() => onNavigate('portfolio')}>Conheça nossos projetos <ArrowUpRight size={17} /></button><button className="text-button light-text" onClick={() => onNavigate('about')}>Sobre a Concept <ArrowUpRight size={17} /></button></div></div>
      <div className="hero-meta"><span>01 — 03</span><div className="hero-line"><i /></div><span>São Paulo, SP</span></div>
      <div className="hero-visual"><div className="hero-house" /><div className="hero-note"><span>01</span><strong>Casa Brisa</strong><small>Jardim Europa · 2024</small></div></div>
    </section>
    <section className="intro-section container"><div className="section-kicker">01 / Essência</div><div className="intro-grid"><h2>Mais do que construir,<br /><em>criamos permanências.</em></h2><div><p className="large-copy">Somos uma construtora movida pela crença de que bons espaços transformam a forma como as pessoas vivem, trabalham e se relacionam.</p><button className="text-button" onClick={() => onNavigate('about')}>Conheça nossa história <ArrowUpRight size={17} /></button></div></div></section>
    <section className="featured-section"><div className="container"><div className="section-heading"><div><div className="section-kicker">02 / Seleção</div><h2>Obras que contam<br /><em>boas histórias.</em></h2></div><button className="text-button" onClick={() => onNavigate('portfolio')}>Ver portfólio completo <ArrowUpRight size={17} /></button></div><div className="project-grid">{projects.map((project) => <ProjectCard project={project} key={project.title} onProject={onProject} />)}</div></div></section>
    <section className="manifesto-section"><div className="container manifesto-grid"><div className="manifesto-mark">"</div><div><span className="eyebrow">Nosso jeito de fazer</span><h2>Elegância está nos detalhes. <em>Excelência está no cuidado.</em></h2><p>Projetamos com intenção, coordenamos com rigor e entregamos com a tranquilidade de quem sabe que cada escolha importa.</p></div></div></section>
    <section className="cta-section container"><div><span className="eyebrow">Vamos conversar?</span><h2>Seu próximo projeto<br /><em>começa aqui.</em></h2></div><button className="circle-button" onClick={() => onNavigate('contact')}><ArrowUpRight size={28} /></button></section>
  </>;
}

export function AboutPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [conteudos, setConteudos] = useState<ConteudoSobre[]>([]);
  const [equipe, setEquipe] = useState<EquipeSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('conteudo_sobre').select('*').order('ordem', { ascending: true }),
      supabase.from('equipe_site').select('*').eq('ativo', true).order('ordem', { ascending: true }),
    ]).then(([conteudoRes, equipeRes]) => {
      if (conteudoRes.data) setConteudos(conteudoRes.data as ConteudoSobre[]);
      if (equipeRes.data) setEquipe(equipeRes.data as EquipeSite[]);
      setLoading(false);
    });
  }, []);

  return <>
    <section className="page-hero"><span className="eyebrow"><span /> 01 / Sobre nós</span><h1>Construímos com<br /><em>intenção.</em></h1><p>Uma empresa feita de pessoas que acreditam na força de um espaço bem pensado.</p></section>
    <section className="about-story container">
      <div className="story-image"><img src={projects[2].image} alt="Casa contemporânea cercada por árvores" /><span>Desde 2012</span></div>
      <div className="story-copy">
        <div className="section-kicker">Uma história de presença</div>
        <h2>O projeto começa muito antes da obra.</h2>
        {loading ? <p>Carregando...</p> : conteudos.map((c) => <p key={c.id}><strong>{c.titulo}</strong><br />{c.paragrafo}</p>)}
        <button className="button button-dark" onClick={() => onNavigate('contact')}>Fale com a nossa equipe <ArrowUpRight size={17} /></button>
      </div>
    </section>
    <section className="values-section"><div className="container"><div className="section-kicker">O que nos guia</div><div className="values-grid">
      <Value icon={<Compass />} title="Intenção" text="Cada decisão tem um porquê. Projetamos para o presente e para tudo que ainda vai acontecer." />
      <Value icon={<ShieldCheck />} title="Confiança" text="Transparência em cada etapa, com o cuidado e a presença que uma obra merece." />
      <Value icon={<Sparkles />} title="Excelência" text="O detalhe bem resolvido é o que transforma um bom projeto em uma experiência marcante." />
    </div></div></section>
    {equipe.length > 0 && <section className="team-section"><div className="container"><div className="section-kicker">Nossa equipe</div><div className="team-grid">{equipe.map((m) => <div className="team-card" key={m.id}>{m.foto_url ? <img src={m.foto_url} alt={m.nome} /> : <div className="team-photo-placeholder">{m.nome.charAt(0)}</div>}<h3>{m.nome}</h3><span>{m.cargo}</span></div>)}</div></div></section>}
  </>;
}

export function PortfolioPage({ onProject }: { onProject: (p: Project) => void }) {
  return <><section className="page-hero compact"><span className="eyebrow"><span /> 02 / Portfólio</span><h1>Projetos com<br /><em>personalidade.</em></h1><p>Uma seleção de obras onde arquitetura, matéria e tempo encontram equilíbrio.</p></section><section className="portfolio-page container"><div className="filter-row"><span>Todos os projetos</span><button>Residenciais</button><button>Mais recentes</button></div><div className="portfolio-grid">{projects.concat([{ ...projects[0], title: 'Apartamento Nilo', location: 'Pinheiros, SP', year: '2022', image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200' }]).map((project) => <ProjectCard project={project} key={project.title} onProject={onProject} large />)}</div></section></>;
}

export function ProjectCard({ project, onProject, large = false }: { project: Project; onProject: (p: Project) => void; large?: boolean }) {
  return <button className={`project-card ${large ? 'large' : ''}`} onClick={() => onProject(project)}><div className="project-image"><img src={project.image} alt={project.title} /><span className="project-arrow"><ArrowUpRight size={18} /></span></div><div className="project-info"><div><span>{project.category}</span><h3>{project.title}</h3></div><div className="project-location"><MapPin size={13} /> {project.location}<small>{project.year}</small></div></div></button>;
}

function Value({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="value-item"><div className="value-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>;
}
