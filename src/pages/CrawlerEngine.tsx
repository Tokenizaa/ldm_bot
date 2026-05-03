import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Terminal, 
  Layers, 
  Monitor, 
  Clock, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Timer,
  ExternalLink,
  Cpu,
  RefreshCw,
  Globe,
  Database
} from 'lucide-react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { CrawlerLog, Product } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const CrawlerEngine = () => {
  const { data: logs } = useSupabaseQuery<CrawlerLog>('crawler_logs', { limit: 20, orderCol: 'created_at' });
  const [activeTab, setActiveTab] = useState<'monitoring' | 'queues' | 'events'>('monitoring');
  
  // Realtime Simulation for "Live" feel
  const [liveEvents, setLiveEvents] = useState<string[]>([]);
  
  useEffect(() => {
    const events = [
      "SCRAPER_INIT: Category [parafusadeiras] starting...",
      "FETCH_URL: Requesting https://lojadomecanico.com.br/parafusadeiras",
      "DOM_READY: 42 elements detected",
      "EXTRACT_DATA: Product hash [7a9d2] generated",
      "COMPARE_PRICE: Price change detected for [Bosch GSB 18V]",
      "AI_TRANSFORM: Generating description for [Makita DDF485]",
      "WEBHOOK_SENT: Payload sent to n8n pipeline",
      "SUPABASE_UPSERT: Row updated successfully [ID: 8821]"
    ];

    const interval = setInterval(() => {
      setLiveEvents(prev => [events[Math.floor(Math.random() * events.length)], ...prev].slice(0, 12));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats = {
    uptime: '99.98%',
    lastRun: '4m ago',
    duration: '18.4s',
    totalColected: 1240,
    failureRate: '0.42%',
    ignored: 12,
    new: 5,
    updated: 8
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)] pb-12 technical-grid">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-accent rounded-full animate-ping" />
            <span className="text-[10px] text-accent font-bold uppercase tracking-[0.3em]">System Operational</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3 italic">
            CRAWLER_ENGINE <span className="text-accent text-2xl not-italic">v4.0</span>
          </h2>
          <p className="text-gray-500 font-mono text-xs mt-1 tracking-wider uppercase">Industrial Data Extraction Pipeline // ForgeDeals AI</p>
        </div>

        <div className="flex gap-4">
           <div className="bg-white/5 border border-border px-4 py-2 rounded flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Memory Usage</span>
              <span className="text-sm font-mono text-white">482.4MB / 1024MB</span>
           </div>
           <div className="bg-accent/10 border border-accent/20 px-4 py-2 rounded flex flex-col items-end">
              <span className="text-[10px] text-accent font-bold uppercase">Thread Status</span>
              <span className="text-sm font-mono text-white">4 Active Channels</span>
           </div>
        </div>
      </header>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1">
        <MiniStat label="UPTIME" value={stats.uptime} status="success" />
        <MiniStat label="LAST_RUN" value={stats.lastRun} />
        <MiniStat label="DURATION" value={stats.duration} />
        <MiniStat label="COLECTED" value={stats.totalColected} />
        <MiniStat label="NEW" value={stats.new} status="success" />
        <MiniStat label="UPDATED" value={stats.updated} />
        <MiniStat label="IGNORED" value={stats.ignored} />
        <MiniStat label="FAIL_RATE" value={stats.failureRate} status="error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Pipelines and Logs */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Fila Visualizer */}
          <div className="premium-card p-6 bg-surface/80 backdrop-blur-xl border-accent/10">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" />
              Pipeline Queues Visualization
            </h3>
            
            <div className="space-y-8">
              <QueueRow label="Scraping Queue" current={14} max={50} color="accent" status="Processing" />
              <QueueRow label="AI Transformation" current={8} max={50} color="blue-500" status="Analyzing" />
              <QueueRow label="Publication Engine" current={2} max={100} color="green-500" status="Idle" />
            </div>
          </div>

          {/* Realtime Timeline (Terminal Style) */}
          <div className="premium-card bg-black border-accent/20 rounded-none overflow-hidden h-[400px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-accent/10 border-b border-accent/20">
               <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] text-white font-mono font-bold uppercase tracking-widest">Live System Events</span>
               </div>
               <div className="flex items-center gap-4 text-[9px] text-gray-500 font-mono">
                  <span>LATENCY: 42ms</span>
                  <span>DEBUG: ON</span>
               </div>
            </div>
            <div className="flex-1 p-6 font-mono text-xs overflow-y-auto space-y-2 custom-scrollbar">
               <AnimatePresence initial={false}>
                  {liveEvents.map((event, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4"
                    >
                      <span className="text-gray-700">[{new Date().toLocaleTimeString()}]</span>
                      <span className={cn(
                        "shrink-0",
                        event.includes('ERROR') ? "text-red-500" : event.includes('INIT') ? "text-blue-500" : "text-green-500"
                      )}>
                        {event.split(':')[0]}
                      </span>
                      <span className="text-gray-400">{event.split(':')[1]}</span>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right column: Playwright & Hardware */}
        <div className="lg:col-span-4 space-y-8">
           
           {/* Playwright Stats */}
           <div className="premium-card p-6 bg-[#0c0c0c] border-[#1a1a1a]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-accent" />
                  Playwright Sandbox
                </h3>
                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] rounded font-mono">STABLE</span>
              </div>

              <div className="space-y-5">
                 <HardwareStat label="Browser" value="Chromium Headless" sub="v124.0.0" />
                 <HardwareStat label="U-Agent" value="iPhone 14 Pro / Safari" sub="Rotational" />
                 <HardwareStat label="Last Catch" value=".../parafusadeiras" sub="12s ago" />
                 
                 <div className="pt-4 space-y-2">
                   <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                     <span className="uppercase tracking-widest font-bold">Screenshot Buffer</span>
                     <span>84% Full</span>
                   </div>
                   <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-accent h-full w-[84%]" />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="aspect-video bg-white/5 border border-border rounded flex items-center justify-center relative group overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=200" className="opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all blur-[1px] group-hover:blur-0" alt="" />
                       <span className="absolute text-[8px] font-mono text-white bottom-1 left-1 bg-black/60 px-1 rounded">200 OK</span>
                    </div>
                    <div className="aspect-video bg-white/5 border border-border rounded flex items-center justify-center relative group overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=200" className="opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all blur-[1px] group-hover:blur-0" alt="" />
                       <span className="absolute text-[8px] font-mono text-white bottom-1 left-1 bg-black/60 px-1 rounded">200 OK</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Actions */}
           <div className="grid grid-cols-1 gap-4">
              <button className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-accent group-hover:rotate-180 transition-all duration-500" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white uppercase tracking-widest">Rebuild Index</p>
                    <p className="text-[10px] text-gray-500">Force hash recalculation</p>
                  </div>
                </div>
              </button>

              <button className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-400 group-hover:text-accent transition-all" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white uppercase tracking-widest">VNC Mirror</p>
                    <p className="text-[10px] text-gray-500">View browser streaming</p>
                  </div>
                </div>
              </button>
           </div>
        </div>
      </div>

      {/* Logs Table Section */}
      <div className="premium-card overflow-hidden">
        <div className="bg-white/5 px-6 py-4 border-b border-border flex items-center justify-between">
           <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              Crawler Execution Logs
           </h3>
           <div className="flex gap-2">
              <span className="text-[10px] text-gray-500 font-mono">Filter: All Events</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[11px]">
            <thead className="bg-black/20 text-gray-500">
               <tr>
                  <th className="px-6 py-3 uppercase tracking-tighter">Timestamp</th>
                  <th className="px-6 py-3 uppercase tracking-tighter">Event</th>
                  <th className="px-6 py-3 uppercase tracking-tighter">Status</th>
                  <th className="px-6 py-3 uppercase tracking-tighter">Load</th>
                  <th className="px-6 py-3 uppercase tracking-tighter">Message</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs?.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-3 text-white font-bold">{log.source}</td>
                  <td className="px-6 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                      log.status === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>{log.status}</span>
                  </td>
                  <td className="px-6 py-3 text-accent">{log.total_products} items</td>
                  <td className="px-6 py-3 text-gray-500 max-w-xs truncate">{log.error_message || 'Execution completed without warnings.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, status }: any) => (
  <div className="bg-[#0f0f0f] border border-border p-3 flex flex-col">
    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">{label}</span>
    <div className="flex items-center gap-1.5">
      {status === 'success' && <div className="w-1 h-1 bg-green-500 rounded-full" />}
      {status === 'error' && <div className="w-1 h-1 bg-red-500 rounded-full" />}
      <span className={cn(
        "text-xs font-mono font-bold tracking-tighter",
        status === 'success' ? "text-green-500" : status === 'error' ? "text-red-500" : "text-white"
      )}>{value}</span>
    </div>
  </div>
);

const QueueRow = ({ label, current, max, color, status }: any) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
         <span className="text-xs font-bold text-white uppercase tracking-tight">{label}</span>
         <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest", `bg-${color}/20 text-${color}`)}>{status}</span>
      </div>
      <span className="text-[10px] font-mono text-gray-500">{current} / {max}</span>
    </div>
    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 flex gap-1 p-0.5">
       {Array.from({ length: 20 }).map((_, i) => (
         <div 
           key={i} 
           className={cn(
             "h-full flex-1 rounded-[1px] transition-all duration-1000",
             i < (current / max) * 20 ? `bg-${color}` : "bg-white/5"
           )} 
         />
       ))}
    </div>
  </div>
);

const HardwareStat = ({ label, value, sub }: any) => (
  <div className="flex justify-between items-start border-l border-white/5 pl-4 relative">
    <div className="absolute left-0 top-0 w-1 h-1 bg-accent rounded-full -translate-x-1/2" />
    <div>
       <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{label}</p>
       <p className="text-xs font-bold text-white">{value}</p>
    </div>
    <span className="text-[9px] font-mono text-gray-500 mt-1">{sub}</span>
  </div>
);
