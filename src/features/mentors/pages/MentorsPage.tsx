import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Award,
  Search,
  Filter,
  X
} from 'lucide-react';
import Modal from '@/components/shared/Modal';

interface Mentor {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  expertise?: string;
  bio?: string;
  created_at: string;
  companies_count?: number;
  evaluations_count?: number;
}

export default function MentorsPage() {
  const { profile } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    expertise: '',
    bio: '',
    password: ''
  });

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      setLoading(true);

      // Buscar perfis de mentores
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Para cada mentor, buscar contagem de empresas e avaliações
      const mentorsWithStats = await Promise.all(
        (profiles || []).map(async (mentor) => {
          // Contar empresas atribuídas (se houver tabela de atribuição)
          const { count: companiesCount } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('mentor_id', mentor.id);

          // Contar avaliações realizadas
          const { count: evaluationsCount } = await supabase
            .from('evaluations')
            .select('*', { count: 'exact', head: true })
            .eq('evaluator_id', mentor.id);

          return {
            ...mentor,
            companies_count: companiesCount || 0,
            evaluations_count: evaluationsCount || 0
          };
        })
      );

      setMentors(mentorsWithStats);
    } catch (error) {
      console.error('Erro ao carregar mentores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Criar usuário via Edge Function para não perder a sessão atual
      const { data: authData, error: authError } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          user_metadata: {
            full_name: formData.full_name,
            role: 'mentor'
          }
        }
      });

      if (authError) throw authError;
      if (authData.error) throw new Error(authData.error);

      const userId = authData.user.id;

      // Atualizar perfil (o trigger on_auth_user_created já deve ter criado o perfil, mas atualizamos os dados extras)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          expertise: formData.expertise,
          bio: formData.bio,
          role: 'mentor'
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      alert('Mentor adicionado com sucesso!');
      setShowAddModal(false);
      resetForm();
      loadMentors();

    } catch (error: any) {
      console.error('Erro ao adicionar mentor:', error);
      alert('Erro ao adicionar mentor: ' + error.message);
    }
  };

  const handleEditMentor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMentor) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          expertise: formData.expertise,
          bio: formData.bio
        })
        .eq('id', selectedMentor.id);

      if (error) throw error;

      alert('Mentor atualizado com sucesso!');
      setShowEditModal(false);
      resetForm();
      setSelectedMentor(null);
      loadMentors();
    } catch (error: any) {
      console.error('Erro ao editar mentor:', error);
      alert('Erro ao editar mentor: ' + error.message);
    }
  };

  const handleDeleteMentor = async () => {
    if (!selectedMentor) return;

    try {
      // Nota: Em produção, considere soft delete ao invés de deletar
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedMentor.id);

      if (error) throw error;

      alert('Mentor removido com sucesso!');
      setShowDeleteModal(false);
      setSelectedMentor(null);
      loadMentors();
    } catch (error: any) {
      console.error('Erro ao remover mentor:', error);
      alert('Erro ao remover mentor: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      expertise: '',
      bio: '',
      password: ''
    });
  };

  const openEditModal = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setFormData({
      full_name: mentor.full_name,
      email: mentor.email,
      phone: mentor.phone || '',
      expertise: mentor.expertise || '',
      bio: mentor.bio || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowDeleteModal(true);
  };

  // Filtros
  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExpertise = !expertiseFilter || mentor.expertise?.toLowerCase().includes(expertiseFilter.toLowerCase());
    return matchesSearch && matchesExpertise;
  });

  // Estatísticas
  const stats = {
    total: mentors.length,
    active: mentors.filter(m => m.companies_count && m.companies_count > 0).length,
    totalCompanies: mentors.reduce((sum, m) => sum + (m.companies_count || 0), 0),
    totalEvaluations: mentors.reduce((sum, m) => sum + (m.evaluations_count || 0), 0)
  };

  const expertiseOptions = Array.from(new Set(mentors.map(m => m.expertise).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando mentores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentores</h1>
          <p className="mt-1 text-gray-600">Gerencie a equipe de mentores do programa</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Mentor
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Mentores</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mentores Ativos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <Award className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Empresas Atendidas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCompanies}</p>
            </div>
            <Briefcase className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avaliações Realizadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEvaluations}</p>
            </div>
            <Award className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:w-64 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={expertiseFilter}
              onChange={(e) => setExpertiseFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Todas as Expertises</option>
              {expertiseOptions.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          {(searchTerm || expertiseFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setExpertiseFilter('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"
            >
              <X className="w-5 h-5 mr-1" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Mentores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredMentors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum mentor encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expertise
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avaliações
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMentors.map((mentor) => (
                  <tr key={mentor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {mentor.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{mentor.full_name}</p>
                          <p className="text-sm text-gray-500">
                            Desde {new Date(mentor.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {mentor.email}
                        </div>
                        {mentor.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {mentor.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {mentor.expertise ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {mentor.expertise}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Não especificada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {mentor.companies_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {mentor.evaluations_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(mentor)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(mentor)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Adicionar Mentor */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Adicionar Novo Mentor"
      >
        <form onSubmit={handleAddMentor} className="space-y-4" role="form" aria-labelledby="add-mentor-title">
          <div>
            <label htmlFor="add-fullname" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              id="add-fullname"
              type="text"
              required
              aria-required="true"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="add-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              id="add-email"
              type="email"
              required
              aria-required="true"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="add-password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <input
              id="add-password"
              type="password"
              required
              aria-required="true"
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500" id="password-hint">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <label htmlFor="add-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              id="add-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="add-expertise" className="block text-sm font-medium text-gray-700 mb-1">
              Expertise
            </label>
            <input
              id="add-expertise"
              type="text"
              placeholder="Ex: Tecnologia, Marketing, Finanças"
              value={formData.expertise}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="add-bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="add-bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              aria-label="Cancelar adição de mentor"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              aria-label="Adicionar novo mentor"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adicionar Mentor
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Mentor */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setSelectedMentor(null);
        }}
        title="Editar Mentor"
      >
        <form onSubmit={handleEditMentor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expertise
            </label>
            <input
              type="text"
              value={formData.expertise}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
                setSelectedMentor(null);
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar Exclusão */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMentor(null);
        }}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Tem certeza que deseja remover o mentor <strong>{selectedMentor?.full_name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Esta ação não pode ser desfeita. Todas as atribuições e dados relacionados serão afetados.
          </p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedMentor(null);
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteMentor}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
