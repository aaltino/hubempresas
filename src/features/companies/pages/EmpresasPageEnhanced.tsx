// Enhanced Companies Page - FASE 2
// Sistema Completo de Gestão de Empresas com Filtros, Busca, Paginação e Métricas

import { useEffect, useState } from 'react';
import { supabase, type Company } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Search, Filter, Download, Upload,
  Building2, TrendingUp, DollarSign, Users, Calendar
} from 'lucide-react';
import { Button } from '@/design-system/ui/Button';
import { Card } from '@/design-system/ui/Card';
import { Badge } from '@/design-system/ui/Badge';
import { DashboardSkeleton } from '@/design-system/feedback/Skeleton';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface CompanyFilters {
  search: string;
  sector?: string;
  stage?: string;
  status?: string;
  program?: string;
}

export default function EmpresasPageEnhanced() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // Estados principais
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // Filtros e paginação
  const [filters, setFilters] = useState<CompanyFilters>({
    search: '',
    sector: undefined,
    stage: undefined,
    status: undefined,
    program: undefined
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    current_program_key: 'hotel_de_projetos',
    website: '',
    sector: '',
    stage: 'idea' as 'idea' | 'mvp' | 'traction' | 'growth' | 'scale',
    team_size: 1,
    status: 'active' as 'active' | 'paused' | 'completed' | 'archived',
    founded_date: '',
    // Métricas quantitativas
    mrr: 0,
    churn_rate: 0,
    runway_months: 0,
    total_funding: 0
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [companies, filters]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar as empresas'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...companies];

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(company =>
        company.name.toLowerCase().includes(searchLower) ||
        company.description?.toLowerCase().includes(searchLower) ||
        company.sector?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por setor
    if (filters.sector) {
      result = result.filter(c => c.sector === filters.sector);
    }

    // Filtro por estágio
    if (filters.stage) {
      result = result.filter(c => c.stage === filters.stage);
    }

    // Filtro por status
    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }

    // Filtro por programa
    if (filters.program) {
      result = result.filter(c => c.current_program_key === filters.program);
    }

    setFilteredCompanies(result);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCompany) {
        const { error } = await supabase
          .from('companies')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCompany.id);

        if (error) throw error;
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Empresa atualizada com sucesso'
        });
      } else {
        const { error } = await supabase
          .from('companies')
          .insert(formData);

        if (error) throw error;
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Empresa criada com sucesso'
        });
      }

      setShowModal(false);
      setEditingCompany(null);
      resetForm();
      loadCompanies();
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: error.message || 'Erro ao salvar empresa'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja arquivar esta empresa?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Empresa arquivada com sucesso'
      });
      loadCompanies();
    } catch (error: any) {
      console.error('Erro ao arquivar empresa:', error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Erro ao arquivar empresa'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      current_program_key: 'hotel_de_projetos',
      website: '',
      sector: '',
      stage: 'idea',
      team_size: 1,
      status: 'active',
      founded_date: '',
      mrr: 0,
      churn_rate: 0,
      runway_months: 0,
      total_funding: 0
    });
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description || '',
      current_program_key: company.current_program_key,
      website: company.website || '',
      sector: company.sector || '',
      stage: (company.stage as any) || 'idea',
      team_size: company.team_size || 1,
      status: (company.status as any) || 'active',
      founded_date: company.founded_date || '',
      mrr: (company.metrics as any)?.mrr || 0,
      churn_rate: (company.metrics as any)?.churn_rate || 0,
      runway_months: (company.metrics as any)?.runway_months || 0,
      total_funding: (company.metrics as any)?.total_funding || 0
    });
    setShowModal(true);
  };

  // Paginação
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStageLabel = (stage?: string) => {
    const labels: Record<string, string> = {
      idea: 'Ideia',
      mvp: 'MVP',
      traction: 'Tração',
      growth: 'Crescimento',
      scale: 'Escala'
    };
    return labels[stage || 'idea'] || stage;
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status || 'active'] || colors.active;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: 'Empresas', icon: <Building2 className="w-4 h-4" /> }
        ]} />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Empresas', icon: <Building2 className="w-4 h-4" /> }
      ]} />

      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600 mt-1">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => {/* TODO: Exportar */}}
          >
            Exportar
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setEditingCompany(null);
              setShowModal(true);
            }}
          >
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, descrição ou setor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {/* Filtro Setor */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.sector || ''}
            onChange={(e) => setFilters({ ...filters, sector: e.target.value || undefined })}
          >
            <option value="">Todos os Setores</option>
            <option value="Tecnologia">Tecnologia</option>
            <option value="Saúde">Saúde</option>
            <option value="Educação">Educação</option>
            <option value="Fintech">Fintech</option>
            <option value="E-commerce">E-commerce</option>
          </select>

          {/* Filtro Estágio */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.stage || ''}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value || undefined })}
          >
            <option value="">Todos os Estágios</option>
            <option value="idea">Ideia</option>
            <option value="mvp">MVP</option>
            <option value="traction">Tração</option>
            <option value="growth">Crescimento</option>
            <option value="scale">Escala</option>
          </select>

          {/* Filtro Status */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">Todos os Status</option>
            <option value="active">Ativa</option>
            <option value="paused">Pausada</option>
            <option value="completed">Finalizada</option>
            <option value="archived">Arquivada</option>
          </select>
        </div>

        {/* Limpar filtros */}
        {(filters.search || filters.sector || filters.stage || filters.status) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ search: '', sector: undefined, stage: undefined, status: undefined, program: undefined })}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </Card>

      {/* Grid de empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedCompanies.map((company) => (
          <div key={company.id} className="cursor-pointer" onClick={() => navigate(`/empresas/${company.id}`)}>
            <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500">{company.sector || 'Não definido'}</p>
                </div>
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleEdit(company)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {company.description || 'Sem descrição'}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getStatusColor(company.status)}>
                {company.status === 'active' ? 'Ativa' : 
                 company.status === 'paused' ? 'Pausada' :
                 company.status === 'completed' ? 'Finalizada' : 'Arquivada'}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">
                {getStageLabel(company.stage)}
              </Badge>
            </div>

            {/* Métricas */}
            {company.metrics && (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <div>
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <DollarSign className="w-3 h-3 mr-1" />
                    MRR
                  </div>
                  <p className="text-sm font-semibold">
                    R$ {((company.metrics as any)?.mrr || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <Users className="w-3 h-3 mr-1" />
                    Time
                  </div>
                  <p className="text-sm font-semibold">
                    {company.team_size || 0} pessoas
                  </p>
                </div>
              </div>
            )}
          </Card>
          </div>
        ))}
      </div>

      {/* Mensagem quando não há resultados */}
      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma empresa encontrada
          </h3>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.sector || filters.stage || filters.status
              ? 'Tente ajustar os filtros ou limpar a busca'
              : 'Comece criando sua primeira empresa'}
          </p>
          {!filters.search && !filters.sector && (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              Nova Empresa
            </Button>
          )}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome e Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Setor, Estágio, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Setor
                  </label>
                  <input
                    type="text"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estágio
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="idea">Ideia</option>
                    <option value="mvp">MVP</option>
                    <option value="traction">Tração</option>
                    <option value="growth">Crescimento</option>
                    <option value="scale">Escala</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Ativa</option>
                    <option value="paused">Pausada</option>
                    <option value="completed">Finalizada</option>
                    <option value="archived">Arquivada</option>
                  </select>
                </div>
              </div>

              {/* Programa e Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Programa Atual
                  </label>
                  <select
                    value={formData.current_program_key}
                    onChange={(e) => setFormData({ ...formData, current_program_key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hotel_de_projetos">Hotel de Projetos</option>
                    <option value="pre_residencia">Pré-Residência</option>
                    <option value="residencia">Residência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamanho do Time
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.team_size}
                    onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Métricas Quantitativas */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Métricas Financeiras</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRR (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.mrr}
                      onChange={(e) => setFormData({ ...formData, mrr: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Churn Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.churn_rate}
                      onChange={(e) => setFormData({ ...formData, churn_rate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Runway (meses)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.runway_months}
                      onChange={(e) => setFormData({ ...formData, runway_months: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Captação Total (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.total_funding}
                      onChange={(e) => setFormData({ ...formData, total_funding: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCompany(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingCompany ? 'Salvar Alterações' : 'Criar Empresa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
