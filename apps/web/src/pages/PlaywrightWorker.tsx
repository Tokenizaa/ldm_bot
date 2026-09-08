import React from 'react';
import { 
  Terminal, 
  Code2, 
  Workflow, 
  FileCode, 
  Settings, 
  Shield, 
  Zap,
  CheckCircle2,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export const PlaywrightWorker = () => {
  return (
    <div className="p-8 space-y-12 max-w-5xl mx-auto overflow-y-auto max-h-[calc(100vh-64px)] pb-20">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
          <Cpu className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Tech Specification</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase underline decoration-accent/50 decoration-4 underline-offset-8">
          Playwright Worker
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
          Infraestrutura de monitoramento distribuído para detecção de anomalias de preço em tempo real.
        </p>
      </header>

      {/* Architecture Flow */}
      <section className="premium-card p-8 bg-[#0c0c0c] border-accent/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
           <Zap className="w-20 h-20 text-accent/5 rotate-12" />
        </div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-10 flex items-center gap-2">
          <Workflow className="w-4 h-4 text-accent" />
          Operational Pipeline Architecture
        </h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 overflow-x-auto pb-4">
          <ArchStep icon={Terminal} label="Playwright" sub="Scraping Engine" />
          <ArrowRight className="hidden md:block text-gray-700 shrink-0" />
          <ArchStep icon={Settings} label="Normalization" sub="Data Sanitization" />
          <ArrowRight className="hidden md:block text-gray-700 shrink-0" />
          <ArchStep icon={Cpu} label="IA Engine" sub="Gemini Processing" />
          <ArrowRight className="hidden md:block text-gray-700 shrink-0" />
          <ArchStep icon={FileCode} label="Webhook" sub="Supabase Ingest" />
        </div>
      </section>

      {/* Functions & Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest border-l-2 border-accent pl-3">Corpo Técnico</h3>
          <div className="space-y-4">
            <FeatureItem title="Multi-Thread Scraping" text="Execução paralela de múltiplas categorias usando context isolation do BrowserContext do Playwright." />
            <FeatureItem title="Dynamic Anti-Bot" text="Rotação de User-Agents, random delays e simulação de comportamento humano (mouse movement, scroll)." />
            <FeatureItem title="Price Hash Fingerprinting" text="Geração de assinaturas digitais por produto para detecção instantânea de alterações decimais." />
          </div>
        </div>

        <div className="bg-black/30 border border-border p-6 rounded-xl font-mono text-[11px] leading-relaxed relative group">
          <div className="absolute top-2 right-4 text-gray-700 text-[10px] uppercase">types/worker.ts</div>
          <p className="text-blue-400">interface</p> <p className="text-white inline">WorkerResult {'{'}</p>
          <div className="pl-4 mt-1">
            <p className="text-gray-500 italic">// Dados brutos coletados</p>
            <p className="text-green-500">title:</p> <p className="text-yellow-400 inline">string;</p><br />
            <p className="text-green-500">price:</p> <p className="text-yellow-400 inline">number;</p><br />
            <p className="text-green-500">discount:</p> <p className="text-yellow-400 inline">number;</p><br />
            <p className="text-blue-400 mt-2">hash:</p> <p className="text-white inline">ProductHash;</p><br />
            <p className="text-gray-500 italic mt-2">// Metadados de performance</p>
            <p className="text-green-500">trace_id:</p> <p className="text-yellow-400 inline">uuid;</p><br />
            <p className="text-green-500">exec_time_ms:</p> <p className="text-yellow-400 inline">number;</p>
          </div>
          <p className="text-white">{'}'}</p>
          <div className="mt-4 p-2 bg-white/5 rounded border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
             <span className="text-gray-500 block mb-1">Status: Ready for deployment</span>
             <div className="w-full h-1 bg-accent/20 rounded-full">
                <div className="w-full bg-accent h-full" />
             </div>
          </div>
        </div>
      </div>

      {/* Directory Structure */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-l-2 border-accent pl-3">Estrutura de Diretórios</h3>
        <div className="premium-card bg-[#080808] p-8 border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs text-gray-400">
             <div className="space-y-2">
                <p className="text-white font-bold">📂 worker/</p>
                <p className="pl-4">📂 crawler/</p>
                <p className="pl-4">📂 services/</p>
             </div>
             <div className="space-y-2">
                <p className="text-white font-bold">📂 utils/</p>
                <p className="pl-4">📄 logger.ts</p>
                <p className="pl-4">📄 retry.ts</p>
             </div>
             <div className="space-y-2">
                <p className="text-white font-bold">📂 screenshots/</p>
                <p className="pl-4 bg-white/5 px-1 inline italic">err_cat_81.png</p>
             </div>
             <div className="space-y-2">
                <p className="text-white font-bold">📂 queue/</p>
                <p className="pl-4">📂 memory/</p>
             </div>
          </div>
        </div>
      </section>

      {/* Strategy Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          icon={Shield} 
          title="Segurança" 
          text="SSL Pinning bypass e proxies resilientes para garantir anonimato operacional." 
        />
        <SummaryCard 
          icon={Zap} 
          title="Velocidade" 
          text="Média de 1.2s por requisição. Baixo footprint de CPU graças ao modo headless." 
        />
        <SummaryCard 
          icon={CheckCircle2} 
          title="Integridade" 
          text="Validação tripla de campos antes do disparo do webhook de ingestão." 
        />
      </div>
    </div>
  );
};

const ArchStep = ({ icon: Icon, label, sub }: any) => (
  <div className="flex flex-col items-center gap-3 min-w-[120px]">
    <div className="w-16 h-16 bg-white/5 border border-border rounded-2xl flex items-center justify-center group hover:border-accent/40 transition-all">
      <Icon className="w-7 h-7 text-gray-500 group-hover:text-accent group-hover:scale-110 transition-all" />
    </div>
    <div className="text-center">
      <p className="text-xs font-bold text-white uppercase tracking-widest">{label}</p>
      <p className="text-[10px] text-gray-500 font-mono italic mt-1">{sub}</p>
    </div>
  </div>
);

const FeatureItem = ({ title, text }: any) => (
  <div className="p-4 bg-white/5 border border-white/5 rounded-lg group hover:border-accent/20 transition-all">
    <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-widest group-hover:text-accent transition-colors">{title}</h4>
    <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
  </div>
);

const SummaryCard = ({ icon: Icon, title, text }: any) => (
  <div className="p-6 premium-card border-accent/5 hover:border-accent/30 transition-all transition-duration-500 group">
    <Icon className="w-8 h-8 text-accent/30 mb-4 group-hover:text-accent transition-colors" />
    <h4 className="text-sm font-bold text-white mb-2">{title}</h4>
    <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
  </div>
);
