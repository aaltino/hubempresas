import { useState, useEffect } from 'react';
import { X, Mail, Building, User, Globe, FileText, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InviteCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InviteForm {
  email: string;
  companyName: string;
  founderName: string;
  programKey: string;
  website: string;
  description: string;
  cohortId: string;
}

export default function InviteCompanyModal({ isOpen, onClose, onSuccess }: InviteCompanyModalProps) {
  const [form, setForm] = useState<InviteForm>({
    email: '',
    companyName: '',
    founderName: '',
    programKey: 'hotel_de_projetos',
    website: '',
    description: '',
    cohortId: ''
  });
  
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load cohorts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCohorts();
    }
  }, [isOpen]);

  const loadCohorts = async () => {
    try {
      const { data } = await supabase
        .from('cohorts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setCohorts(data);
    } catch (error) {
      console.error('Erro ao carregar coortes:', error);
    }
  };

  const handleInputChange = (field: keyof InviteForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const validateForm = () => {
    if (!form.email || !form.companyName || !form.founderName) {
      return 'Email, nome da empresa e nome do fundador são obrigatórios';
    }
    
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return 'Email inválido';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('invite-company', {
        body: {
          email: form.email,
          companyName: form.companyName,
          founderName: form.founderName,
          programKey: form.programKey,
          website: form.website || null,
          description: form.description || null,
          cohortId: form.cohortId || null
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error.message);
      }

      setSuccess(`Convite enviado com sucesso para ${form.email}!`);
      
      // Reset form and call success callback
      setTimeout(() => {
        setForm({
          email: '',
          companyName: '',
          founderName: '',
          programKey: 'hotel_de_projetos',
          website: '',
          description: '',
          cohortId: ''
        });
        onSuccess();
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      setError(error.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        email: '',
        companyName: '',
        founderName: '',
        programKey: 'hotel_de_projetos',
        website: '',
        description: '',
        cohortId: ''
      });
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Convidar Nova Empresa</h2>
              <p className="text-sm text-gray-600">Adicione uma empresa ao HUB</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              Email do Fundador *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="fundador@empresa.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">O email será usado para enviar o convite de acesso</p>
          </div>

          {/* Company Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 mr-2 text-gray-500" />
              Nome da Empresa *
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="Minha Startup Ltda"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* Founder Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              Nome do Fundador *
            </label>
            <input
              type="text"
              value={form.founderName}
              onChange={(e) => handleInputChange('founderName', e.target.value)}
              placeholder="João Silva"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* Program Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 mr-2 text-gray-500" />
              Programa Inicial *
            </label>
            <select
              value={form.programKey}
              onChange={(e) => handleInputChange('programKey', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
              disabled={loading}
            >
              <option value="hotel_de_projetos">Hotel de Projetos</option>
              <option value="pre_residencia">Pré-Residência</option>
              <option value="residencia">Residência</option>
            </select>
          </div>

          {/* Cohort Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              Coorte (Opcional)
            </label>
            <select
              value={form.cohortId}
              onChange={(e) => handleInputChange('cohortId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={loading}
            >
              <option value="">Nenhuma coorte específica</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 mr-2 text-gray-500" />
              Website (Opcional)
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://minhaempresa.com.br"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Descrição (Opcional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Breve descrição da empresa e seu segmento..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">O que acontece após o convite:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Uma conta será criada automaticamente para o fundador</li>
              <li>• As credenciais serão enviadas por email (em produção)</li>
              <li>• A empresa será adicionada ao programa selecionado</li>
              <li>• Deliverables obrigatórios serão criados automaticamente</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success !== null}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando convite...</span>
                </>
              ) : (
                <span>Enviar Convite</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}