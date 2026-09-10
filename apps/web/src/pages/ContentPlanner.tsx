import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Loader2, Plus, RefreshCw, Send, Wand2 } from 'lucide-react';
import { api, type MonthlyPlan, type MonthlyPost } from '../lib/api';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  scheduled: 'Agendado',
  published: 'Publicado',
  failed: 'Falhou',
};

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function statusClass(status: string) {
  if (status === 'published') return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  if (status === 'scheduled') return 'text-green-400 bg-green-500/10 border-green-500/20';
  if (status === 'failed') return 'text-red-400 bg-red-500/10 border-red-500/20';
  return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
}

export const ContentPlanner = () => {
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.listMonthlyPlans();
      if (!result.success) throw new Error('Falha ao carregar planos');
      setPlans(result.data);
      setSelectedPlanId(current => current && result.data.some(p => p.id === current) ? current : result.data[0]?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o Planner');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
  const posts = selectedPlan?.posts ?? [];

  const stats = useMemo(() => posts.reduce((acc, post) => {
    acc.total += 1;
    if (post.status === 'draft') acc.draft += 1;
    if (post.status === 'scheduled') acc.scheduled += 1;
    if (post.status === 'published') acc.published += 1;
    if (post.status === 'failed') acc.failed += 1;
    return acc;
  }, { total: 0, draft: 0, scheduled: 0, published: 0, failed: 0 }), [posts]);

  const run = async (action: string, fn: () => Promise<unknown>) => {
    try {
      setBusy(action);
      setError(null);
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operação não concluída');
    } finally {
      setBusy(null);
    }
  };

  const createPlan = async () => {
    const date = new Date();
    date.setDate(1);
    const periodStart = date.toISOString().slice(0, 10);
    await run('create', async () => {
      const result = await api.createMonthlyPlan(periodStart);
      if (!result.success) throw new Error('Falha ao criar plano');
      setSelectedPlanId(result.data.id);
    });
  };

  const actionForPlan = (action: 'fill' | 'generate' | 'schedule') => {
    if (!selectedPlan) return;
    if (action === 'fill') return run('fill', () => api.fillMonthlyPlan(selectedPlan.id));
    if (action === 'generate') return run('generate', () => api.generateMonthlyPlan(selectedPlan.id));
    return run('schedule', () => api.scheduleMonthlyPlanFacebook(selectedPlan.id));
  };

  if (loading) {
    return <div className="p-8 flex items-center gap-3 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /> Carregando dados reais do Planner...</div>;
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Planner</h1>
          <p className="text-gray-400 mt-1">Planos e posts persistidos no backend/Supabase.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} disabled={loading} className="premium-button px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
          <button onClick={() => void createPlan()} disabled={busy !== null} className="premium-button px-4 py-2 flex items-center gap-2">
            {busy === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Novo plano
          </button>
        </div>
      </header>

      {error && <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300">{error}</div>}

      {plans.length === 0 ? (
        <div className="premium-card p-10 text-center">
          <Calendar className="w-10 h-10 mx-auto text-gray-500 mb-3" />
          <p className="text-white font-medium">Nenhum plano mensal encontrado.</p>
          <p className="text-gray-500 mt-1">Crie o primeiro plano para iniciar o fluxo real.</p>
        </div>
      ) : (
        <>
          <div className="premium-card p-4">
            <label className="block text-sm text-gray-400 mb-2">Plano mensal</label>
            <select value={selectedPlanId ?? ''} onChange={e => setSelectedPlanId(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white">
              {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.period_start} → {plan.period_end} · {statusLabels[plan.status] ?? plan.status}</option>)}
            </select>
          </div>

          {selectedPlan && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Stat label="Posts" value={stats.total} />
                <Stat label="Rascunhos" value={stats.draft} />
                <Stat label="Agendados" value={stats.scheduled} />
                <Stat label="Publicados" value={stats.published} />
                <Stat label="Falhas" value={stats.failed} />
              </div>

              <div className="premium-card p-4 flex flex-wrap gap-2">
                <ActionButton icon={Wand2} label="Selecionar produtos" busy={busy === 'fill'} disabled={busy !== null} onClick={() => void actionForPlan('fill')} />
                <ActionButton icon={Wand2} label="Gerar copies" busy={busy === 'generate'} disabled={busy !== null} onClick={() => void actionForPlan('generate')} />
                <ActionButton icon={Send} label="Agendar no Facebook" busy={busy === 'schedule'} disabled={busy !== null || !posts.some(p => p.content)} onClick={() => void actionForPlan('schedule')} />
              </div>

              <div className="space-y-3">
                {posts.length === 0 ? <div className="premium-card p-8 text-gray-400">Este plano ainda não possui posts.</div> : posts.map(post => <PostCard key={post.id} post={post} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="premium-card p-4"><div className="text-2xl font-bold text-white">{value}</div><div className="text-xs text-gray-400">{label}</div></div>;
}

function ActionButton({ icon: Icon, label, busy, disabled, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; busy: boolean; disabled: boolean; onClick: () => void }) {
  return <button onClick={onClick} disabled={disabled} className="premium-button px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}{label}</button>;
}

function PostCard({ post }: { post: MonthlyPost }) {
  return (
    <div className="premium-card p-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">#{post.slot_index + 1}</span>
            <span className={`text-xs px-2 py-1 rounded border ${statusClass(post.status)}`}>{statusLabels[post.status] ?? post.status}</span>
            <span className="text-xs text-gray-500">{post.post_type}</span>
          </div>
          <p className="text-white whitespace-pre-wrap">{post.content || 'Conteúdo ainda não gerado.'}</p>
          {post.link && <p className="text-xs text-accent mt-2 truncate">{post.link}</p>}
        </div>
        <div className="text-sm text-gray-400 flex items-center gap-2 whitespace-nowrap"><Clock className="w-4 h-4" />{formatDate(post.scheduled_at)}</div>
      </div>
      <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
        <span>{post.group_name}</span>
        <span>Tentativas: {post.attempts}</span>
        {post.facebook_permalink && <a className="text-accent" href={post.facebook_permalink} target="_blank" rel="noreferrer">Facebook</a>}
        {post.last_error && <span className="text-red-400">{post.last_error}</span>}
      </div>
    </div>
  );
}
