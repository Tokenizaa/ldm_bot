import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Save,
  Target,
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ScheduledPost {
  id: string;
  content: string;
  type: 'promotion' | 'interaction' | 'institutional' | 'review' | 'question';
  group: string;
  scheduledTime: Date;
  status: 'pending' | 'approved' | 'rejected' | 'published' | 'failed';
  riskScore: number;
  qualityScore: number;
  engagementPrediction: number;
  product?: {
    id: string;
    name: string;
    price: number;
    discount: number;
    image: string;
  };
  metadata: {
    createdAt: Date;
    createdBy: 'system' | 'manual';
    lastModified?: Date;
    retryCount: number;
  };
}

interface QueueStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  published: number;
  failed: number;
  avgRiskScore: number;
  avgQualityScore: number;
  postsToday: number;
  scheduledToday: number;
}

export const ContentPlanner = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    published: 0,
    failed: 0,
    avgRiskScore: 0,
    avgQualityScore: 0,
    postsToday: 0,
    scheduledToday: 0
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'published' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadPosts();
    loadStats();
    
    const interval = setInterval(() => {
      loadPosts();
      loadStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadPosts = async () => {
    try {
      // Mock data - replace with real API call
      const mockPosts: ScheduledPost[] = [
        {
          id: '1',
          content: 'Acabei de testar esta serra circular Makita e o resultado surpreendeu. Precisão de corte excepcional e motor potente. Recomendo para quem trabalha com madeira!',
          type: 'review',
          group: 'Ferramentas Profissionais',
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: 'approved',
          riskScore: 15,
          qualityScore: 92,
          engagementPrediction: 85,
          product: {
            id: '1',
            name: 'Serra Circular Makita 500W',
            price: 1299.90,
            discount: 15,
            image: '/api/placeholder/100/100'
          },
          metadata: {
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            createdBy: 'system',
            retryCount: 0
          }
        },
        {
          id: '2',
          content: 'Alguém já usou a parafusadeira Bosch 18V? Estou pensando em comprar e gostaria de opiniões reais sobre durabilidade e desempenho.',
          type: 'question',
          group: 'Madeira e Construção',
          scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          status: 'pending',
          riskScore: 8,
          qualityScore: 78,
          engagementPrediction: 76,
          metadata: {
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            createdBy: 'system',
            retryCount: 0
          }
        },
        {
          id: '3',
          content: '🔥 OFERTA IMPERDÍVEL! Furadeira Bosch 500W por apenas R$899. Desconto de 30% só hoje. Link nos comentários!',
          type: 'promotion',
          group: 'Ferramentas Profissionais',
          scheduledTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
          status: 'rejected',
          riskScore: 65,
          qualityScore: 45,
          engagementPrediction: 92,
          product: {
            id: '2',
            name: 'Furadeira Bosch 500W',
            price: 899.90,
            discount: 30,
            image: '/api/placeholder/100/100'
          },
          metadata: {
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            createdBy: 'system',
            retryCount: 2
          }
        },
        {
          id: '4',
          content: 'Dica profissional: Ao usar lixadeira orbital, sempre comece com lixa mais grossa e finalize com lixa fina. O resultado fica muito melhor!',
          type: 'institutional',
          group: 'Madeira e Construção',
          scheduledTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
          status: 'approved',
          riskScore: 5,
          qualityScore: 88,
          engagementPrediction: 68,
          metadata: {
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
            createdBy: 'manual',
            retryCount: 0
          }
        },
        {
          id: '5',
          content: 'Testei a parafusadeira DeWalt 18V e fiquei impressionado com a bateria. Dura o dia inteiro de trabalho intenso sem precisar recarregar.',
          type: 'review',
          group: 'Ferramentas Profissionais',
          scheduledTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
          status: 'published',
          riskScore: 12,
          qualityScore: 90,
          engagementPrediction: 82,
          product: {
            id: '3',
            name: 'Parafusadeira DeWalt 18V',
            price: 1599.90,
            discount: 20,
            image: '/api/placeholder/100/100'
          },
          metadata: {
            createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
            createdBy: 'system',
            retryCount: 0
          }
        }
      ];
      
      setPosts(mockPosts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats - replace with real API call
      const mockStats: QueueStats = {
        total: 25,
        pending: 8,
        approved: 12,
        rejected: 3,
        published: 15,
        failed: 2,
        avgRiskScore: 28,
        avgQualityScore: 76,
        postsToday: 12,
        scheduledToday: 8
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updatePostStatus = async (postId: string, status: ScheduledPost['status']) => {
    try {
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status } : post
      ));
      
      // Update post in API
      console.log(`Updating post ${postId} to status: ${status}`);
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      setPosts(prev => prev.filter(post => post.id !== postId));
      setSelectedPost(null);
      
      // Delete post in API
      console.log(`Deleting post: ${postId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const reschedulePost = async (postId: string, newTime: Date) => {
    try {
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, scheduledTime: newTime } : post
      ));
      
      // Reschedule post in API
      console.log(`Rescheduling post ${postId} to: ${newTime}`);
    } catch (error) {
      console.error('Error rescheduling post:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'published': return 'text-blue-400';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 border-red-500/30';
      case 'published': return 'bg-blue-500/20 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 border-red-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'interaction': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'institutional': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'question': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.status === filter;
    const matchesSearch = searchTerm === '' || 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.group.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Planner</h1>
          <p className="text-gray-400">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="premium-button px-4 py-2 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Post
          </button>
          <button className="premium-button px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-4 text-center"
        >
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-4 text-center"
        >
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-gray-400">Pendentes</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-4 text-center"
        >
          <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
          <div className="text-xs text-gray-400">Aprovados</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card p-4 text-center"
        >
          <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
          <div className="text-xs text-gray-400">Rejeitados</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="premium-card p-4 text-center"
        >
          <div className="text-2xl font-bold text-blue-400">{stats.published}</div>
          <div className="text-xs text-gray-400">Publicados</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="premium-card p-4 text-center"
        >
          <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
          <div className="text-xs text-gray-400">Falharam</div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white placeholder-gray-400 outline-none flex-1"
          />
        </div>

        <div className="flex bg-surface border border-border rounded-lg">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'approved', label: 'Aprovados' },
            { value: 'rejected', label: 'Rejeitados' },
            { value: 'published', label: 'Publicados' },
            { value: 'failed', label: 'Falharam' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as any)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                filter === option.value
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn("premium-card p-6", selectedPost?.id === post.id && "border-accent/50")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-xs px-2 py-1 rounded border", getStatusBgColor(post.status))}>
                    {post.status.toUpperCase()}
                  </span>
                  <span className={cn("text-xs px-2 py-1 rounded border", getTypeColor(post.type))}>
                    {post.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{post.group}</span>
                  <span className="text-xs text-gray-400">
                    {formatDate(post.scheduledTime)}
                  </span>
                </div>
                
                <p className="text-white mb-3 line-clamp-3">{post.content}</p>
                
                {post.product && (
                  <div className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg mb-3">
                    <img 
                      src={post.product.image} 
                      alt={post.product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{post.product.name}</p>
                      <p className="text-xs text-gray-400">
                        R$ {post.product.price.toFixed(2)} • -{post.product.discount}%
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span className={getScoreColor(post.riskScore)}>
                      Risco: {post.riskScore}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span className={getScoreColor(post.qualityScore)}>
                      Qualidade: {post.qualityScore}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-green-400">
                      Engajamento: {post.engagementPrediction}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setSelectedPost(post)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                {post.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updatePostStatus(post.id, 'approved')}
                      className="text-green-400 hover:text-green-300"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updatePostStatus(post.id, 'rejected')}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {post.status === 'approved' && (
                  <button
                    onClick={() => updatePostStatus(post.id, 'pending')}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-border pt-3">
              <div>
                Criado: {formatDate(post.metadata.createdAt)} • 
                Por: {post.metadata.createdBy === 'system' ? 'Sistema' : 'Manual'}
              </div>
              {post.metadata.retryCount > 0 && (
                <div className="text-yellow-400">
                  Tentativas: {post.metadata.retryCount}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhum post encontrado</p>
            <p className="text-sm mt-2">
              {searchTerm ? 'Tente ajustar sua busca' : 'Nenhum post corresponde aos filtros selecionados'}
            </p>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedPost(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="premium-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Detalhes do Post</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Conteúdo</h4>
                <p className="text-gray-300">{selectedPost.content}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Informações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tipo:</span>
                      <span className={cn("px-2 py-1 rounded border text-xs", getTypeColor(selectedPost.type))}>
                        {selectedPost.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={cn("px-2 py-1 rounded border text-xs", getStatusBgColor(selectedPost.status))}>
                        {selectedPost.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Grupo:</span>
                      <span className="text-white">{selectedPost.group}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Agendado:</span>
                      <span className="text-white">{formatDate(selectedPost.scheduledTime)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Métricas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Score Risco:</span>
                      <span className={getScoreColor(selectedPost.riskScore)}>
                        {selectedPost.riskScore}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Score Qualidade:</span>
                      <span className={getScoreColor(selectedPost.qualityScore)}>
                        {selectedPost.qualityScore}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Engajamento Previsto:</span>
                      <span className="text-green-400">{selectedPost.engagementPrediction}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedPost.product && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Produto</h4>
                  <div className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg">
                    <img 
                      src={selectedPost.product.image} 
                      alt={selectedPost.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{selectedPost.product.name}</p>
                      <p className="text-xs text-gray-400">
                        R$ {selectedPost.product.price.toFixed(2)} • -{selectedPost.product.discount}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Ações</h4>
                <div className="flex items-center gap-2">
                  {selectedPost.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          updatePostStatus(selectedPost.id, 'approved');
                          setSelectedPost(null);
                        }}
                        className="premium-button px-4 py-2 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          updatePostStatus(selectedPost.id, 'rejected');
                          setSelectedPost(null);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </>
                  )}
                  
                  {selectedPost.status === 'approved' && (
                    <button
                      onClick={() => {
                        updatePostStatus(selectedPost.id, 'pending');
                        setSelectedPost(null);
                      }}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pausar
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      deletePost(selectedPost.id);
                      setSelectedPost(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
