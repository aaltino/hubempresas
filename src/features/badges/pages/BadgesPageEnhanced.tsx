// Enhanced Badges Page - FASE 2
// Sistema de Badges com 4 Níveis, Gamificação e Timeline

import { useEffect, useState } from 'react';
import { supabase, type Badge, type CompanyBadge } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  Award, Trophy, Star, Lock, Unlock, TrendingUp, 
  Calendar, CheckCircle, Target, Zap
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Badge as BadgeUI } from '@/design-system/ui/Badge';
import { DashboardSkeleton } from '@/design-system/feedback/Skeleton';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface BadgeWithProgress extends Badge {
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  companyBadge?: CompanyBadge;
}

export default function BadgesPageEnhanced() {
  const { profile } = useAuth();
  const { addToast } = useToast();
  
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [companyBadges, setCompanyBadges] = useState<CompanyBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      loadCompanyAndBadges();
    }
  }, [profile]);

  const loadCompanyAndBadges = async () => {
    try {
      setLoading(true);

      // Buscar empresa do usuário
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile?.id)
        .maybeSingle();

      if (!companyData) {
        setLoading(false);
        return;
      }

      setCompanyId(companyData.id);

      // Buscar todos os badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (badgesError) throw badgesError;

      // Buscar badges conquistados pela empresa
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('company_badges')
        .select('*, badge:badges(*)')
        .eq('company_id', companyData.id);

      if (earnedError) throw earnedError;

      setCompanyBadges(earnedBadges || []);

      // Calcular pontos totais
      const points = (earnedBadges || []).reduce((sum, cb) => {
        return sum + ((cb.badge as Badge)?.points || 0);
      }, 0);
      setTotalPoints(points);

      // Combinar badges com status de conquista
      const badgesWithProgress: BadgeWithProgress[] = (allBadges || []).map(badge => {
        const earnedBadge = (earnedBadges || []).find(
          cb => (cb.badge as Badge)?.badge_key === badge.badge_key
        );

        return {
          ...badge,
          isUnlocked: !!earnedBadge,
          unlockedAt: earnedBadge?.awarded_at,
          progress: earnedBadge ? 100 : calculateBadgeProgress(badge, companyData.id),
          companyBadge: earnedBadge
        };
      });

      setBadges(badgesWithProgress);
    } catch (error) {
      console.error('Erro ao carregar badges:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar os badges'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBadgeProgress = (badge: Badge, companyId: string): number => {
    // TODO: Implementar cálculo de progresso real baseado em critérios
    // Por enquanto, retorna um valor simulado
    if (!badge.criteria) return 0;
    
    // Exemplo: Se badge requer 100% em questionário, verificar completion
    const criteriaObj = badge.criteria as any;
    if (criteriaObj.questionnaire_completion) {
      // Buscar completion real do questionário
      return Math.random() * 100; // Placeholder
    }

    return 0;
  };

  const getBadgeLevelIcon = (level?: string) => {
    switch (level) {
      case 'bronze':
        return <Award className="w-6 h-6 text-orange-600" />;
      case 'silver':
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 'gold':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'platinum':
        return <Star className="w-6 h-6 text-blue-500" />;
      default:
        return <Award className="w-6 h-6 text-gray-400" />;
    }
  };

  const getBadgeLevelColor = (level?: string) => {
    switch (level) {
      case 'bronze':
        return 'from-orange-500 to-orange-700';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'platinum':
        return 'from-blue-400 to-blue-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getBadgeLevelLabel = (level?: string) => {
    switch (level) {
      case 'bronze':
        return 'Bronze';
      case 'silver':
        return 'Prata';
      case 'gold':
        return 'Ouro';
      case 'platinum':
        return 'Platina';
      default:
        return level;
    }
  };

  const filteredBadges = selectedLevel
    ? badges.filter(b => b.level === selectedLevel)
    : badges;

  const unlockedBadges = badges.filter(b => b.isUnlocked);
  const lockedBadges = badges.filter(b => !b.isUnlocked);

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Badges', icon: <Award className="w-4 h-4" /> }
        ]} />
        <DashboardSkeleton />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Badges', icon: <Award className="w-4 h-4" /> }
        ]} />
        <Card className="p-12 text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Empresa Não Encontrada
          </h3>
          <p className="text-gray-600">
            Você precisa estar vinculado a uma empresa para ver os badges.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Badges', icon: <Award className="w-4 h-4" /> }
      ]} />

      {/* Header com estatísticas */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center mb-2">
              <Trophy className="w-5 h-5 mr-2" />
              <span className="text-purple-100">Total de Badges</span>
            </div>
            <p className="text-3xl font-bold">{unlockedBadges.length}</p>
            <p className="text-sm text-purple-100">
              de {badges.length} disponíveis
            </p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <Star className="w-5 h-5 mr-2" />
              <span className="text-purple-100">Pontos</span>
            </div>
            <p className="text-3xl font-bold">{totalPoints}</p>
            <p className="text-sm text-purple-100">
              pontos acumulados
            </p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="text-purple-100">Progresso</span>
            </div>
            <p className="text-3xl font-bold">
              {Math.round((unlockedBadges.length / badges.length) * 100)}%
            </p>
            <p className="text-sm text-purple-100">
              completo
            </p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <Zap className="w-5 h-5 mr-2" />
              <span className="text-purple-100">Nível</span>
            </div>
            <p className="text-3xl font-bold">
              {unlockedBadges.length < 5 ? 'Iniciante' :
               unlockedBadges.length < 10 ? 'Intermediário' :
               unlockedBadges.length < 15 ? 'Avançado' : 'Expert'}
            </p>
            <p className="text-sm text-purple-100">
              continue conquistando
            </p>
          </div>
        </div>
      </div>

      {/* Filtros por nível */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedLevel(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedLevel === null
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          Todos ({badges.length})
        </button>
        {['bronze', 'silver', 'gold', 'platinum'].map(level => {
          const count = badges.filter(b => b.level === level).length;
          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {getBadgeLevelLabel(level)} ({count})
            </button>
          );
        })}
      </div>

      {/* Badges Conquistados */}
      {unlockedBadges.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Unlock className="w-6 h-6 mr-2 text-green-600" />
            Badges Conquistados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBadges.filter(b => b.isUnlocked).map((badge) => (
              <Card key={badge.id} className="p-6 hover:shadow-lg transition-shadow border-2 border-green-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getBadgeLevelColor(badge.level)} flex items-center justify-center shadow-lg`}>
                    {getBadgeLevelIcon(badge.level)}
                  </div>
                  <BadgeUI className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Conquistado
                  </BadgeUI>
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {badge.label}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {badge.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {badge.unlockedAt 
                      ? new Date(badge.unlockedAt).toLocaleDateString('pt-BR')
                      : 'Data não disponível'}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-semibold text-gray-900">
                      {badge.points || 0} pts
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Badges Bloqueados */}
      {lockedBadges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Lock className="w-6 h-6 mr-2 text-gray-400" />
            Badges Disponíveis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBadges.filter(b => !b.isUnlocked).map((badge) => (
              <Card key={badge.id} className="p-6 hover:shadow-lg transition-shadow opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getBadgeLevelColor(badge.level)} flex items-center justify-center shadow-lg opacity-50`}>
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <BadgeUI className="bg-gray-100 text-gray-600">
                    Bloqueado
                  </BadgeUI>
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {badge.label}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {badge.description}
                </p>

                {/* Barra de progresso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>{Math.round(badge.progress || 0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${badge.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Critérios */}
                {badge.criteria && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Critérios para Conquistar:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {Object.entries(badge.criteria as Record<string, any>).map(([key, value]) => (
                        <li key={key} className="flex items-center">
                          <Target className="w-3 h-3 mr-1 text-gray-400" />
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <BadgeUI className={`bg-${badge.level === 'bronze' ? 'orange' : badge.level === 'silver' ? 'gray' : badge.level === 'gold' ? 'yellow' : 'blue'}-100 text-${badge.level === 'bronze' ? 'orange' : badge.level === 'silver' ? 'gray' : badge.level === 'gold' ? 'yellow' : 'blue'}-800`}>
                    {getBadgeLevelLabel(badge.level)}
                  </BadgeUI>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="font-semibold text-gray-600">
                      {badge.points || 0} pts
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Timeline de conquistas */}
      {companyBadges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Timeline de Conquistas
          </h2>
          <Card className="p-6">
            <div className="space-y-4">
              {companyBadges
                .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
                .map((companyBadge, index) => {
                  const badge = companyBadge.badge as Badge;
                  return (
                    <div key={companyBadge.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getBadgeLevelColor(badge?.level)} flex items-center justify-center shadow-md flex-shrink-0`}>
                        {getBadgeLevelIcon(badge?.level)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {badge?.label}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Conquistado em {new Date(companyBadge.awarded_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          +{badge?.points || 0} pontos
                        </p>
                        <BadgeUI className="mt-1 bg-green-100 text-green-800">
                          {getBadgeLevelLabel(badge?.level)}
                        </BadgeUI>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
