// Sistema de Matching Automático - Fase 3
// Interface para recomendações baseadas em competências

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  Zap, Target, Building2, Star, TrendingUp, Users, 
  Filter, ArrowRight, CheckCircle, X, Info
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface MatchingRecommendation {
  id: string;
  mentor_id?: string;
  company_id: string;
  compatibility_score: number;
  recommendation_reason: string;
  company_name: string;
  company_sector: string;
  company_stage: string;
  mentor_name: string;
  expertise: string;
  matching_criteria: {
    expertise_match: number;
    industry_match: number;
    stage_experience: number;
    availability_score: number;
  };
  created_at: string;
  status: string;
}

interface MatchingFilters {
  min_score: number;
  sector?: string;
  stage?: string;
  expertise?: string;
}

export default function MentorMatchingSystem() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  const [recommendations, setRecommendations] = useState<MatchingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MatchingFilters>({ min_score: 60 });
  const [processing, setProcessing] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [filters]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('mentor_compatibility_ranking')
        .select('*')
        .gte('compatibility_score', filters.min_score)
        .order('compatibility_score', { ascending: false });

      // Aplicar filtros
      if (profile?.role === 'mentor') {
        query = query.eq('mentor_id', profile.id);
      }
      if (filters.sector) {
        query = query.ilike('company_sector', `%${filters.sector}%`);
      }
      if (filters.stage) {
        query = query.eq('company_stage', filters.stage);
      }
      if (filters.expertise) {
        query = query.ilike('expertise', `%${filters.expertise}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      setRecommendations(data || []);

    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar as recomendações'
      });
    } finally {
      setLoading(false);
    }
  };

  // Processar recomendação (aceitar/rejeitar)
  const processRecommendation = async (
    recommendationId: string, 
    action: 'approved' | 'rejected', 
    notes?: string
  ) => {
    try {
      setProcessing(recommendationId);
      
      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (!recommendation) return;

      const response = await supabase.functions.invoke('mentor-matching-algorithm', {
        body: {
          action: 'process_recommendation',
          mentor_id: recommendation.mentor_id || profile.id,
          company_id: recommendation.company_id,
          status: action,
          notes
        }
      });

      if (response.data?.success) {
        addToast({
          type: 'success',
          title: 'Processado com sucesso',
          description: `Recomendação ${action === 'approved' ? 'aceita' : 'rejeitada'}${
            response.data.mentorship_created ? ' e mentorship criada' : ''
          }`
        });

        // Remover da lista
        setRecommendations(prev => 
          prev.filter(r => r.id !== recommendationId)
        );

      } else {
        throw new Error(response.data?.message || 'Erro ao processar recomendação');
      }

    } catch (error) {
      console.error('Erro ao processar recomendação:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível processar a recomendação'
      });
    } finally {
      setProcessing(null);
    }
  };

  // Gerar novas recomendações para uma empresa
  const generateRecommendations = async (companyId?: string) => {
    try {
      setLoading(true);

      const response = await supabase.functions.invoke('mentor-matching-algorithm', {
        body: {
          action: 'generate_recommendations',
          company_id: companyId
        }
      });

      if (response.data?.success) {
        addToast({
          type: 'success',
          title: 'Recomendações geradas',
          description: `${response.data.recommendations_count} novas recomendações criadas`
        });
        
        await loadRecommendations();
      } else {
        throw new Error(response.data?.message || 'Erro ao gerar recomendações');
      }

    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível gerar recomendações'
      });
    } finally {
      setLoading(false);
    }
  };

  // Obter cor do badge baseado no score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Obter ícone baseado no estágio da empresa
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'idea': return '💡';
      case 'mvp': return '🚀';
      case 'growth': return '📈';
      case 'scale': return '🌍';
      default: return '🏢';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Mentor', href: '/mentor/dashboard' },
          { label: 'Sistema de Matching', href: '/mentor/matching' }
        ]} />
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Zap className="w-8 h-8 mr-3 text-yellow-500" />
              Sistema de Matching Automático
            </h1>
            <p className="text-gray-600 mt-1">
              Recomendações baseadas em compatibilidade de competências
            </p>
          </div>

          {profile?.role === 'admin' && (
            <Button
              variant="primary"
              onClick={() => generateRecommendations()}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Gerar Recomendações</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Score mínimo:</label>
            <select 
              value={filters.min_score} 
              onChange={(e) => setFilters(prev => ({ ...prev, min_score: parseInt(e.target.value) }))}
              className="rounded border-gray-300 text-sm"
            >
              <option value="60">60%</option>
              <option value="70">70%</option>
              <option value="80">80%</option>
              <option value="90">90%</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Setor:</label>
            <select 
              value={filters.sector || ''} 
              onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value || undefined }))}
              className="rounded border-gray-300 text-sm"
            >
              <option value="">Todos</option>
              <option value="tecnologia">Tecnologia</option>
              <option value="fintech">Fintech</option>
              <option value="saúde">Saúde</option>
              <option value="educação">Educação</option>
              <option value="varejo">Varejo</option>
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilters({ min_score: 60 })}
          >
            Limpar
          </Button>
        </div>
      </Card>

      {/* Lista de Recomendações */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {recommendations.length}
                </div>
                <div className="text-sm text-gray-600">
                  Recomendações Ativas
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(recommendations.reduce((acc, r) => acc + r.compatibility_score, 0) / recommendations.length)}%
                </div>
                <div className="text-sm text-gray-600">
                  Score Médio
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {recommendations.filter(r => r.compatibility_score >= 80).length}
                </div>
                <div className="text-sm text-gray-600">
                  Alta Compatibilidade
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {new Set(recommendations.map(r => r.company_sector)).size}
                </div>
                <div className="text-sm text-gray-600">
                  Setores Únicos
                </div>
              </div>
            </Card>
          </div>

          {/* Grid de Recomendações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
                      {getStageIcon(rec.company_stage)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{rec.company_name}</h3>
                      <p className="text-sm text-gray-600">{rec.company_sector}</p>
                      <Badge className={getScoreColor(rec.compatibility_score)}>
                        {rec.compatibility_score}% compatível
                      </Badge>
                    </div>
                  </div>
                  
                  <Badge variant="info" className="capitalize">
                    {rec.company_stage}
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-3">{rec.recommendation_reason}</p>
                  
                  {/* Detalhes de compatibilidade */}
                  {showDetails === rec.id && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Detalhes da Compatibilidade:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Expertise</span>
                          <span>{rec.matching_criteria?.expertise_match || 'N/A'}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Setor</span>
                          <span>{rec.matching_criteria?.industry_match || 'N/A'}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Experiência</span>
                          <span>{rec.matching_criteria?.stage_experience || 'N/A'}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Disponibilidade</span>
                          <span>{rec.matching_criteria?.availability_score || 'N/A'}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDetails(showDetails === rec.id ? null : rec.id)}
                      className="p-0 h-auto"
                    >
                      <Info className="w-4 h-4 mr-1" />
                      {showDetails === rec.id ? 'Ocultar' : 'Ver'} detalhes
                    </Button>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex space-x-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => processRecommendation(rec.id, 'rejected')}
                    disabled={processing === rec.id}
                    className="flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Rejeitar</span>
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => processRecommendation(rec.id, 'approved')}
                    disabled={processing === rec.id}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Aceitar Mentoria</span>
                  </Button>
                </div>

                {/* Data de criação */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Criado em {new Date(rec.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma recomendação encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Não há recomendações de matching que atendam aos filtros aplicados.
          </p>
          {profile?.role === 'admin' && (
            <Button
              variant="primary"
              onClick={() => generateRecommendations()}
              disabled={loading}
            >
              Gerar Novas Recomendações
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}