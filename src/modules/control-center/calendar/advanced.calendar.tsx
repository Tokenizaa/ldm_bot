import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Target,
  MessageSquare,
  BarChart3,
  Users,
  Edit,
  Trash2,
  Copy,
  Eye,
  Bell,
  Filter,
  Search,
  Grid,
  List,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  date: string;
  type: 'offer' | 'question' | 'review' | 'technical_humor';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  product_id?: string;
  product_name?: string;
  persona?: string;
  group_targets: string[];
  spam_score: number;
  confidence: number;
  estimated_reach: number;
  estimated_ctr: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'timeline';
  events: CalendarEvent[];
}

export const AdvancedCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day' | 'timeline'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    generateSampleEvents();
  }, []);

  const generateSampleEvents = () => {
    const sampleEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Furadeira Bosch - Oferta',
        description: 'Furadeira/parafusadeira 18V com 35% OFF',
        start_time: '10:00',
        end_time: '10:30',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'offer',
        priority: 'high',
        status: 'scheduled',
        product_id: 'prod_123',
        product_name: 'Furadeira Bosch GSB 18V',
        persona: 'tecnico_profissional',
        group_targets: ['Ferramentas Profissionais', 'Mecânicos Brasil'],
        spam_score: 15,
        confidence: 92,
        estimated_reach: 2500,
        estimated_ctr: 4.5,
        tags: ['bosch', 'furadeira', 'promoção'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Pergunta: Melhor Marca?',
        description: 'Engajamento sobre preferência de marcas',
        start_time: '14:00',
        end_time: '14:15',
        date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
        type: 'question',
        priority: 'medium',
        status: 'scheduled',
        persona: 'mecanico_raiz',
        group_targets: ['Ferramentas Brasil', 'Profissionais OFF'],
        spam_score: 8,
        confidence: 95,
        estimated_reach: 1800,
        estimated_ctr: 6.2,
        tags: ['pergunta', 'engajamento'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Review Kit Makita',
        description: 'Análise completa do kit 18V',
        start_time: '16:00',
        end_time: '16:30',
        date: format(new Date(Date.now() + 172800000), 'yyyy-MM-dd'),
        type: 'review',
        priority: 'medium',
        status: 'published',
        product_id: 'prod_456',
        product_name: 'Kit Makita DDL182Z',
        persona: 'especialista_bosch',
        group_targets: ['Reviews Ferramentas', 'Mecânicos VIP'],
        spam_score: 12,
        confidence: 87,
        estimated_reach: 3200,
        estimated_ctr: 5.8,
        tags: ['makita', 'review', 'kit'],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Meme Técnico',
        description: 'Humor leve sobre problemas de oficina',
        start_time: '20:00',
        end_time: '20:10',
        date: format(new Date(Date.now() + 259200000), 'yyyy-MM-dd'),
        type: 'technical_humor',
        priority: 'low',
        status: 'scheduled',
        persona: 'influenciador_ferramentas',
        group_targets: ['Mecânicos Humor', 'Oficina BR'],
        spam_score: 5,
        confidence: 78,
        estimated_reach: 1500,
        estimated_ctr: 8.1,
        tags: ['humor', 'meme', 'engajamento'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Alerta Preço Serra',
        description: 'Serra Circular com preço reduzido',
        start_time: '09:00',
        end_time: '09:20',
        date: format(new Date(Date.now() + 345600000), 'yyyy-MM-dd'),
        type: 'offer',
        priority: 'urgent',
        status: 'failed',
        product_id: 'prod_789',
        product_name: 'Serra Circular DeWalt',
        persona: 'cacador_promocoes',
        group_targets: ['Promoções Ferramentas', 'Oportunidades'],
        spam_score: 22,
        confidence: 83,
        estimated_reach: 2800,
        estimated_ctr: 3.9,
        tags: ['dewalt', 'serra', 'urgente', 'promoção'],
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    setEvents(sampleEvents);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'offer': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'question': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'review': return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
      case 'technical_humor': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-3 h-3" />;
      case 'published': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'failed': return <XCircle className="w-3 h-3 text-red-500" />;
      case 'cancelled': return <Pause className="w-3 h-3 text-gray-500" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
    return matchesSearch && matchesType;
  });

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredEvents.filter(event => event.date === dateStr);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Headers */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-500 p-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all ${
                !isCurrentMonth ? 'bg-black/20 border-white/5 text-gray-600' :
                isToday ? 'bg-accent/20 border-accent/30' :
                isSelected ? 'bg-white/10 border-white/20' :
                'bg-black/40 border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${
                  isToday ? 'text-accent' : isCurrentMonth ? 'text-white' : 'text-gray-600'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs text-accent">{dayEvents.length}</span>
                )}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.type)}`}
                    title={event.title}
                  >
                    {event.start_time} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: new Date(weekStart.getTime() + 6 * 86400000) });

    return (
      <div className="grid grid-cols-8 gap-2">
        {/* Time column */}
        <div className="space-y-2">
          <div className="h-10"></div>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="h-16 text-xs text-gray-500 text-right pr-2">
              {`${i + 8}:00`}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className="space-y-2">
            <div className="h-10 text-center font-medium text-white border-b border-white/10">
              {format(day, 'EEE d')}
            </div>
            {Array.from({ length: 12 }, (_, hourIndex) => {
              const hourEvents = getEventsForDate(day).filter(event => {
                const eventHour = parseInt(event.start_time.split(':')[0]);
                return eventHour === hourIndex + 8;
              });

              return (
                <div key={hourIndex} className="h-16 border border-white/5 rounded relative">
                  {hourEvents.map(event => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute inset-0 m-0.5 p-1 rounded ${getEventTypeColor(event.type)} cursor-pointer`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="text-xs font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-75">{event.start_time}</div>
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate || new Date());

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ptBR }) : format(new Date(), 'd MMMM yyyy', { locale: ptBR })}
          </h3>
          <div className="text-sm text-gray-400">
            {dayEvents.length} eventos agendados
          </div>
        </div>

        <div className="space-y-3">
          {dayEvents
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`} />
                    <div>
                      <h4 className="font-medium text-white">{event.title}</h4>
                      <p className="text-sm text-gray-400">{event.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(event.status)}
                    <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Horário:</span>
                    <span className="text-white ml-1">{event.start_time} - {event.end_time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Persona:</span>
                    <span className="text-white ml-1">{event.persona}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Alcance:</span>
                    <span className="text-white ml-1">{event.estimated_reach}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">CTR:</span>
                    <span className="text-accent ml-1">{event.estimated_ctr}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500">Spam Score:</span>
                    <span className={event.spam_score > 20 ? 'text-red-400' : 'text-green-400'}>
                      {event.spam_score}%
                    </span>
                    <span className="text-gray-500">Confiança:</span>
                    <span className="text-accent">{event.confidence}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      <Edit className="w-3 h-3 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      <Trash2 className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const sortedEvents = [...filteredEvents].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.start_time}`);
      const dateB = new Date(`${b.date} ${b.start_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return (
      <div className="space-y-4">
        {sortedEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
          >
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority)}`} />
              {index < sortedEvents.length - 1 && (
                <div className="w-0.5 h-16 bg-white/20 mt-2" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-white">{event.title}</h4>
                  <p className="text-sm text-gray-400">{event.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">{format(new Date(event.date), 'dd/MM')}</div>
                  <div className="text-sm text-white">{event.start_time}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <span className={`px-2 py-1 rounded-full ${getEventTypeColor(event.type)}`}>
                  {event.type}
                </span>
                <span className="text-gray-500">{event.persona}</span>
                <span className="text-accent">{event.estimated_reach} alcance</span>
                <span className="text-accent">{event.estimated_ctr}% CTR</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full bg-black text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Calendário Avançado</h1>
            
            {/* View Type Selector */}
            <div className="flex bg-white/5 p-1 rounded-lg">
              {[
                { id: 'month', label: 'Mês', icon: Grid },
                { id: 'week', label: 'Semana', icon: Calendar },
                { id: 'day', label: 'Dia', icon: List },
                { id: 'timeline', label: 'Timeline', icon: TrendingUp }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => setViewType(view.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewType === view.id
                      ? 'bg-accent text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent"
            >
              <option value="all">Todos Tipos</option>
              <option value="offer">Ofertas</option>
              <option value="question">Perguntas</option>
              <option value="review">Reviews</option>
              <option value="technical_humor">Humor Técnico</option>
            </select>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-2 bg-white/5 rounded-lg min-w-[150px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </div>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 transition-all">
              <Plus className="w-4 h-4" />
              Novo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="h-[calc(100vh-200px)] overflow-auto">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
        {viewType === 'timeline' && renderTimelineView()}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black/90 border border-white/20 rounded-xl p-6 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300">{selectedEvent.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Data/Hora:</span>
                    <p className="text-white">
                      {format(new Date(selectedEvent.date), 'dd/MM/yyyy')} • {selectedEvent.start_time} - {selectedEvent.end_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <p className="text-white capitalize">{selectedEvent.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Persona:</span>
                    <p className="text-white">{selectedEvent.persona}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Prioridade:</span>
                    <p className="text-white capitalize">{selectedEvent.priority}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-all">
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                    <Copy className="w-4 h-4" />
                    Duplicar
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all">
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
