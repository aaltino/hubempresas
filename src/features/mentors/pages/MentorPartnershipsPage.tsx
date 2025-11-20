import { useEffect, useState } from 'react';
import { supabase, type Company } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  X,
  Save,
  User,
  Briefcase
} from 'lucide-react';

interface Partnership {
  id: string;
  company_id: string;
  partnership_type: 'founder' | 'partner' | 'advisor';
  created_at: string;
  company?: Company;
}

const partnershipTypeLabels = {
  founder: 'Fundador',
  partner: 'Sócio',
  advisor: 'Advisor'
};

const partnershipTypeDescriptions = {
  founder: 'É fundador ou co-fundador da empresa',
  partner: 'É sócio ou acionista da empresa',
  advisor: 'Atua como advisor ou consultor da empresa'
};

export default function MentorPartnershipsPage() {
  const { profile } = useAuth();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    company_id: '',
    partnership_type: 'partner' as 'founder' | 'partner' | 'advisor'
  });

  useEffect(() => {
    if (profile?.role === 'mentor') {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar parcerias declaradas
      const { data: partnershipData, error: partnershipError } = await supabase
        .from('mentor_company_partnerships')
        .select('*')
        .eq('mentor_id', profile?.id)
        .order('created_at', { ascending: false });

      if (partnershipError) throw partnershipError;

      // Carregar informações das empresas
      const companyIds = partnershipData?.map(p => p.company_id) || [];
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      // Combinar dados
      const partnershipsWithCompanies = partnershipData?.map(partnership => ({
        ...partnership,
        company: companiesData?.find(c => c.id === partnership.company_id)
      })) || [];

      setPartnerships(partnershipsWithCompanies);
      setCompanies(companiesData || []);

      // Verificar conflitos automaticamente
      checkForConflicts();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForConflicts = async () => {
    try {
      // Para cada parceria, verificar se há conflito
      for (const partnership of partnerships) {
        const { data: conflictData } = await supabase.functions.invoke('validate-conflict-of-interest', {
          body: {
            mentor_id: profile?.id,
            company_id: partnership.company_id,
            action_type: 'partnership_review'
          }
        });

        if (conflictData?.conflict_detected) {
          setConflicts(prev => [...prev, {
            company_id: partnership.company_id,
            company_name: partnership.company?.name,
            conflict_status: conflictData.conflict_status,
            reasons: conflictData.conflict_reasons
          }]);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
    }
  };

  const handleAddPartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('mentor_company_partnerships')
        .insert({
          mentor_id: profile?.id,
          company_id: formData.company_id,
          partnership_type: formData.partnership_type
        });

      if (error) throw error;

      alert('Parceria declarada com sucesso!');
      setShowAddModal(false);
      setFormData({ company_id: '', partnership_type: 'partner' });
      loadData();

      // Notificar administradores
      await supabase.functions.invoke('notify-conflict-incident', {
        body: {
          notification_type: 'partnership_declared',
          mentor_id: profile?.id,
          company_id: formData.company_id,
          severity: 'info',
          message: `Nova parceria declarada: ${partnershipTypeLabels[formData.partnership_type]}`
        }
      });

    } catch (error: any) {
      console.error('Erro ao declarar parceria:', error);
      alert('Erro ao declarar parceria: ' + error.message);
    }
  };

  const handleUpdatePartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPartnership) return;

    try {
      const { error } = await supabase
        .from('mentor_company_partnerships')
        .update({
          partnership_type: formData.partnership_type
        })
        .eq('id', selectedPartnership.id);

      if (error) throw error;

      alert('Parceria atualizada com sucesso!');
      setShowEditModal(false);
      setSelectedPartnership(null);
      setFormData({ company_id: '', partnership_type: 'partner' });
      loadData();

    } catch (error: any) {
      console.error('Erro ao atualizar parceria:', error);
      alert('Erro ao atualizar parceria: ' + error.message);
    }
  };

  const handleDeletePartnership = async (partnership: Partnership) => {
    if (!confirm('Tem certeza que deseja remover esta parceria? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mentor_company_partnerships')
        .delete()
        .eq('id', partnership.id);

      if (error) throw error;

      alert('Parceria removida com sucesso!');
      loadData();

    } catch (error: any) {
      console.error('Erro ao remover parceria:', error);
      alert('Erro ao remover parceria: ' + error.message);
    }
  };

  const openEditModal = (partnership: Partnership) => {
    setSelectedPartnership(partnership);
    setFormData({
      company_id: partnership.company_id,
      partnership_type: partnership.partnership_type
    });
    setShowEditModal(true);
  };

  const getConflictColor = (companyId: string) => {
    const conflict = conflicts.find(c => c.company_id === companyId);
    if (!conflict) return 'text-green-600';
    
    switch (conflict.conflict_status) {
      case 'blocked': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getConflictIcon = (companyId: string) => {
    const conflict = conflicts.find(c => c.company_id === companyId);
    if (!conflict) return <CheckCircle className="w-5 h-5 text-green-600" />;
    
    switch (conflict.conflict_status) {
      case 'blocked': return <X className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  if (profile?.role !== 'mentor') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600">Esta página é exclusiva para mentores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Declaração de Parcerias</h1>
            <p className="text-orange-100">
              Declare suas participações em empresas para evitar conflitos de interesse
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{partnerships.length}</div>
            <div className="text-sm text-orange-100">Parcerias Declaradas</div>
          </div>
        </div>
      </div>

      {/* Alerta de Compliance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Transparência e Compliance
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              É obrigatório declarar todas as participações em empresas para garantir 
              a integridade do processo de avaliação. Mentores não podem avaliar empresas 
              das quais sejam sócios, partners ou advisors.
            </p>
          </div>
        </div>
      </div>

      {/* Conflitos Detectados */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Conflitos de Interesse Detectados ({conflicts.length})
              </h3>
              <div className="mt-2 space-y-2">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="text-sm text-red-700">
                    <strong>{conflict.company_name}</strong>: {conflict.reasons.map(r => r.message).join(', ')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Declarar Nova Parceria
        </button>
      </div>

      {/* Lista de Parcerias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Suas Parcerias Declaradas</h2>
        </div>
        
        <div className="p-6">
          {partnerships.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma parceria declarada ainda.</p>
              <p className="text-sm text-gray-400 mt-1">
                Declare suas participações para manter a transparência
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {partnerships.map((partnership) => (
                <div key={partnership.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {partnership.company?.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {partnershipTypeLabels[partnership.partnership_type]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {partnershipTypeDescriptions[partnership.partnership_type]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Declarado em {new Date(partnership.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Status do Conflito */}
                      <div className="flex items-center space-x-2">
                        {getConflictIcon(partnership.company_id)}
                        <span className={`text-sm font-medium ${getConflictColor(partnership.company_id)}`}>
                          {conflicts.find(c => c.company_id === partnership.company_id)?.conflict_status || 'Sem conflito'}
                        </span>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(partnership)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePartnership(partnership)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Adicionar Parceria */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Declarar Nova Parceria</h3>
            
            <form onSubmit={handleAddPartnership} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ⚠️ Importante: Declare todas as suas participações em empresas para evitar conflitos de interesse.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa *
                </label>
                <select
                  required
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} - {company.current_program_key}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Participação *
                </label>
                <select
                  required
                  value={formData.partnership_type}
                  onChange={(e) => setFormData({ ...formData, partnership_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="founder">Fundador</option>
                  <option value="partner">Sócio/Partner</option>
                  <option value="advisor">Advisor</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {partnershipTypeDescriptions[formData.partnership_type]}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ company_id: '', partnership_type: 'partner' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Declarar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Parceria */}
      {showEditModal && selectedPartnership && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Parceria</h3>
            
            <form onSubmit={handleUpdatePartnership} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  value={selectedPartnership.company?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Participação *
                </label>
                <select
                  required
                  value={formData.partnership_type}
                  onChange={(e) => setFormData({ ...formData, partnership_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="founder">Fundador</option>
                  <option value="partner">Sócio/Partner</option>
                  <option value="advisor">Advisor</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {partnershipTypeDescriptions[formData.partnership_type]}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPartnership(null);
                    setFormData({ company_id: '', partnership_type: 'partner' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}