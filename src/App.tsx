import { useState, useEffect } from 'react';
import { Menu, X, LockKeyhole, Instagram, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { HomePage, AboutPage, PortfolioPage, ProjectCard } from '@/components/PublicPages';
import { ServicesPage, ContactPage, LoginPage } from '@/components/SitePages';
import { Workspace } from '@/components/Workspace';
import type { Project } from '@/components/PublicPages';

type Page = 'home' | 'about' | 'portfolio' | 'services' | 'contact' | 'login';

const navItems: { label: string; page: Page }[] = [
  { label: 'Início', page: 'home' },
  { label: 'Sobre nós', page: 'about' },
  { label: 'Portfólio', page: 'portfolio' },
  { label: 'Serviços', page: 'services' },
  { label: 'Contato', page: 'contact' },
];

function App() {
  const auth = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const navigate = (nextPage: string) => {
    setPage(nextPage as Page);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('home');
  };

  if (auth.loading) {
    return <div className="app-loading"><img src="/CONCEPT2.png" alt="Concept" /></div>;
  }

  if (auth.session && auth.colaborador) {
    return <Workspace auth={auth} onSignOut={handleSignOut} onNavigateHome={() => navigate('home')} />;
  }

  if (auth.session && !auth.colaborador) {
    return (
      <div className="no-colaborador">
        <img src="/CONCEPT2.png" alt="Concept" />
        <h1>Conta sem perfil de colaborador</h1>
        <p>Seu login não está vinculado a um colaborador. Contate o administrador.</p>
        <button className="button button-dark" onClick={handleSignOut}>Sair</button>
      </div>
    );
  }

  const handleLogin = async (username: string, password: string): Promise<string | null> => {
    const { error } = await auth.signIn(username, password);
    return error;
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate('home')} aria-label="Voltar para o início">
          <img src="/CONCEPT2.png" alt="Concept Empreendimentos" />
        </button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          {navItems.map((item) => (
            <button className={page === item.page ? 'active' : ''} key={item.page} onClick={() => navigate(item.page)}>{item.label}</button>
          ))}
          <button className="nav-portal" onClick={() => navigate('login')}><LockKeyhole size={15} /> Área do colaborador</button>
        </nav>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <main>
        {page === 'home' && <HomePage onNavigate={navigate} onProject={setActiveProject} />}
        {page === 'about' && <AboutPage onNavigate={navigate} />}
        {page === 'portfolio' && <PortfolioPage onProject={setActiveProject} />}
        {page === 'services' && <ServicesPage onNavigate={navigate} />}
        {page === 'contact' && <ContactPage />}
        {page === 'login' && <LoginPage onEnter={handleLogin} />}
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div><img src="/CONCEPT2.png" alt="Concept Empreendimentos" /><p>Construindo espaços para viver o que realmente importa.</p></div>
          <div className="footer-links"><span>Breves · Pará</span><span>r.spereira@outlook.com</span><span>+55 91 98123 3318</span></div>
          <div className="footer-social"><Instagram size={18} /><span className="linkedin-mark">in</span><span>© 2019 Concept</span></div>
        </div>
        <div className="footer-bottom"><span>Projetos com propósito. Obras com precisão.</span><span>Privacidade · Termos de uso</span></div>
      </footer>

      {activeProject && (
        <div className="modal-backdrop" onClick={() => setActiveProject(null)}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveProject(null)}><X /></button>
            <img src={activeProject.image} alt={activeProject.title} />
            <div>
              <span className="eyebrow">{activeProject.category} · {activeProject.year}</span>
              <h2>{activeProject.title}</h2>
              <p><MapPin size={15} /> {activeProject.location}</p>
              <button className="button button-dark" onClick={() => setActiveProject(null)}>Fechar projeto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
