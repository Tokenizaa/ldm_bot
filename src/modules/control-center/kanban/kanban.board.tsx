import React, { useState, useEffect } from 'react';
import { 
  GripVertical, 
  Plus, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Eye,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  Users,
  BarChart3,
  Edit,
  Trash2,
  Copy,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export interface KanbanItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  due_date?: string;
  tags: string[];
  product_id?: string;
  persona?: string;
  content_type?: string;
  spam_score?: number;
  confidence?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  color: string;
  limit?: number;
}

export const KanbanBoard = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'detected',
      title: 'Detectado',
      items: [],
      color: 'border-gray-600',
      limit: 20
    },
    {
      id: 'analyzing',
      title: 'Analisando',
      items: [],
      color: 'border-blue-600'
    },
    {
      id: 'copy_generated',
      title: 'Copy Gerada',
      items: [],
      color: 'border-purple-600'
    },
    {
      id: 'review',
      title: 'Revisão',
      items: [],
      color: 'border-orange-600'
    },
    {
      id: 'approved',
      title: 'Aprovado',
      items: [],
      color: 'border-green-600'
    },
    {
      id: 'scheduled',
      title: 'Agendado',
      items: [],
      color: 'border-indigo-600'
    },
    {
      id: 'publishing',
      title: 'Publicando',
      items: [],
      color: 'border-cyan-600'
    },
    {
      id: 'published',
      title: 'Publicado',
      items: [],
      color: 'border-emerald-600'
    },
    {
      id: 'high_conversion',
      title: 'Alta Conversão',
      items: [],
      color: 'border-yellow-600'
    },
    {
      id: 'spam_risk',
      title: 'Spam Risk',
      items: [],
      color: 'border-red-600'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null);

  useEffect(() => {
    // Gerar dados iniciais de exemplo
    generateInitialData();
  }, []);

  const generateInitialData = () => {
    const sampleItems: KanbanItem[] = [
      {
        id: '1',
        title: 'Furadeira Bosch GSB 18V',
        description: 'Furadeira/parafusadeira 18V 2Ah - desconto 35%',
        priority: 'high',
        assignee: 'AI System',
        due_date: new Date(Date.now() + 86400000).toISOString(),
        tags: ['bosch', 'furadeira', 'promoção'],
        product_id: 'prod_123',
        persona: 'tecnico_profissional',
        content_type: 'offer',
        spam_score: 15,
        confidence: 92,
        status: 'detected',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Kit Makita DDL182Z',
        description: 'Parafusadeira impact 18V + baterias + carregador',
        priority: 'medium',
        assignee: 'AI System',
        tags: ['makita', 'kit', 'impact'],
        product_id: 'prod_456',
        persona: 'mecanico_raiz',
        content_type: 'review',
        spam_score: 8,
        confidence: 87,
        status: 'analyzing',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Serra Circular DeWalt',
        description: 'Serra circular 1650W 185mm com guia',
        priority: 'urgent',
        assignee: 'AI System',
        due_date: new Date(Date.now() + 3600000).toISOString(),
        tags: ['dewalt', 'serra', 'urgente'],
        product_id: 'prod_789',
        persona: 'especialista_bosch',
        content_type: 'offer',
        spam_score: 22,
        confidence: 78,
        status: 'copy_generated',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Pergunta: Qual melhor marca?',
        description: 'Engajamento sobre preferência de marcas de ferramentas',
        priority: 'low',
        assignee: 'AI System',
        tags: ['pergunta', 'engajamento'],
        content_type: 'question',
        spam_score: 5,
        confidence: 95,
        status: 'approved',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Review Kit Ferramentas',
        description: 'Análise completa do kit de ferramentas profissionais',
        priority: 'medium',
        assignee: 'AI System',
        tags: ['review', 'completo'],
        content_type: 'review',
        spam_score: 12,
        confidence: 83,
        status: 'scheduled',
        created_at: new Date(Date.now() - 14400000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Distribuir itens nas colunas
    const updatedColumns = columns.map(column => ({
      ...column,
      items: sampleItems.filter(item => item.status === column.id)
    }));

    setColumns(updatedColumns);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const sourceItems = Array.from(sourceColumn.items);
    const [movedItem] = sourceItems.splice(source.index, 1);

    // Atualizar status do item
    movedItem.status = destColumn.id;
    movedItem.updated_at = new Date().toISOString();

    const destItems = Array.from(destColumn.items);
    destItems.splice(destination.index, 0, movedItem);

    const updatedColumns = columns.map(column => {
      if (column.id === sourceColumn.id) {
        return { ...column, items: sourceItems };
      }
      if (column.id === destColumn.id) {
        return { ...column, items: destItems };
      }
      return column;
    });

    setColumns(updatedColumns);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-500 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getContentTypeIcon = (type?: string) => {
    switch (type) {
      case 'offer': return <Target className="w-4 h-4" />;
      case 'question': return <MessageSquare className="w-4 h-4" />;
      case 'review': return <BarChart3 className="w-4 h-4" />;
      case 'technical_humor': return <Users className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredItems = (items: KanbanItem[]) => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  };

  return (
    <div className="h-full bg-black text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Pipeline Operacional</h1>
            <p className="text-gray-400">Gerenciamento visual do fluxo de publicação</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent"
            >
              <option value="all">Todas Prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>

            {/* Quick Actions */}
            <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 transition-all">
              <Plus className="w-4 h-4" />
              Novo Item
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-10 gap-2 mb-6">
          {columns.map(column => (
            <div key={column.id} className="text-center">
              <div className="text-2xl font-bold text-white">{filteredItems(column.items).length}</div>
              <div className="text-xs text-gray-500">{column.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-10 gap-4 h-[calc(100vh-250px)] overflow-x-auto">
          {columns.map(column => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={`bg-white/5 border-t-2 ${column.color} rounded-t-lg p-3 mb-2`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{column.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {filteredItems(column.items).length}/{column.limit || '∞'}
                    </span>
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      <MoreVertical className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 bg-white/5 rounded-b-lg p-2 overflow-y-auto ${
                      snapshot.isDraggingOver ? 'bg-white/10' : ''
                    }`}
                  >
                    <AnimatePresence>
                      {filteredItems(column.items).map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              whileHover={{ scale: 1.02 }}
                              className={`bg-black/40 border rounded-lg p-3 mb-2 cursor-pointer ${
                                snapshot.isDragging ? 'border-accent shadow-lg shadow-accent/20' : 'border-white/10'
                              } hover:border-white/20 transition-all`}
                            >
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between mb-2"
                              >
                                <div className="flex items-center gap-2">
                                  <GripVertical className="w-3 h-3 text-gray-600" />
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(item.priority)}`}>
                                    {item.priority}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {getContentTypeIcon(item.content_type)}
                                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                                    <MoreVertical className="w-3 h-3 text-gray-500" />
                                  </button>
                                </div>
                              </div>

                              {/* Item Content */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-white line-clamp-1">
                                  {item.title}
                                </h4>
                                <p className="text-xs text-gray-400 line-clamp-2">
                                  {item.description}
                                </p>

                                {/* Tags */}
                                {item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {item.tags.length > 3 && (
                                      <span className="text-xs text-gray-500">+{item.tags.length - 3}</span>
                                    )}
                                  </div>
                                )}

                                {/* Meta Info */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-2">
                                    {item.confidence && (
                                      <span className="text-accent">{item.confidence}%</span>
                                    )}
                                    {item.spam_score !== undefined && (
                                      <span className={item.spam_score > 20 ? 'text-red-400' : 'text-green-400'}>
                                        {item.spam_score}%
                                      </span>
                                    )}
                                  </div>
                                  {item.due_date && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{new Date(item.due_date).toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit' 
                                      })}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
