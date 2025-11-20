// Serviço para operações com Badges e Gamificação
// Comunicação com Edge Functions e banco de dados

import { supabase } from '@/lib/supabase';
import type {
  Badge,
  CompanyBadge,
  BadgeEvent,
  AwardBadgeRequest,
  CreateBadgeRequest,
  BadgeStatistics,
  BadgeRanking,
  BadgeProgress
} from '../types/badge';

export class BadgeService {
  // Buscar todos os badges ativos
  static async getActiveBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('badge_type', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Erro ao buscar badges: ${error.message}`);
    return data || [];
  }

  // Buscar badges de uma empresa
  static async getCompanyBadges(companyId: string): Promise<CompanyBadge[]> {
    const { data, error } = await supabase
      .from('company_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('company_id', companyId)
      .order('earned_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar badges da empresa: ${error.message}`);
    return data || [];
  }

  // Conceder badge manualmente (Admin/Gestor)
  static async awardBadgeManually(
    companyId: string,
    badgeId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('company_badges')
      .insert({
        company_id: companyId,
        badge_id: badgeId,
        earned_by_event: 'manual_award',
        metadata: metadata || {}
      });

    if (error) {
      // Se já existe, ignorar
      if (error.code === '23505') {
        return;
      }
      throw new Error(`Erro ao conceder badge: ${error.message}`);
    }
  }

  // Processar evento para atribuição automática de badges via Edge Function
  static async processEventForBadges(request: AwardBadgeRequest): Promise<{
    badges_awarded: string[];
    total_badges: number;
  }> {
    const { data, error } = await supabase.functions.invoke('award-badges', {
      body: request
    });

    if (error) throw new Error(`Erro ao processar badges: ${error.message}`);
    return data.data;
  }

  // Criar novo badge (Admin apenas)
  static async createBadge(request: CreateBadgeRequest): Promise<Badge> {
    const { data, error } = await supabase
      .from('badges')
      .insert(request)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar badge: ${error.message}`);
    return data;
  }

  // Atualizar badge (Admin apenas)
  static async updateBadge(badgeId: string, updates: Partial<Badge>): Promise<void> {
    const { error } = await supabase
      .from('badges')
      .update(updates)
      .eq('id', badgeId);

    if (error) throw new Error(`Erro ao atualizar badge: ${error.message}`);
  }

  // Desativar badge
  static async deactivateBadge(badgeId: string): Promise<void> {
    const { error } = await supabase
      .from('badges')
      .update({ is_active: false })
      .eq('id', badgeId);

    if (error) throw new Error(`Erro ao desativar badge: ${error.message}`);
  }

  // Buscar eventos de badges de uma empresa
  static async getBadgeEvents(companyId: string): Promise<BadgeEvent[]> {
    const { data, error } = await supabase
      .from('badge_events')
      .select('*')
      .eq('company_id', companyId)
      .order('triggered_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar eventos de badges: ${error.message}`);
    return data || [];
  }

  // Estatísticas de badges para uma empresa
  static async getCompanyBadgeStatistics(companyId: string): Promise<BadgeStatistics> {
    const [allBadges, earnedBadges] = await Promise.all([
      this.getActiveBadges(),
      this.getCompanyBadges(companyId)
    ]);

    const badgesByType: Record<string, number> = {
      stage_progression: 0,
      achievement: 0,
      milestone: 0
    };

    earnedBadges.forEach(cb => {
      if (cb.badge) {
        badgesByType[cb.badge.badge_type] = (badgesByType[cb.badge.badge_type] || 0) + 1;
      }
    });

    const recentBadges = earnedBadges.slice(0, 5);

    return {
      total_badges_available: allBadges.length,
      total_badges_earned: earnedBadges.length,
      completion_percentage: allBadges.length > 0 
        ? Math.round((earnedBadges.length / allBadges.length) * 100) 
        : 0,
      recent_badges: recentBadges,
      badges_by_type: badgesByType
    };
  }

  // Ranking de badges mais conquistados (Dashboard Gestor)
  static async getBadgeRanking(limit: number = 10): Promise<BadgeRanking[]> {
    const { data, error } = await supabase
      .from('company_badges')
      .select(`
        badge_id,
        badge:badges(*)
      `);

    if (error) throw new Error(`Erro ao buscar ranking de badges: ${error.message}`);

    // Agrupar por badge_id
    const badgeGroups: Record<string, { badge: Badge; count: number }> = {};
    
    (data || []).forEach((cb: any) => {
      if (cb.badge) {
        if (!badgeGroups[cb.badge_id]) {
          badgeGroups[cb.badge_id] = { badge: cb.badge, count: 0 };
        }
        badgeGroups[cb.badge_id].count++;
      }
    });

    // Converter para array e ordenar
    const ranking = Object.values(badgeGroups)
      .map(group => ({
        badge: group.badge,
        earned_count: group.count,
        companies_with_badge: group.count
      }))
      .sort((a, b) => b.earned_count - a.earned_count)
      .slice(0, limit);

    return ranking;
  }

  // Empresas com mais badges (Dashboard Gestor)
  static async getTopCompanies(limit: number = 10): Promise<Array<{
    company_id: string;
    company_name: string;
    badge_count: number;
  }>> {
    const { data, error } = await supabase
      .from('company_badges')
      .select(`
        company_id,
        company:companies(name)
      `);

    if (error) throw new Error(`Erro ao buscar ranking de empresas: ${error.message}`);

    // Agrupar por company_id
    const companyGroups: Record<string, { name: string; count: number }> = {};
    
    (data || []).forEach((cb: any) => {
      if (cb.company) {
        if (!companyGroups[cb.company_id]) {
          companyGroups[cb.company_id] = { name: cb.company.name, count: 0 };
        }
        companyGroups[cb.company_id].count++;
      }
    });

    // Converter para array e ordenar
    const ranking = Object.entries(companyGroups)
      .map(([companyId, group]) => ({
        company_id: companyId,
        company_name: group.name,
        badge_count: group.count
      }))
      .sort((a, b) => b.badge_count - a.badge_count)
      .slice(0, limit);

    return ranking;
  }

  // Verificar progresso para próximos badges (futura implementação)
  static async getBadgeProgress(companyId: string): Promise<BadgeProgress[]> {
    // TODO: Implementar lógica de progresso baseado em condições
    // Por enquanto, retornar array vazio
    return [];
  }

  // Remover badge de uma empresa (Admin apenas - casos excepcionais)
  static async removeBadge(companyId: string, badgeId: string): Promise<void> {
    const { error } = await supabase
      .from('company_badges')
      .delete()
      .eq('company_id', companyId)
      .eq('badge_id', badgeId);

    if (error) throw new Error(`Erro ao remover badge: ${error.message}`);
  }
}
