import React, { useState } from 'react';
import { 
  Activity, 
  Terminal, 
  Webhook, 
  Database, 
  AlertCircle, 
  RefreshCw, 
  Play,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { Product, CrawlerLog } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const Automation = () => {
  const { data: latestProducts, loading: loadingProducts } = useSupabaseQuery<Product>('products', { limit: 5, orderCol: 'created_at' });
  const { data: logs, loading: loadingLogs } = useSupabaseQuery<CrawlerLog>('crawler_logs', { limit: 10, orderCol: 'created_at' });
  
  const [testingWebhook, setTestingWebhook] = useState(false);

  const testWebhook = async () => {
    setTestingWebhook(true);
    // Simulate webhook test
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestingWebhook(false);
    alert('Webhook de teste enviado com sucesso!');
  };

  const crawlerStatus = {
    active: true,
    lastRun: '12 minutos atrás',
    efficiency: '94%',
    uikitStatus: 'Operational'
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)] pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="text-accent w-8 h-8" />
            Central de Automação
          </h2>
          <p className="text-gray-400 mt-1">Monitoramento de pipelines, crawler e integração n8n.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={testWebhook}
             disabled={testingWebhook}
             className="flex items-center gap-2 bg-white/5 border border-border px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
           >
             {testingWebhook ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
             Testar Webhook
           </button>
           <button className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">
             <Play className="w-4 h-4 fill-white" />
             Forçar Crawler
           </button>
        </div>
      </header>

      {/* DevOps Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatusCard 
          label="Crawler Status" 
          value={crawlerStatus.active ? 'Ativo' : 'Offline'} 
          status={crawlerStatus.active ? 'success' : 'error'} 
          subtext={`Última execução: ${crawlerStatus.lastRun}`} 
        />
        <StatusCard 
          label="n8n Pipeline" 
          value="Conectado" 
          status="success" 
          subtext="v2.1.0 - Endpoint Protegido" 
        />
        <StatusCard 
          label="Ingestão (24h)" 
          value="142" 
          status="neutral" 
          subtext="+12% que ontem" 
        />
        <StatusCard 
          label="Taxa de Erro" 
          value="0.32%" 
          status="success" 
          subtext="Abaixo do limite sugerido" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Realtime Terminal Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="premium-card overflow-hidden border-accent/20">
            <div className="bg-white/5 px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="text-accent w-5 h-5" />
                <h3 className="font-bold text-white uppercase tracking-widest text-xs font-mono">Stream de Ingestão Realtime</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span className="text-[10px] text-gray-400 font-mono">LIVE SOCKET CONNECTED</span>
              </div>
            </div>
            <div className="bg-black/40 p-6 font-mono text-sm space-y-3 min-h-[300px] max-h-[450px] overflow-y-auto technical-grid">
               {latestProducts?.map((p, i) => (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={p.id} 
                   className="flex gap-4 group"
                 >
                   <span className="text-gray-600 shrink-0">[{new Date(p.created_at).toLocaleTimeString()}]</span>
                   <span className="text-green-500 shrink-0">SUCCESS</span>
                   <div className="flex-1 text-gray-300">
                     <span className="text-white font-bold">PROD_INGEST:</span> {p.title.slice(0, 40)}... 
                     <span className="text-accent ml-2">[{p.brand}]</span>
                     <span className="text-gray-500 ml-2">v_score: {p.ai_score}</span>
                   </div>
                   <button className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity">
                     <RefreshCw className="w-3 h-3" />
                   </button>
                 </motion.div>
               ))}
               {!latestProducts?.length && !loadingProducts && (
                 <div className="text-gray-600 italic">Aguardando novos sinais de entrada...</div>
               )}
            </div>
          </div>

          <div className="premium-card p-6">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                   <Clock className="w-4 h-4 text-accent" />
                   Histórico de Eventos
                </h3>
             </div>
             <div className="space-y-4">
                {logs?.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-lg">
                    <div className={cn(
                      "p-2 rounded flex items-center justify-center",
                      log.status === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {log.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{log.source}</p>
                      <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-gray-300">{log.total_products} items</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">{log.status}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Source Integration */}
        <div className="lg:col-span-4 space-y-8">
           <div className="premium-card p-6 bg-accent/5 border-accent/20 overflow-hidden relative">
              <Zap className="absolute -right-4 -top-4 w-24 h-24 text-accent opacity-10 rotate-12" />
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Dados Técnicos n8n
              </h3>
              <div className="space-y-4 text-xs">
                 <div className="flex items-center justify-between p-2 bg-black/40 rounded">
                    <span className="text-gray-400">ENDPOINT URL</span>
                    <span className="text-white font-mono truncate max-w-[150px]">/api/public/ingest</span>
                 </div>
                 <div className="flex items-center justify-between p-2 bg-black/40 rounded">
                    <span className="text-gray-400">AUTH TYPE</span>
                    <span className="text-white font-mono">SUPABASE_ANON</span>
                 </div>
                 <div className="flex items-center justify-between p-2 bg-black/40 rounded">
                    <span className="text-gray-400">PAYLOAD_FORMAT</span>
                    <span className="text-white font-mono text-[10px]">JSON (APPLICATION/JSON)</span>
                 </div>
              </div>
           </div>

           <div className="premium-card p-6">
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Fontes Ativas</h3>
              <div className="space-y-6">
                 <SourceItem 
                   name="Loja do Mecânico" 
                   type="Crawler (Playwright)" 
                   delay="15min" 
                   uptime={99.8} 
                 />
                 <SourceItem 
                   name="n8n Worker 01" 
                   type="HTTP Webhook" 
                   delay="Instant" 
                   uptime={100} 
                 />
                 <SourceItem 
                   name="Google Gemini API" 
                   type="IA Engine" 
                   delay="5s" 
                   uptime={98.5} 
                 />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, status, subtext }: any) => (
  <div className="premium-card p-6 relative overflow-hidden group">
    <div className={cn(
      "absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.05]",
      status === 'success' ? "bg-green-500" : status === 'error' ? "bg-red-500" : "bg-white"
    )} />
    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</p>
    <div className="flex items-center gap-3">
      <h4 className="text-2xl font-bold text-white tracking-tighter">{value}</h4>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full shrink-0",
        status === 'success' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : 
        status === 'error' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-gray-500"
      )} />
    </div>
    <p className="text-[10px] text-gray-400 mt-2 font-mono italic">{subtext}</p>
  </div>
);

const SourceItem = ({ name, type, uptime, delay }: any) => (
  <div className="flex items-center gap-4">
    <div className="w-1.5 h-10 bg-white/5 rounded-full overflow-hidden border border-white/5">
      <div className="w-full bg-accent h-full" style={{ opacity: uptime / 100 }} />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-white">{name}</span>
        <span className="text-[10px] font-mono text-accent">{uptime}%</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-tight">
        <span>{type}</span>
        <span>Delay: {delay}</span>
      </div>
    </div>
  </div>
);
