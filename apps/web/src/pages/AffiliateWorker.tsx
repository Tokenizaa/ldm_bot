import React from 'react';
import { 
  KeyRound, 
  Link2, 
  MousePointer2, 
  ShieldCheck, 
  FileJson, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Save,
  Lock,
  Variable
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AffiliateWorker = () => {
  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto overflow-y-auto max-h-[calc(100vh-64px)] pb-32">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <Link2 className="w-4 h-4 text-green-500" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em]">Official Affiliate Pipeline</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase underline decoration-green-500/50 decoration-4 underline-offset-8">
          Affiliate Link Engine
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
          Automação oficial via fluxo real da plataforma para garantir máxima integridade de tracking e comissão.
        </p>
      </header>

      {/* Main Flow Diagram */}
      <div className="premium-card p-10 bg-[#0c0c0c] border-green-500/10 grid grid-cols-1 md:grid-cols-5 gap-4 relative isolate">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/[0.02] to-transparent pointer-events-none" />
        
        <StepBox step="01" label="Session Auth" icon={KeyRound} sub="Load storageState" color="text-green-500" />
        <Connector />
        <StepBox step="02" label="Product Access" icon={ExternalLink} sub="Auto-Navigation" color="text-blue-500" />
        <Connector />
        <StepBox step="03" label="Action Trigger" icon={MousePointer2} sub="Click Share Button" color="text-accent" />
        <Connector />
        <StepBox step="04" label="Link Capture" icon={Link2} sub="Input Scrape" color="text-green-500" />
        <Connector />
        <StepBox step="05" label="Database Sync" icon={Save} sub="Supabase Upsert" color="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Code Snippets */}
        <div className="space-y-8">
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-white uppercase tracking-widest border-l-2 border-green-500 pl-3">Session Management</h3>
             <p className="text-xs text-gray-500">Mantenha o Playwright logado indefinidamente reutilizando o state de autenticação.</p>
             <CodeBlock 
               filename="auth.setup.ts" 
               code={`// Salva a sessão após login manual
await context.storageState({ path: 'auth.json' });

// Carrega em execuções seguintes
const context = await browser.newContext({
  storageState: 'auth.json'
});`} 
             />
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-bold text-white uppercase tracking-widest border-l-2 border-accent pl-3">Dom Selectors (Proprietário)</h3>
             <CodeBlock 
               filename="selectors.config.ts" 
               code={`const SELECTORS = {
  SHARE_BTN: 'text=Compartilhar',
  AFFILIATE_INPUT: 'input.affiliate-link-field',
  PRICE_LABEL: '.product-price-final',
  MODAL_CONTAINER: '.share-modal-root'
};`} 
             />
          </div>
        </div>

        {/* Right: Technical Spec */}
        <div className="space-y-8">
          <div className="premium-card p-6 space-y-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Resiliência Operacional
            </h3>
            
            <div className="space-y-4">
              <SpecItem 
                title="Context Isolation" 
                desc="Cada requisição de link roda em um contexto de browser isolado para evitar vazamento de dados de sessão." 
              />
              <SpecItem 
                title="Auto-Relogin Pattern" 
                desc="Detecta automaticamente o redirecionamento para login e interrompe para intervenção ou re-autenticação manual." 
              />
              <SpecItem 
                title="Modal Waiting" 
                desc="Implementa smart waits (waitForSelector) para lidar com animações de UI e delay de carregamento de APIs externas." 
              />
            </div>
          </div>

          <div className="bg-black/30 border border-border p-6 rounded-xl space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Environment Variables</span>
                <Lock className="w-3 h-3 text-gray-700" />
             </div>
             <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-blue-400">LM_USER</span>
                  <span className="text-gray-400">********</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-blue-400">LM_PASS</span>
                  <span className="text-gray-400">********</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-400">STORAGE_STATE_PATH</span>
                  <span className="text-green-500 italic">"auth.json"</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Payload Sample */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest text-center">Data Ingestion Schema</h3>
        <div className="premium-card bg-[#080808] p-8 border-border max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-mono text-gray-400">POST /api/public/ingest</span>
            </div>
            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded">201 CREATED</span>
          </div>
          <pre className="text-sm font-mono text-gray-500 leading-relaxed overflow-x-auto">
{`{
  "title": "Furadeira Bosch GSB 18V",
  "affiliate_url": "https://loja.mecanico/a/8821x9",
  "original_url": "https://loja.mecanico/item/22",
  "price": 489.90,
  "category": "Tools",
  "brand": "Bosch",
  "hash": "8821-489-01"
}`}
          </pre>
        </div>
      </section>
    </div>
  );
};

const StepBox = ({ step, label, sub, icon: Icon, color }: any) => (
  <div className="flex flex-col items-center gap-4 text-center group">
    <div className="relative">
      <span className="absolute -top-2 -right-2 text-[10px] font-mono font-bold text-gray-600 border border-white/10 bg-surface px-1 rounded">{step}</span>
      <div className={cn(
        "w-16 h-16 rounded-2xl bg-white/5 border border-border flex items-center justify-center transition-all group-hover:scale-110",
        `group-hover:border-${color.split('-')[1]}/30`
      )}>
        <Icon className={cn("w-7 h-7", color)} />
      </div>
    </div>
    <div>
       <p className="text-xs font-bold text-white uppercase tracking-tight">{label}</p>
       <p className="text-[10px] text-gray-500 font-mono italic mt-1">{sub}</p>
    </div>
  </div>
);

const Connector = () => (
  <div className="hidden md:flex items-center justify-center pt-8">
     <ChevronRight className="w-4 h-4 text-gray-800" />
  </div>
);

const CodeBlock = ({ filename, code }: any) => (
  <div className="bg-black/60 border border-border rounded-xl overflow-hidden group">
    <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
      <span className="text-[10px] font-mono text-gray-400 italic">{filename}</span>
      <Terminal className="w-3 h-3 text-gray-600" />
    </div>
    <div className="p-4">
      <pre className="text-xs font-mono text-gray-400 leading-relaxed overflow-x-auto">
        {code}
      </pre>
    </div>
  </div>
);

const SpecItem = ({ title, desc }: any) => (
  <div className="flex gap-4 group">
    <div className="w-1.5 h-1.5 rounded-full bg-green-500/40 mt-1.5 shrink-0 group-hover:bg-green-500 transition-colors" />
    <div>
      <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-widest">{title}</h4>
      <p className="text-[11px] text-gray-400 leading-relaxed font-mono">{desc}</p>
    </div>
  </div>
);
