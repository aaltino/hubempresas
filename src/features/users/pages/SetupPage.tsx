import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const setupDatabase = async () => {
    setLoading(true);
    setError('');
    setLogs([]);

    try {
      // PASSO 1: Criar programas
      addLog('Criando programas...');
      setStep(1);

      const programs = [
        {
          key: 'hotel_de_projetos',
          label: 'Hotel de Projetos',
          questionnaire_items_target: 68,
          config: {
            required_deliverables: [
              { key: 'canvas', label: 'Business Model Canvas', approval_required: true }
            ],
            passage_to_next_program: {
              weighted_score_min: 7.0,
              dimension_mins: {
                mercado: 7.0,
                perfil_empreendedor: 6.5,
                tecnologia_qualidade: 6.5,
                gestao: 6.0,
                financeiro: 6.0
              },
              gate_required: true
            }
          }
        },
        {
          key: 'pre_residencia',
          label: 'Pré-Residência',
          questionnaire_items_target: 75,
          config: {
            required_deliverables: [
              { key: 'mvp_validado', label: 'MVP Evidenciado/Validado', approval_required: true }
            ],
            passage_to_next_program: {
              weighted_score_min: 7.5,
              dimension_mins: {
                mercado: 7.5,
                perfil_empreendedor: 7.0,
                tecnologia_qualidade: 7.0,
                gestao: 6.8,
                financeiro: 6.8
              },
              gate_required: true
            }
          }
        },
        {
          key: 'residencia',
          label: 'Residência',
          questionnaire_items_target: 32,
          config: {
            required_deliverables: [
              { key: 'produto_validado', label: 'Produto/Serviço Validado', approval_required: true },
              { key: 'indicadores_tracao', label: 'Indicadores de Tração', approval_required: false }
            ],
            maintenance_thresholds: {
              weighted_score_min: 8.0,
              dimension_mins: {
                mercado: 8.0,
                perfil_empreendedor: 7.5,
                tecnologia_qualidade: 7.5,
                gestao: 7.2,
                financeiro: 7.2
              },
              gate_required: true
            }
          }
        }
      ];

      for (const program of programs) {
        const { error } = await supabase
          .from('programs')
          .upsert(program, { onConflict: 'key' });
        
        if (error) throw error;
        addLog(`Programa "${program.label}" criado`);
      }

      // PASSO 2: Criar cohort
      addLog('Criando cohort...');
      setStep(2);

      const { data: cohort, error: cohortError } = await supabase
        .from('cohorts')
        .insert({
          name: 'Turma 2025.1',
          start_date: '2025-01-15',
          end_date: '2025-12-31',
          description: 'Primeira turma de 2025 - Ciclo completo de incubação'
        })
        .select()
        .maybeSingle();

      let cohortId = cohort?.id;

      if (cohortError) {
        if (cohortError.message?.includes('duplicate')) {
          const { data } = await supabase
            .from('cohorts')
            .select('id')
            .eq('name', 'Turma 2025.1')
            .maybeSingle();
          cohortId = data?.id;
          addLog('Cohort já existe, usando existente');
        } else {
          throw cohortError;
        }
      } else {
        addLog('Cohort criado com sucesso');
      }

      if (!cohortId) {
        throw new Error('Não foi possível obter ID do cohort');
      }

      // PASSO 3: Criar empresas
      addLog('Criando empresas...');
      setStep(3);

      const companies = [
        {
          name: 'TechStart AI',
          description: 'Startup de inteligência artificial aplicada à educação',
          current_program_key: 'hotel_de_projetos',
          website: 'https://techstart.example.com',
          cohort_id: cohortId
        },
        {
          name: 'EcoSolutions Brasil',
          description: 'Soluções sustentáveis para gestão de resíduos corporativos',
          current_program_key: 'pre_residencia',
          website: 'https://ecosolutions.example.com',
          cohort_id: cohortId
        },
        {
          name: 'HealthApp+',
          description: 'Aplicativo de saúde e bem-estar com foco em prevenção',
          current_program_key: 'residencia',
          website: 'https://healthapp.example.com',
          cohort_id: cohortId
        },
        {
          name: 'FinTech Inclusiva',
          description: 'Plataforma de microcrédito e educação financeira',
          current_program_key: 'hotel_de_projetos',
          website: 'https://fintechinclusiva.example.com',
          cohort_id: cohortId
        },
        {
          name: 'AgriTech Connect',
          description: 'Marketplace B2B conectando produtores rurais a compradores',
          current_program_key: 'pre_residencia',
          website: 'https://agritech.example.com',
          cohort_id: cohortId
        }
      ];

      const { data: createdCompanies, error: companiesError } = await supabase
        .from('companies')
        .insert(companies)
        .select();

      if (companiesError) throw companiesError;
      addLog(`${createdCompanies?.length || 0} empresas criadas`);

      // PASSO 4: Criar deliverables para cada empresa
      addLog('Criando deliverables...');
      setStep(4);

      if (createdCompanies) {
        let totalDeliverables = 0;
        for (const company of createdCompanies) {
          const program = programs.find(p => p.key === company.current_program_key);
          if (program) {
            const deliverables = program.config.required_deliverables.map(rd => ({
              company_id: company.id,
              program_key: company.current_program_key,
              deliverable_key: rd.key,
              deliverable_label: rd.label,
              status: 'a_fazer' as const,
              approval_required: rd.approval_required
            }));

            const { error } = await supabase
              .from('deliverables')
              .insert(deliverables);

            if (error && !error.message?.includes('duplicate')) {
              throw error;
            }
            totalDeliverables += deliverables.length;
          }
        }
        addLog(`${totalDeliverables} deliverables criados`);
      }

      // PASSO 5: Criar usuário admin
      addLog('Criando usuário administrador...');
      setStep(5);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@hubempresas.com',
        password: 'HubAdmin123!',
        options: {
          data: {
            full_name: 'Administrador HUB',
            role: 'admin'
          }
        }
      });

      if (authError) {
        if (authError.message?.includes('already registered')) {
          addLog('Usuário admin já existe');
        } else {
          throw authError;
        }
      } else {
        addLog('Usuário admin criado com sucesso');

        // Criar profile
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: 'admin@hubempresas.com',
              full_name: 'Administrador HUB',
              role: 'admin'
            });

          if (profileError && !profileError.message?.includes('duplicate')) {
            console.error('Erro ao criar profile:', profileError);
          } else {
            addLog('Profile do admin criado');
          }
        }
      }

      addLog('Setup concluído com sucesso!');
      setStep(6);

      // Aguardar 2 segundos antes de redirecionar
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erro durante o setup');
      addLog(`ERRO: ${err.message}`);
      console.error('Erro no setup:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Inicial - HUB Empresas</h1>
          <p className="text-gray-600">Configure o banco de dados e crie o primeiro usuário administrador</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erro no Setup</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <p className="font-semibold mb-2">O setup irá:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Criar 3 programas (Hotel de Projetos, Pré-Residência, Residência)</li>
                <li>Criar 1 cohort (Turma 2025.1)</li>
                <li>Criar 5 empresas de exemplo</li>
                <li>Criar deliverables para cada empresa</li>
                <li>Criar usuário administrador (admin@hubempresas.com)</li>
              </ul>
            </div>

            <button
              onClick={setupDatabase}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Iniciar Setup
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>

            <div className="space-y-2">
              {[
                { num: 1, label: 'Criando programas' },
                { num: 2, label: 'Criando cohort' },
                { num: 3, label: 'Criando empresas' },
                { num: 4, label: 'Criando deliverables' },
                { num: 5, label: 'Criando usuário admin' },
                { num: 6, label: 'Finalizando' }
              ].map(({ num, label }) => (
                <div key={num} className={`flex items-center p-3 rounded ${
                  step > num ? 'bg-green-50 text-green-700' :
                  step === num ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-50 text-gray-400'
                }`}>
                  {step > num ? (
                    <CheckCircle className="w-5 h-5 mr-3" />
                  ) : step === num ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 mr-3 rounded-full border-2 border-current" />
                  )}
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.length > 0 && !loading && (
          <div className="mt-6">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Setup concluído com sucesso!</span>
            </div>
            <p className="text-center text-gray-600 mb-4">Redirecionando para o login...</p>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {logs.length > 0 && !loading && !error && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Credenciais de acesso:</p>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-mono text-sm"><strong>Email:</strong> admin@hubempresas.com</p>
              <p className="font-mono text-sm"><strong>Senha:</strong> HubAdmin123!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
