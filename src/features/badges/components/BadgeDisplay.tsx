// Componente: BadgeDisplay - Exibição de Badges Conquistados
// Grid de badges com detalhes e estatísticas

import React from 'react';
import type { CompanyBadge, BadgeStatistics } from '../types/badge';
import { Card } from '@/design-system/ui/Card';
import { Badge } from '@/design-system/ui/Badge';
import { Award, TrendingUp } from 'lucide-react';

interface BadgeDisplayProps {
  companyBadges: CompanyBadge[];
  statistics?: BadgeStatistics;
  showStatistics?: boolean;
}

export function BadgeDisplay({ 
  companyBadges, 
  statistics,
  showStatistics = true 
}: BadgeDisplayProps) {
  if (companyBadges.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum badge conquistado ainda
          </h3>
          <p className="text-sm text-gray-600">
            Complete questionários e atinja metas para conquistar badges!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {showStatistics && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Badges Conquistados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.total_badges_earned}
                  </p>
                </div>
                <Award className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Disponível</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.total_badges_available}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Progresso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.completion_percentage}%
                  </p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center">
                  <div className="relative w-10 h-10">
                    <svg className="transform -rotate-90 w-10 h-10">
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 18}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 18 * (1 - statistics.completion_percentage / 100)
                        }`}
                        className="text-purple-600"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Por Tipo</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progressão</span>
                    <span className="font-medium">
                      {statistics.badges_by_type.stage_progression || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Conquistas</span>
                    <span className="font-medium">
                      {statistics.badges_by_type.achievement || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Marcos</span>
                    <span className="font-medium">
                      {statistics.badges_by_type.milestone || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Grid de Badges */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Badges Conquistados
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {companyBadges.map(companyBadge => {
              const badge = companyBadge.badge;
              if (!badge) return null;

              return (
                <div
                  key={companyBadge.id}
                  className="group relative bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  {/* Badge Icon */}
                  <div className="text-center mb-3">
                    <span className="text-4xl">{badge.icon}</span>
                  </div>

                  {/* Badge Info */}
                  <div className="text-center space-y-1">
                    <h4 className="font-semibold text-sm text-gray-900">
                      {badge.label}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {badge.description}
                    </p>
                  </div>

                  {/* Badge Type */}
                  <div className="mt-3 flex justify-center">
                    <Badge variant="secondary">
                      {badge.badge_type === 'stage_progression' && 'Progressão'}
                      {badge.badge_type === 'achievement' && 'Conquista'}
                      {badge.badge_type === 'milestone' && 'Marco'}
                    </Badge>
                  </div>

                  {/* Earned Date */}
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500">
                      {new Date(companyBadge.earned_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                      {badge.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Badges Recentes */}
      {showStatistics && statistics && statistics.recent_badges.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Conquistas Recentes
            </h3>

            <div className="space-y-3">
              {statistics.recent_badges.slice(0, 5).map(companyBadge => {
                const badge = companyBadge.badge;
                if (!badge) return null;

                return (
                  <div
                    key={companyBadge.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-3xl">{badge.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{badge.label}</h4>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(companyBadge.earned_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
