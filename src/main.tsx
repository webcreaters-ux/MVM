import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { routeChat } from './core/router';
import { defaultProviders, loadModel, loadProviders, saveModel, saveProviders } from './core/storage';
import type { ChatMessage, ModelProvider } from './core/types';

type Module = { id: string; name: string; description: string; icon: string; status: string };

const modules: Module[] = [
  { id: 'chat', name: 'AI Hub', description: 'Chat with local or remote open models.', icon: '✦', status: 'READY' },
  { id: 'vision', name: 'Vision Lab', description: 'Analyze images, screenshots and documents.', icon: '◉', status: 'NEXT' },
  { id: 'forge', name: 'Code Forge', description: 'Generate, inspect and improve software.', icon: '⌘', status: 'NEXT' },
  { id: 'flows', name: 'Flow Engine', description: 'Compose reusable AI automations.', icon: '↯', status: 'BETA' },
  { id: 'vault', name: 'Private Vault', description: 'Keep settings and secrets on your device.', icon: '◇', status: 'LOCAL' },
  { id: 'plugins', name: 'Open Modules', description: 'Extend MVM with provider-neutral adapters.', icon: '⊕', status: 'OPEN' },
  { id: 'settings', name: 'Settings', description: 'Configure providers, models and local endpoints.', icon: '⚙', status: 'LOCAL' }
];

function App() {
  const [active, setActive] = useState('chat');
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(true);
  const [providers, setProviders] = useState<ModelProvider[]>(loadProviders);
  const [model, setModel] = useState(loadModel);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const visible = useMemo(() => modules.filter(m => `${m.name} ${m.description}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const provider = providers.find(p => p.enabled) ?? defaultProviders[2];

  async function sendMessage() {
    const text = prompt.trim();
    if (!text || busy) return;
    const user: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, createdAt: Date.now() };
    const next = [...messages, user];
    setMessages(next); setPrompt(''); setError(''); setBusy(true);
    try {
      const result = await routeChat({ provider, model, messages: next });
      setMessages([...next, { id: crypto.randomUUID(), role: 'assistant', content: result.content, createdAt: Date.now() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reach the selected provider.');
    } finally { setBusy(false); }
  }

  function updateProvider(id: string, patch: Partial<ModelProvider>) {
    const next = providers.map(p => p.id === id ? { ...p, ...patch } : p);
    setProviders(next); saveProviders(next);
  }

  const module = modules.find(m => m.id === active) ?? modules[0];

  return <main className={dark ? 'app dark' : 'app'}>
    <aside className="sidebar">
      <div className="brand"><span className="mark">M</span><div><b>MVM</b><small>MODULAR VISION MATRIX</small></div></div>
      <nav>{modules.map(m => <button className={active === m.id ? 'nav active' : 'nav'} onClick={() => setActive(m.id)} key={m.id}><span>{m.icon}</span>{m.name}</button>)}</nav>
      <div className="side-bottom"><button className="nav" onClick={() => setDark(!dark)}>◐ {dark ? 'Light mode' : 'Dark mode'}</button><span className="version">MVM 0.2 • OPEN SOURCE</span></div>
    </aside>
    <section className="content">
      <header><div><span className="eyebrow">COMMAND CENTER</span><h1>Build with intelligence.</h1><p>One workspace for open models, tools, knowledge and automation.</p></div><div className="health"><i/> SYSTEM ONLINE</div></header>
      <div className="toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search modules…"/><button onClick={() => setQuery('')}>Clear</button></div>

      {active === 'chat' ? <section className="workspace">
        <div className="workspace-head"><div><span className="pill">AI HUB • {provider.name}</span><h2>Talk to your model.</h2><p>Local-first routing with Ollama and OpenAI-compatible endpoints.</p></div><button className="ghost" onClick={() => setActive('settings')}>Configure →</button></div>
        <div className="chat-window">
          {messages.length === 0 && <div className="empty-chat"><div className="empty-icon">✦</div><h3>Ready when you are.</h3><p>Try “Explain quantum computing simply” or connect a local model in Settings.</p></div>}
          {messages.map(m => <div className={`message ${m.role}`} key={m.id}><span>{m.role === 'user' ? 'YOU' : 'MVM'}</span><p>{m.content}</p></div>)}
          {busy && <div className="message assistant"><span>MVM</span><p className="typing">Thinking…</p></div>}
        </div>
        {error && <div className="error">{error}</div>}
        <div className="composer"><textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Message MVM…" rows={2}/><button className="primary send" onClick={() => void sendMessage()} disabled={busy || !prompt.trim()}>Send ↗</button></div>
      </section> : active === 'settings' ? <section className="workspace settings-page">
        <div className="workspace-head"><div><span className="pill">PRIVATE • LOCAL STORAGE</span><h2>Provider settings.</h2><p>No API keys are shipped with MVM. Add your own endpoint when needed.</p></div></div>
        <label className="field">Default model<input value={model} onChange={e => { setModel(e.target.value); saveModel(e.target.value); }} placeholder="llama3.2"/></label>
        <div className="provider-list">{providers.map(p => <article className="provider" key={p.id}><div><strong>{p.name}</strong><small>{p.kind}</small></div><label className="toggle"><input type="checkbox" checked={p.enabled} onChange={e => updateProvider(p.id, { enabled: e.target.checked })}/><span>Enabled</span></label><label className="field">Base URL<input value={p.baseUrl} onChange={e => updateProvider(p.id, { baseUrl: e.target.value })} placeholder="http://localhost:11434"/></label></article>)}</div>
      </section> : <section className="workspace module-placeholder">
        <span className="pill">{module.status}</span><h2>{module.name}</h2><p>{module.description}</p><div className="roadmap">This module is wired into the MVM shell. The next build phase will add its engine without changing the core router.</div><button className="primary" onClick={() => setActive('chat')}>Back to AI Hub →</button>
      </section>}

      <div className="section-title"><h3>Modules</h3><span>{visible.length} available</span></div>
      <div className="grid">{visible.map(m => <article className="card" key={m.id} onClick={() => setActive(m.id)}><div className="card-top"><span className="module-icon">{m.icon}</span><span className="status">{m.status}</span></div><h4>{m.name}</h4><p>{m.description}</p><span className="open">Open module ↗</span></article>)}</div>
      <footer>Designed for PC + mobile • Provider-neutral architecture • Local settings • No API keys shipped in the client</footer>
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
