import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Module = { id: string; name: string; description: string; icon: string; status: string };

const modules: Module[] = [
  { id: 'chat', name: 'AI Hub', description: 'Chat with local or remote open models.', icon: '✦', status: 'READY' },
  { id: 'vision', name: 'Vision Lab', description: 'Analyze images, screenshots and documents.', icon: '◉', status: 'READY' },
  { id: 'forge', name: 'Code Forge', description: 'Generate, inspect and improve software.', icon: '⌘', status: 'READY' },
  { id: 'flows', name: 'Flow Engine', description: 'Compose reusable AI automations.', icon: '↯', status: 'BETA' },
  { id: 'vault', name: 'Private Vault', description: 'Keep settings and secrets on your device.', icon: '◇', status: 'LOCAL' },
  { id: 'plugins', name: 'Open Modules', description: 'Extend MVM with provider-neutral adapters.', icon: '⊕', status: 'OPEN' }
];

function App() {
  const [active, setActive] = useState('chat');
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(true);
  const visible = useMemo(() => modules.filter(m => `${m.name} ${m.description}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return <main className={dark ? 'app dark' : 'app'}>
    <aside className="sidebar">
      <div className="brand"><span className="mark">M</span><div><b>MVM</b><small>MODULAR VISION MATRIX</small></div></div>
      <nav>{modules.map(m => <button className={active === m.id ? 'nav active' : 'nav'} onClick={() => setActive(m.id)} key={m.id}><span>{m.icon}</span>{m.name}</button>)}</nav>
      <div className="side-bottom"><button className="nav" onClick={() => setDark(!dark)}>◐ {dark ? 'Light mode' : 'Dark mode'}</button><span className="version">MVM 0.1 • OPEN SOURCE</span></div>
    </aside>
    <section className="content">
      <header><div><span className="eyebrow">COMMAND CENTER</span><h1>Build with intelligence.</h1><p>One workspace for open models, tools, knowledge and automation.</p></div><div className="health"><i/> SYSTEM ONLINE</div></header>
      <div className="toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search modules…"/><button onClick={() => setQuery('')}>Clear</button></div>
      <section className="hero"><div><span className="pill">OPEN • LOCAL-FIRST</span><h2>Everything AI.<br/><em>One matrix.</em></h2><p>Connect local models, free providers and your own tools without locking the core to a single vendor.</p><button className="primary" onClick={() => setActive('chat')}>Launch AI Hub →</button></div><div className="orb"><div className="orb-core">MVM</div></div></section>
      <div className="section-title"><h3>Modules</h3><span>{visible.length} available</span></div>
      <div className="grid">{visible.map(m => <article className="card" key={m.id} onClick={() => setActive(m.id)}><div className="card-top"><span className="module-icon">{m.icon}</span><span className="status">{m.status}</span></div><h4>{m.name}</h4><p>{m.description}</p><span className="open">Open module ↗</span></article>)}</div>
      <footer>Designed for PC + mobile • Provider-neutral architecture • No API keys shipped in the client</footer>
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
