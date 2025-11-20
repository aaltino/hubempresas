import { useEffect, useState } from 'react';
import { supabase, type Company, type Program, type Evaluation, type Deliverable } from '@/lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../../auth';
import { generateCompanyOnePager } from '@/lib/pdf';
import { useNavigate } from 'react-router-dom';

export default function EmpresasPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    current_program_key: 'hotel_de_projetos',
    website: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [companiesResult, programsResult] = await Promise.all([
        supabase.from('companies').select('*').order('created_at', { ascending: false }),
        supabase.from('programs').select('*')
      ]);

      if (companiesResult.data) setCompanies(companiesResult.data);
      if (programsResult.data) setPrograms(programsResult.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCompany) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            description: formData.description,
            current_program_key: formData.current_program_key,
            website: formData.website,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCompany.id);

        if (error) throw error;
      } else {
        // Criar nova empresa
        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            description: formData.description,
            current_program_key: formData.current_program_key,
            website: formData.website,
          })
          .select()
          .single();

        if (error) throw error;

        // Criar deliverables automaticamente
        if (newCompany) {
          await supabase.functions.invoke('create-deliverables-for-company', {
            body: {
              company_id: newCompany.id,
              program_key: newCompany.current_program_key
            }
          });
        }
      }

      setShowModal(false);
      setEditingCompany(null);
      setFormData({ name: '', description: '', current_program_key: 'hotel_de_projetos', website: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      alert('Erro ao salvar empresa. Tente novamente.');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description || '',
      current_program_key: company.current_program_key,
      website: company.website || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      alert('Erro ao excluir empresa. Tente novamente.');
    }
  };

  const handleGenerateOnePager = async (company: Company) => {
    try {
      // Buscar programa
      const program = programs.find(p => p.key === company.current_program_key);
      if (!program) {
        alert('Programa não encontrado.');
        return;
      }

      // Buscar última avaliação
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('*')
        .eq('company_id', company.id)
        .eq('program_key', company.current_program_key)
        .order('evaluation_date', { ascending: false })
        .limit(1);

      // Buscar deliverables
      const { data: deliverables } = await supabase
        .from('deliverables')
        .select('*')
        .eq('company_id', company.id)
        .eq('program_key', company.current_program_key);

      await generateCompanyOnePager(
        company,
        program,
        evaluations?.[0] || null,
        deliverables || []
      );

      alert('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleCheckEligibility = async (companyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-progression-eligibility', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      const result = data.data;
      let message = `Empresa: ${result.eligible ? 'ELEGÍVEL' : 'NÃO ELEGÍVEL'} para próximo programa\n\n`;
      message += `Programa Atual: ${result.current_program}\n\n`;
      message += `Verificações:\n`;
      message += `- Avaliação válida: ${result.checks.has_valid_evaluation ? '✓' : '✗'}\n`;
      message += `- Score ponderado: ${result.checks.weighted_score_met ? '✓' : '✗'} (${result.checks.current_weighted_score?.toFixed(2)} / ${result.checks.required_weighted_score})\n`;
      message += `- Scores mínimos por dimensão: ${result.checks.dimension_mins_met ? '✓' : '✗'}\n`;
      message += `- Gate positivo: ${result.checks.gate_positive ? '✓' : '✗'}\n`;
      message += `- Deliverables aprovados: ${result.checks.deliverables_approved ? '✓' : '✗'}\n`;

      alert(message);
    } catch (error) {
      console.error('Erro ao verificar elegibilidade:', error);
      alert('Erro ao verificar elegibilidade. Tente novamente.');
    }
  };

  const programLabels: Record<string, string> = {
    hotel_de_projetos: 'Hotel de Projetos',
    pre_residencia: 'Pré-Residência',
    residencia: 'Residência'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Empresas Incubadas</h2>
          <p className="text-gray-600 mt-1">Gerencie as empresas do HUB</p>
        </div>
        {profile?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingCompany(null);
              setFormData({ name: '', description: '', current_program_key: 'hotel_de_projetos', website: '' });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Empresa</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Programa Atual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <button
                      onClick={() => navigate(`/empresas/${company.id}`)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline text-left"
                    >
                      {company.name}
                    </button>
                    {company.description && (
                      <p className="text-sm text-gray-500 mt-1">{company.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {programLabels[company.current_program_key]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {company.website}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleGenerateOnePager(company)}
                    className="inline-flex items-center px-3 py-1 text-sm text-purple-700 hover:text-purple-900"
                    title="Gerar One-Pager PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCheckEligibility(company.id)}
                    className="inline-flex items-center px-3 py-1 text-sm text-green-700 hover:text-green-900"
                    title="Verificar Elegibilidade"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  {profile?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => handleEdit(company)}
                        className="inline-flex items-center px-3 py-1 text-sm text-blue-700 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="inline-flex items-center px-3 py-1 text-sm text-red-700 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {companies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma empresa cadastrada ainda.</p>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Programa Atual *
                </label>
                <select
                  value={formData.current_program_key}
                  onChange={(e) => setFormData({ ...formData, current_program_key: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {programs.map((program) => (
                    <option key={program.id} value={program.key}>
                      {program.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCompany(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCompany ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
