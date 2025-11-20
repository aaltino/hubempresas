import { supabase } from '@/lib/supabase';
import type { ConflictValidationResult, MentorCompanyPartnership, ConflictAuditLog } from '../types/conflict';

/**
 * Valida se há conflito de interesse entre mentor e empresa
 */
export async function validateConflictOfInterest(
  mentorId: string,
  companyId: string,
  actionType: string = 'evaluation_attempt'
): Promise<ConflictValidationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('validate-conflict-of-interest', {
      body: {
        mentor_id: mentorId,
        company_id: companyId,
        action_type: actionType
      }
    });

    if (error) {
      console.error('Erro ao validar conflito:', error);
      throw error;
    }

    return data as ConflictValidationResult;
  } catch (error) {
    console.error('Erro ao validar conflito:', error);
    throw error;
  }
}

/**
 * Busca parcerias declaradas de um mentor
 */
export async function getMentorPartnerships(mentorId: string): Promise<MentorCompanyPartnership[]> {
  try {
    const { data, error } = await supabase
      .from('mentor_company_partnerships')
      .select(`
        *,
        company:companies(id, name)
      `)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar parcerias:', error);
    return [];
  }
}

/**
 * Busca logs de auditoria de conflitos
 */
export async function getConflictAuditLogs(
  mentorId?: string,
  companyId?: string,
  limit: number = 50
): Promise<ConflictAuditLog[]> {
  try {
    let query = supabase
      .from('conflict_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (mentorId) {
      query = query.eq('mentor_id', mentorId);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return [];
  }
}

/**
 * Declara uma parceria entre mentor e empresa
 */
export async function declarePartnership(
  mentorId: string,
  companyId: string,
  partnershipType: string,
  description?: string
): Promise<{ success: boolean; partnership?: MentorCompanyPartnership; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('mentor_company_partnerships')
      .insert({
        mentor_id: mentorId,
        company_id: companyId,
        partnership_type: partnershipType,
        description: description,
        is_active: true,
        start_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, partnership: data };
  } catch (error) {
    console.error('Erro ao declarar parceria:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Atualiza status de uma parceria
 */
export async function updatePartnershipStatus(
  partnershipId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('mentor_company_partnerships')
      .update({
        is_active: isActive,
        end_date: isActive ? null : new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', partnershipId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar parceria:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Envia notificação sobre conflito
 */
export async function notifyConflictIncident(
  notificationType: string,
  mentorId: string,
  companyId: string,
  severity: string = 'info',
  message?: string,
  actionRequired: boolean = false,
  metadata: any = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('notify-conflict-incident', {
      body: {
        notification_type: notificationType,
        mentor_id: mentorId,
        company_id: companyId,
        severity,
        message,
        action_required: actionRequired,
        metadata
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
