import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, Calendar, Database, Facebook, Package, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, type MonthlyPlan, type SystemConfig } from '../lib/api';

type Overview = {
  totalProducts: number;
  activeLinks: number;
  priceDropsToday: number;
  biggestDrop: number;
  topCategories: Array<{ name: string; count: number }>;
  topBrands: Array<{ name: string; count: number }>;
  recentOpportunities: Array<{ id: string; name?: string; title?: string; price_drop_percentage?: number }>;
};

type Operational = {
  crawlerLogs: Array<{ id?: string; status?: string; message?: string; created_at?: string }>;
  postsToday: number;
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [operational, setOperational] = useState<Operational | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewResult, operationalResult, configResult, plansResult] = await Promise.all([
        api.getOverview(),
        api.getOperational(),
        api.getConfig(),
        api.listMonthlyPlans(6),
      ]);
      if (!overviewResult.success) throw new Error('Falha ao carregar analytics');
      if (!operationalResult.success) throw new Error('Falha ao carregar métricas operacionais');
      if (!configResult.success) throw new Error('Falha ao carregar configuração');
      if (!plansResult.success) throw new Error('Falha ao carregar planos');
      setOverview(overviewResult.data);
      setOperational(operationalResult.data);
      setConfig(configResult.data);
      setPlans(plansResult.data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  const scheduled = plans.reduce((sum, plan) => sum + (plan.posts ?? []).filter(post => post.status === 'scheduled').length, 0);
  const failed = plans.reduce((sum, plan) => sum + (plan.posts ?? []).filter(post => post.status === 'failed').length, 0);
  const activeGroups = config?.facebook.activeGroups.filter(group => group.active).length ?? 0;

  if (loading) return <div className="p-8 text-gray-400">Carregando dados reais...</div>;

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)]">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel Operacional</h1>
          <p className="text-gray-400 mt-1">Dados consolidados do backend e Supabase{lastUpdate ? ` · ${lastUpdate.toLocaleTimeString('pt-BR')}` : ''}</p>
        </div>
        <button onClick={() => void load()} className="premium-button px-4 py-2 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Atualizar</button>
      </header>

      {error && <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Metric title="Produtos" value={overview?.totalProducts ?? 0} icon={Package} />
        <Metric title="Links monitorados" value={overview?.activeLinks ?? 0} icon={Activity} />
        <Metric title="Quedas hoje" value={overview?.priceDropsToday ?? 0} icon={AlertTriangle} />
        <Metric title="Posts hoje" value={operational?.postsToday ?? 0} icon={Facebook} />
        <Metric title="Agendados" value={scheduled} icon={Calendar} />
        <Metric title="Grupos ativos" value={activeGroups} icon={Database} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="premium-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Planos mensais</h2>
          {plans.length === 0 ? <p className="text-gray-500">Nenhum plano persistido.</p> : <div className="space-y-3">{plans.map(plan => <button key={plan.id} onClick={() => navigate('/planner')} className="w-full text-left p-3 rounded-lg bg-surface/50 hover:bg-surface border border-border"><div className="flex justify-between gap-3"><span className="text-white">{plan.period_start} → {plan.period_end}</span><span className="text-xs text-gray-400">{plan.status}</span></div><div className="text-xs text-gray-500 mt-1">{plan.posts?.length ?? 0} posts · {plan.posts?.filter(p => p.status === 'scheduled').length ?? 0} agendados</div></button>)}</div>}
          {failed > 0 && <p className="text-red-400 text-sm mt-4">{failed} post(s) com falha nos planos carregados.</p>}
        </section>

        <section className="premium-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Oportunidades reais</h2>
          <div className="flex items-center justify-between mb-4"><span className="text-gray-400">Maior queda monitorada</span><span className="text-2xl font-bold text-accent">{overview?.biggestDrop ?? 0}%</span></div>
          <div className="space-y-2">{overview?.recentOpportunities.slice(0, 5).map(item => <div key={item.id} className="p-3 rounded bg-surface/50"><p className="text-sm text-white">{item.name ?? item.title ?? item.id}</p><p className="text-xs text-gray-400 mt-1">Queda: {item.price_drop_percentage ?? 0}%</p></div>)}</div>
        </section>
      </div>

      <section className="premium-card p-6">
        <h2 className="text-lg font-bold text-white mb-4">Crawler — atividade recente</h2>
        {operational?.crawlerLogs.length ? <div className="space-y-2">{operational.crawlerLogs.slice(0, 8).map((log, index) => <div key={log.id ?? index} className="flex justify-between gap-4 text-sm"><span className="text-gray-300">{log.message ?? log.status ?? 'Execução registrada'}</span><span className="text-gray-500">{log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '—'}</span></div>)}</div> : <p className="text-gray-500">Nenhum registro de crawler encontrado.</p>}
      </section>
    </div>
  );
};

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return <div className="premium-card p-4"><Icon className="w-5 h-5 text-accent mb-3" /><div className="text-2xl font-bold text-white">{value}</div><div className="text-xs text-gray-400">{title}</div></div>;
}
