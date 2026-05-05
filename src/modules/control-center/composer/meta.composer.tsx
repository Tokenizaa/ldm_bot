import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Send, 
  Eye, 
  RefreshCw, 
  Sparkles, 
  Users, 
  MessageSquare, 
  Target, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Hash, 
  Image, 
  Video, 
  Link, 
  Smile, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Quote, 
  Code,
  Globe,
  Smartphone,
  Monitor,
  Copy,
  Save,
  X,
  Plus,
  ChevronDown,
  Settings,
  Shield,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OllamaService } from '../../social-ai/ollama/ollama.service';

export interface ContentVariant {
  id: string;
  content: string;
  persona: string;
  spam_score: number;
  ctr_prediction: number;
  confidence: number;
  created_at: string;
}

export interface ComposerPost {
  id: string;
  title: string;
  content: string;
  type: 'offer' | 'question' | 'review' | 'technical_humor';
  persona: string;
  target_groups: string[];
  affiliate_link?: string;
  images: string[];
  videos: string[];
  tags: string[];
  scheduled_time?: string;
  variants: ContentVariant[];
  analytics: {
    spam_score: number;
    ctr_prediction: number;
    engagement_prediction: number;
    conversion_prediction: number;
    humanization_score: number;
  };
  status: 'draft' | 'review' | 'approved' | 'scheduled' | 'published';
  created_at: string;
  updated_at: string;
}

export const MetaComposer = () => {
  const [post, setPost] = useState<ComposerPost>({
    id: '',
    title: '',
    content: '',
    type: 'offer',
    persona: 'tecnico_profissional',
    target_groups: [],
    images: [],
    videos: [],
    tags: [],
    variants: [],
    analytics: {
      spam_score: 0,
      ctr_prediction: 0,
      engagement_prediction: 0,
      conversion_prediction: 0,
      humanization_score: 0
    },
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [activePreview, setActivePreview] = useState<'mobile' | 'desktop'>('mobile');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('tecnico_profissional');
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);

  const ollamaService = new OllamaService();

  const personas = [
    { id: 'tecnico_profissional', name: 'Técnico Profissional', description: 'Especialista técnico, linguagem precisa', icon: '🔧' },
    { id: 'mecanico_raiz', name: 'Mecânico Raiz', description: 'Linguagem informal, experiência prática', icon: '👷' },
    { id: 'especialista_bosch', name: 'Especialista Bosch', description: 'Foco em qualidade Bosch', icon: '⚡' },
    { id: 'cacador_promocoes', name: 'Caçador de Promoções', description: 'Focado em ofertas e descontos', icon: '🎯' },
    { id: 'review_honesto', name: 'Review Honesto', description: 'Análises transparentes', icon: '⭐' },
    { id: 'influenciador_ferramentas', name: 'Influenciador', description: 'Engajamento e tendências', icon: '📱' }
  ];

  const contentTypes = [
    { id: 'offer', name: 'Oferta', icon: Target, color: 'text-green-500' },
    { id: 'question', name: 'Pergunta', icon: MessageSquare, color: 'text-blue-500' },
    { id: 'review', name: 'Review', icon: BarChart3, color: 'text-purple-500' },
    { id: 'technical_humor', name: 'Humor Técnico', icon: Users, color: 'text-yellow-500' }
  ];

  useEffect(() => {
    // Gerar análise inicial quando o conteúdo mudar
    if (post.content.length > 10) {
      analyzeContent();
    }
  }, [post.content, post.persona]);

  const analyzeContent = async () => {
    try {
      const prompt = `
Analise este conteúdo para redes sociais:

Tipo: ${post.type}
Persona: ${post.persona}
Conteúdo: "${post.content}"

Retorne JSON com métricas:
{
  "spam_score": 0-100,
  "ctr_prediction": 0-100,
  "engagement_prediction": 0-100,
  "conversion_prediction": 0-100,
  "humanization_score": 0-100,
  "suggestions": ["sugestão1", "sugestão2"],
  "risk_factors": ["risco1", "risco2"],
  "optimization_tips": ["dica1", "dica2"]
}
      `;

      const response = await ollamaService.generateText(prompt, 'deepseek');
      const analysis = JSON.parse(response);

      setPost(prev => ({
        ...prev,
        analytics: {
          spam_score: analysis.spam_score,
          ctr_prediction: analysis.ctr_prediction,
          engagement_prediction: analysis.engagement_prediction,
          conversion_prediction: analysis.conversion_prediction,
          humanization_score: analysis.humanization_score
        }
      }));
    } catch (error) {
      console.error('Error analyzing content:', error);
    }
  };

  const generateContent = async (type: 'new' | 'variations' = 'new') => {
    setIsGenerating(true);
    
    try {
      const prompt = type === 'new' ? `
Gere conteúdo para redes sociais sobre:
Tipo: ${post.type}
Persona: ${post.persona}
Produto: ${post.title}
Grupos alvo: ${post.target_groups.join(', ')}

Regras:
- Máximo 280 caracteres
- Incluir CTA sutil
- Tom adequado à persona
- Evitar spam

Retorne JSON:
{
  "content": "conteúdo gerado",
  "suggested_hashtags": ["#tag1", "#tag2"],
  "cta_suggestion": "CTA sugerido",
  "confidence": 0-100
}
      ` : `
Gere 5 variações deste conteúdo:
Original: "${post.content}"
Persona: ${post.persona}

Retorne JSON array:
[
  {
    "content": "variação 1",
    "spam_score": 0-100,
    "ctr_prediction": 0-100,
    "confidence": 0-100
  }
]
      `;

      const response = await ollamaService.generateText(prompt, 'llama3');
      const result = JSON.parse(response);

      if (type === 'new') {
        setPost(prev => ({
          ...prev,
          content: result.content,
          tags: result.suggested_hashtags || [],
          updated_at: new Date().toISOString()
        }));
      } else {
        const variants: ContentVariant[] = result.map((variant: any, index: number) => ({
          id: `variant_${Date.now()}_${index}`,
          content: variant.content,
          persona: post.persona,
          spam_score: variant.spam_score,
          ctr_prediction: variant.ctr_prediction,
          confidence: variant.confidence,
          created_at: new Date().toISOString()
        }));

        setPost(prev => ({
          ...prev,
          variants: [...prev.variants, ...variants],
          updated_at: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number, type: 'spam' | 'positive' = 'positive') => {
    if (type === 'spam') {
      return score > 70 ? 'text-red-500' : score > 40 ? 'text-yellow-500' : 'text-green-500';
    } else {
      return score > 70 ? 'text-green-500' : score > 40 ? 'text-yellow-500' : 'text-red-500';
    }
  };

  const renderPreview = () => {
    const content = post.variants[selectedVariant]?.content || post.content;
    
    return (
      <div className="space-y-4">
        {/* Preview Header */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => setActivePreview('mobile')}
                className={`p-2 rounded transition-colors ${
                  activePreview === 'mobile' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivePreview('desktop')}
                className={`p-2 rounded transition-colors ${
                  activePreview === 'desktop' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-gray-400">Preview</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded transition-colors">
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className={`${activePreview === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-2xl mx-auto'} bg-white rounded-lg overflow-hidden`}>
          {/* Mobile Preview */}
          {activePreview === 'mobile' && (
            <div className="bg-gray-50 p-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">FD</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">ForgeDeals AI</div>
                  <div className="text-xs text-gray-500">Há 2 min</div>
                </div>
              </div>

              {/* Content */}
              <div className="text-gray-900 mb-4">
                <p className="whitespace-pre-wrap">{content}</p>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="text-blue-600 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Engagement */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-gray-600">
                  <button className="flex items-center gap-1 hover:text-blue-600">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">24</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-red-600">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">156</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-green-600">
                    <Share className="w-4 h-4" />
                    <span className="text-sm">12</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Preview */}
          {activePreview === 'desktop' && (
            <div className="bg-white p-6">
              <div className="max-w-lg">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">FD</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">ForgeDeals AI</div>
                    <div className="text-sm text-gray-500">Há 2 min • 🌍 Público</div>
                  </div>
                  <button className="ml-auto p-2 hover:bg-gray-100 rounded-full">
                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Content */}
                <div className="text-gray-900 mb-4">
                  <p className="whitespace-pre-wrap text-lg">{content}</p>
                </div>

                {/* Image placeholder */}
                {post.images.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 h-64 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="text-blue-600 hover:underline cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Engagement */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-6 text-gray-600">
                    <button className="flex items-center gap-2 hover:text-blue-600">
                      <MessageSquare className="w-5 h-5" />
                      <span>24</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-red-600">
                      <Heart className="w-5 h-5" />
                      <span>156</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-green-600">
                      <Share className="w-5 h-5" />
                      <span>12</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-black text-white p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Editor Column */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Meta Composer</h1>
              <p className="text-gray-400">Editor avançado com IA e preview em tempo real</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                <Save className="w-4 h-4" />
                Salvar Rascunho
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-all">
                <Send className="w-4 h-4" />
                Publicar
              </button>
            </div>
          </div>

          {/* Content Type Selector */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-400 mb-3">Tipo de Conteúdo</label>
            <div className="grid grid-cols-4 gap-3">
              {contentTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setPost(prev => ({ ...prev, type: type.id as any }))}
                  className={`p-3 rounded-lg border transition-all ${
                    post.type === type.id
                      ? 'border-accent bg-accent/20 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <type.icon className={`w-5 h-5 mx-auto mb-1 ${type.color}`} />
                  <div className="text-xs font-medium">{type.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Persona Selector */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-400">Persona</label>
              <button
                onClick={() => setShowPersonaSelector(!showPersonaSelector)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                  showPersonaSelector ? 'rotate-180' : ''
                }`} />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPersonaSelector(!showPersonaSelector)}
                className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all flex-1"
              >
                <span className="text-2xl">
                  {personas.find(p => p.id === post.persona)?.icon}
                </span>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">
                    {personas.find(p => p.id === post.persona)?.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {personas.find(p => p.id === post.persona)?.description}
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => generateContent('new')}
                disabled={isGenerating}
                className="p-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {showPersonaSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 space-y-2"
                >
                  {personas.map(persona => (
                    <button
                      key={persona.id}
                      onClick={() => {
                        setPost(prev => ({ ...prev, persona: persona.id }));
                        setShowPersonaSelector(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        post.persona === persona.id
                          ? 'bg-accent/20 border-accent/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl">{persona.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{persona.name}</div>
                        <div className="text-xs text-gray-400">{persona.description}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content Editor */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-400">Conteúdo</label>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  <Bold className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  <Italic className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  <List className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  <Link className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  <Smile className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            <textarea
              value={post.content}
              onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Digite seu conteúdo aqui..."
              className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none"
            />
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{post.content.length}/280</span>
              <button
                onClick={() => generateContent('variations')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                Gerar Variações
              </button>
            </div>
          </div>

          {/* Variants */}
          {post.variants.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-400">Variações Geradas</label>
                <span className="text-xs text-accent">{post.variants.length} variações</span>
              </div>
              
              <div className="space-y-2">
                {post.variants.map((variant, index) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedVariant === index
                        ? 'border-accent bg-accent/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Variação {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${getScoreColor(variant.spam_score, 'spam')}`}>
                          Spam: {variant.spam_score}%
                        </span>
                        <span className={`text-xs ${getScoreColor(variant.ctr_prediction)}`}>
                          CTR: {variant.ctr_prediction}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{variant.content}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview & Analytics Column */}
        <div className="space-y-6">
          {/* Analytics Panel */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" />
                Análise IA
              </h3>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Spam Score</span>
                  <Shield className="w-3 h-3 text-gray-600" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(post.analytics.spam_score, 'spam')}`}>
                  {post.analytics.spam_score}%
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      post.analytics.spam_score > 70 ? 'bg-red-500' :
                      post.analytics.spam_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${post.analytics.spam_score}%` }}
                  />
                </div>
              </div>

              <div className="bg-black/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">CTR Previsto</span>
                  <TrendingUp className="w-3 h-3 text-gray-600" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(post.analytics.ctr_prediction)}`}>
                  {post.analytics.ctr_prediction}%
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2">
                  <div 
                    className="bg-green-500 h-full rounded-full transition-all"
                    style={{ width: `${post.analytics.ctr_prediction}%` }}
                  />
                </div>
              </div>

              <div className="bg-black/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Engajamento</span>
                  <Users className="w-3 h-3 text-gray-600" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(post.analytics.engagement_prediction)}`}>
                  {post.analytics.engagement_prediction}%
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${post.analytics.engagement_prediction}%` }}
                  />
                </div>
              </div>

              <div className="bg-black/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Humanização</span>
                  <Sparkles className="w-3 h-3 text-gray-600" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(post.analytics.humanization_score)}`}>
                  {post.analytics.humanization_score}%
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2">
                  <div 
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${post.analytics.humanization_score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {renderPreview()}

          {/* Quick Actions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-bold text-white mb-3">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                <Target className="w-4 h-4 text-accent" />
                <span className="text-sm">Definir Público</span>
              </button>
              <button className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Agendar</span>
              </button>
              <button className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                <Hash className="w-4 h-4 text-green-500" />
                <span className="text-sm">Add Tags</span>
              </button>
              <button className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                <Image className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Add Imagem</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componentes auxiliares que faltam
const Heart = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const Share = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
  </svg>
);

const MoreHorizontal = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);
