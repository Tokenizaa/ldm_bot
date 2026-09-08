import React, { useState } from 'react';
import { 
  Link2, 
  Plus, 
  Search, 
  Filter, 
  TrendingDown, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit, 
  Upload, 
  Download,
  Activity,
  DollarSign,
  Target,
  AlertCircle
} from 'lucide-react';
import { useAffiliateLinks, useAffiliateLinkStats } from '../hooks/useAffiliateLinks';
import { AffiliateLink } from '../types';
import { affiliateLinkService } from '../services/affiliateLinkService';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export const AffiliateLinkManager = () => {
  const { links, loading, error, refetch } = useAffiliateLinks();
  const { stats, loading: statsLoading } = useAffiliateLinkStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  const [filter, setFilter] = useState<'all' | 'monitored' | 'opportunities'>('all');

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'monitored') return matchesSearch && link.monitored;
    if (filter === 'opportunities') return matchesSearch && (link.price_drop_percentage || 0) > 5;
    return matchesSearch;
  });

  const handleToggleMonitoring = async (id: string, monitored: boolean) => {
    try {
      await affiliateLinkService.toggleMonitoring(id, monitored);
      refetch();
    } catch (error) {
      console.error('Error toggling monitoring:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este link?')) {
      try {
        await affiliateLinkService.deleteLink(id);
        refetch();
      } catch (error) {
        console.error('Error deleting link:', error);
      }
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)] pb-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Link2 className="text-accent w-8 h-8" />
            Affiliate Link Manager
          </h2>
          <p className="text-gray-400 mt-1">Gerenciamento centralizado de links afiliados e monitoramento de preços</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white/5 border border-border px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all">
            <Upload className="w-4 h-4" />
            Importar
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Link
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Links Monitorados" 
          value={stats?.total_monitored || 0}
          icon={Link2}
          trend={null}
          color="text-blue-500"
        />
        <StatCard 
          title="Links Ativos" 
          value={stats?.active_links || 0}
          icon={Activity}
          trend={null}
          color="text-green-500"
        />
        <StatCard 
          title="Quedas Hoje" 
          value={stats?.price_drops_today || 0}
          icon={TrendingDown}
          trend="down"
          color="text-red-500"
        />
        <StatCard 
          title="Maior Queda" 
          value={`R$${(stats?.biggest_drop || 0).toFixed(2)}`}
          icon={DollarSign}
          trend="down"
          color="text-orange-500"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <FilterButton 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
            label="Todos"
            count={links.length}
          />
          <FilterButton 
            active={filter === 'monitored'} 
            onClick={() => setFilter('monitored')}
            label="Monitorados"
            count={links.filter(l => l.monitored).length}
          />
          <FilterButton 
            active={filter === 'opportunities'} 
            onClick={() => setFilter('opportunities')}
            label="Oportunidades"
            count={links.filter(l => (l.price_drop_percentage || 0) > 5).length}
          />
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por produto, marca ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/5 border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent w-64"
          />
        </div>
      </div>

      {/* Links Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Atual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monitoramento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLinks.map((link) => (
                <motion.tr 
                  key={link.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">{link.product_name}</div>
                      <div className="text-xs text-gray-500">{link.brand}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-white/10 text-gray-300 rounded-full">
                      {link.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">
                      R${link.current_price?.toFixed(2)}
                    </div>
                    {link.lowest_price && link.lowest_price < link.current_price && (
                      <div className="text-xs text-gray-500">
                        Menor: R${link.lowest_price.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {link.price_drop_percentage ? (
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-green-500" />
                        <span className="text-sm font-medium text-green-500">
                          -{link.price_drop_percentage.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {link.opportunity_score ? (
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-white/10 rounded-full h-2 max-w-[60px]">
                          <div 
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${link.opportunity_score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{link.opportunity_score}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleMonitoring(link.id, !link.monitored)}
                      className={cn(
                        "p-1 rounded-lg transition-colors",
                        link.monitored 
                          ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                          : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
                      )}
                    >
                      {link.monitored ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(link.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredLinks.length === 0 && !loading && (
            <div className="text-center py-12">
              <Link2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum link encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Categories and Brands */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Categorias</h3>
            <div className="space-y-3">
              {stats.top_categories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <span className="text-sm text-white">{category.name}</span>
                  </div>
                  <span className="text-sm text-accent font-medium">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Marcas</h3>
            <div className="space-y-3">
              {stats.top_brands.map((brand, index) => (
                <div key={brand.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <span className="text-sm text-white">{brand.name}</span>
                  </div>
                  <span className="text-sm text-accent font-medium">{brand.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="premium-card p-6 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingDown className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-500">Tendência de queda</span>
        </div>
      )}
    </div>
  </div>
);

const FilterButton = ({ active, onClick, label, count }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
      active 
        ? "bg-accent text-white" 
        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
    )}
  >
    {label} ({count})
  </button>
);
