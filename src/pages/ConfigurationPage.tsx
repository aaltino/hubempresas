import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
  Users,
  Target,
  Award,
  BarChart3
} from 'lucide-react';

interface Program {
  id?: string;
  key: string;
  label: string;
  questionnaire_items_target: number;
  config: {
    required_deliverables: Array<{
      key: string;
      label: string;
      approval_required: boolean;
    }>;
    passage_to_next_program?: {
      weighted_score_min: number;
      dimension_mins: {
        mercado: number;
        perfil_empreendedor: number;
        tecnologia_qualidade: number;
        gestao: number;
        financeiro: number;
      };
      gate_required: boolean;
    };
    maintenance_thresholds?: {
      weighted_score_min: number;
      dimension_mins: {
        mercado: number;
        perfil_empreendedor: number;
        tecnologia_qualidade: number;
        gestao: number;
        financeiro: number;
      };
      gate_required: boolean;
    };
  };
}

interface DimensionWeights {
  mercado: number;
  perfil_empreendedor: number;
  tecnologia_qualidade: number;
  gestao: number;
  financeiro: number;
}

const defaultWeights: DimensionWeights = {
  mercado: 28,
  perfil_empreendedor: 21,
  tecnologia_qualidade: 14,
  gestao: 16,
  financeiro: 16
};

const programLabels: Record<string, string> = {
  hotel_de_projetos: 'Hotel de Projetos',
  pre_residencia: 'Pré-Residência',
  residencia: 'Residência'
};

export default function ConfigurationPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('programs');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Estados para edição
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editingDeliverable, setEditingDeliverable] = useState<any>(null);
  const [editingWeights, setEditingWeights] = useState(false);
  const [dimensionWeights, setDimensionWeights] = useState<DimensionWeights>(defaultWeights);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Carregar programas
      const { data: programsData } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (programsData) {
        setPrograms(programsData);
      }

      // Carregar pesos das dimensões (poderia estar em uma tabela separada ou ser global)
      // Por agora vou usar os valores padrão
      setDimensionWeights(defaultWeights);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrograms = async () => {
    try {
      setSaving(true);
      
      for (const program of programs) {
        if (program.id) {
          // Atualizar programa existente
          await supabase
            .from('programs')
            .update({
              label: program.label,
              questionnaire_items_target: program.questionnaire_items_target,
              config: program.config
            })
            .eq('id', program.id);
        } else {
          // Criar novo programa
          await supabase
            .from('programs')
            .insert([program]);
        }
      }
      
      await loadConfiguration();
      alert('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const addProgram = () => {
    const newProgram: Program = {
      key: `programa_${Date.now()}`,
      label: 'Novo Programa',
      questionnaire_items_target: 50,
      config: {
        required_deliverables: [],
        passage_to_next_program: {
          weighted_score_min: 7.0,
          dimension_mins: {
            mercado: 7.0,
            perfil_empreendedor: 6.5,
            tecnologia_qualidade: 6.5,
            gestao: 6.0,
            financeiro: 6.0
          },
          gate_required: false
        }
      }
    };
    setPrograms([...programs, newProgram]);
    setEditingProgram(newProgram);
  };

  const deleteProgram = (index: number) => {
    if (confirm('Tem certeza que deseja excluir este programa?')) {
      const updatedPrograms = programs.filter((_, i) => i !== index);
      setPrograms(updatedPrograms);
    }
  };

  const addDeliverable = (programIndex: number, program: Program) => {
    const newDeliverable = {
      key: `deliverable_${Date.now()}`,
      label: 'Novo Entregável',
      approval_required: true
    };
    
    const updatedPrograms = [...programs];
    if (!updatedPrograms[programIndex].config.required_deliverables) {
      updatedPrograms[programIndex].config.required_deliverables = [];
    }
    updatedPrograms[programIndex].config.required_deliverables.push(newDeliverable);
    setPrograms(updatedPrograms);
  };

  const deleteDeliverable = (programIndex: number, deliverableIndex: number) => {
    const updatedPrograms = [...programs];
    updatedPrograms[programIndex].config.required_deliverables.splice(deliverableIndex, 1);
    setPrograms(updatedPrograms);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const updatedPrograms = [...programs];
    const draggedProgram = updatedPrograms[draggedIndex];
    
    // Remove o item arrastado
    updatedPrograms.splice(draggedIndex, 1);
    
    // Insere na nova posição
    updatedPrograms.splice(dropIndex, 0, draggedProgram);
    
    setPrograms(updatedPrograms);
    setDraggedIndex(null);
  };

  const tabs = [
    { id: 'programs', label: 'Programas', icon: Settings },
    { id: 'deliverables', label: 'Entregáveis', icon: Target },
    { id: 'passage-rules', label: 'Regras de Passagem', icon: CheckCircle },
    { id: 'dimensions', label: 'Dimensões e Pesos', icon: BarChart3 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuração da Jornada</h2>
        <p className="text-gray-600 mt-1">Configure programas, entregáveis, regras e dimensões de avaliação</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Tab 1: Programas */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Programas do HUB</h3>
              <button
                onClick={addProgram}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Programa
              </button>
            </div>

            <div className="space-y-4">
              {programs.map((program, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`border border-gray-200 rounded-lg p-4 ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                      <div>
                        <h4 className="font-medium text-gray-900">{program.label}</h4>
                        <p className="text-sm text-gray-500">Key: {program.key}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingProgram(editingProgram === program ? null : program)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {programs.length > 1 && (
                        <button
                          onClick={() => deleteProgram(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {editingProgram === program && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Programa
                          </label>
                          <input
                            type="text"
                            value={program.label}
                            onChange={(e) => {
                              const updatedPrograms = [...programs];
                              updatedPrograms[index].label = e.target.value;
                              setPrograms(updatedPrograms);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Key (identificador único)
                          </label>
                          <input
                            type="text"
                            value={program.key}
                            onChange={(e) => {
                              const updatedPrograms = [...programs];
                              updatedPrograms[index].key = e.target.value;
                              setPrograms(updatedPrograms);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target de Questões
                          </label>
                          <input
                            type="number"
                            value={program.questionnaire_items_target}
                            onChange={(e) => {
                              const updatedPrograms = [...programs];
                              updatedPrograms[index].questionnaire_items_target = parseInt(e.target.value);
                              setPrograms(updatedPrograms);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Entregáveis */}
        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Entregáveis Obrigatórios por Programa</h3>
            
            <div className="space-y-6">
              {programs.map((program, programIndex) => (
                <div key={programIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{program.label}</h4>
                    <button
                      onClick={() => addDeliverable(programIndex, program)}
                      className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Entregável
                    </button>
                  </div>

                  <div className="space-y-3">
                    {program.config.required_deliverables?.map((deliverable, deliverableIndex) => (
                      <div key={deliverableIndex} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={deliverable.label}
                            onChange={(e) => {
                              const updatedPrograms = [...programs];
                              updatedPrograms[programIndex].config.required_deliverables[deliverableIndex].label = e.target.value;
                              setPrograms(updatedPrograms);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <div className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              id={`approval-${programIndex}-${deliverableIndex}`}
                              checked={deliverable.approval_required}
                              onChange={(e) => {
                                const updatedPrograms = [...programs];
                                updatedPrograms[programIndex].config.required_deliverables[deliverableIndex].approval_required = e.target.checked;
                                setPrograms(updatedPrograms);
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`approval-${programIndex}-${deliverableIndex}`} className="ml-2 text-sm text-gray-700">
                              Requer aprovação do mentor
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteDeliverable(programIndex, deliverableIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500 italic">Nenhum entregável configurado</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Regras de Passagem */}
        {activeTab === 'passage-rules' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Regras de Passagem entre Programas</h3>
            
            <div className="space-y-6">
              {programs.map((program, programIndex) => {
                const isLastProgram = programIndex === programs.length - 1;
                const rules = isLastProgram 
                  ? program.config.maintenance_thresholds 
                  : program.config.passage_to_next_program;
                
                return (
                  <div key={programIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <h4 className="font-medium text-gray-900">{program.label}</h4>
                      {isLastProgram && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Programa Final
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Score Mínimo Ponderado
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={rules?.weighted_score_min || 0}
                          onChange={(e) => {
                            const updatedPrograms = [...programs];
                            const value = parseFloat(e.target.value);
                            
                            if (isLastProgram) {
                              if (!updatedPrograms[programIndex].config.maintenance_thresholds) {
                                updatedPrograms[programIndex].config.maintenance_thresholds = {
                                  weighted_score_min: 0,
                                  dimension_mins: { mercado: 0, perfil_empreendedor: 0, tecnologia_qualidade: 0, gestao: 0, financeiro: 0 },
                                  gate_required: false
                                };
                              }
                              updatedPrograms[programIndex].config.maintenance_thresholds!.weighted_score_min = value;
                            } else {
                              if (!updatedPrograms[programIndex].config.passage_to_next_program) {
                                updatedPrograms[programIndex].config.passage_to_next_program = {
                                  weighted_score_min: 0,
                                  dimension_mins: { mercado: 0, perfil_empreendedor: 0, tecnologia_qualidade: 0, gestao: 0, financeiro: 0 },
                                  gate_required: false
                                };
                              }
                              updatedPrograms[programIndex].config.passage_to_next_program!.weighted_score_min = value;
                            }
                            
                            setPrograms(updatedPrograms);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requer Gate Aprovado
                        </label>
                        <div className="flex items-center h-10">
                          <input
                            type="checkbox"
                            checked={rules?.gate_required || false}
                            onChange={(e) => {
                              const updatedPrograms = [...programs];
                              const value = e.target.checked;
                              
                              if (isLastProgram) {
                                if (!updatedPrograms[programIndex].config.maintenance_thresholds) {
                                  updatedPrograms[programIndex].config.maintenance_thresholds = {
                                    weighted_score_min: 0,
                                    dimension_mins: { mercado: 0, perfil_empreendedor: 0, tecnologia_qualidade: 0, gestao: 0, financeiro: 0 },
                                    gate_required: false
                                  };
                                }
                                updatedPrograms[programIndex].config.maintenance_thresholds!.gate_required = value;
                              } else {
                                if (!updatedPrograms[programIndex].config.passage_to_next_program) {
                                  updatedPrograms[programIndex].config.passage_to_next_program = {
                                    weighted_score_min: 0,
                                    dimension_mins: { mercado: 0, perfil_empreendedor: 0, tecnologia_qualidade: 0, gestao: 0, financeiro: 0 },
                                    gate_required: false
                                  };
                                }
                                updatedPrograms[programIndex].config.passage_to_next_program!.gate_required = value;
                              }
                              
                              setPrograms(updatedPrograms);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {isLastProgram ? 'Manutenção do Programa' : 'Passagem para Próximo'}
                          </span>
                        </div>
                      </div>

                      {/* Scores mínimos por dimensão */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Scores Mínimos por Dimensão
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {Object.entries({
                            mercado: 'Mercado',
                            perfil_empreendedor: 'Perfil Empreendedor',
                            tecnologia_qualidade: 'Tecnologia & Qualidade',
                            gestao: 'Gestão',
                            financeiro: 'Financeiro'
                          }).map(([key, label]) => (
                            <div key={key}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {label}
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                value={rules?.dimension_mins?.[key as keyof typeof rules.dimension_mins] || 0}
                                onChange={(e) => {
                                  const updatedPrograms = [...programs];
                                  const value = parseFloat(e.target.value);
                                  
                                  if (isLastProgram) {
                                    if (!updatedPrograms[programIndex].config.maintenance_thresholds) {
                                      updatedPrograms[programIndex].config.maintenance_thresholds = {
                                        weighted_score_min: 0,
                                        dimension_mins: { mercado: 0, perfil_empreendedor: 0, tecnologia_qualidade: 0, gestao: 0, financeiro: 0 },
                                        gate_required: false
                                      };
                                    }
                                    const maintenanceThresholds = updatedPrograms[programIndex].config.maintenance_thresholds!;
                                    (maintenanceThresholds.dimension_mins as any)[key] = value;
                                  } else {
                                    if (!updatedPrograms[programIndex].config.passage_to_next_program) {
                                      updatedPrograms[programIndex].config.passage_to_next_program = {
                                        weighted_score_min: 0,
                                        dimension_mins: { mercado: 0, perfil_empreendedor: 0, tecnologia_qualidade: 0, gestao: 0, financeiro: 0 },
                                        gate_required: false
                                      };
                                    }
                                    const passageRules = updatedPrograms[programIndex].config.passage_to_next_program!;
                                    (passageRules.dimension_mins as any)[key] = value;
                                  }
                                  
                                  setPrograms(updatedPrograms);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Dimensões e Pesos */}
        {activeTab === 'dimensions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Dimensões de Avaliação e Pesos</h3>
              <button
                onClick={() => setEditingWeights(!editingWeights)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {editingWeights ? 'Cancelar' : 'Editar Pesos'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries({
                mercado: { label: 'Mercado', description: 'Análise do mercado, concorrência e oportunidades' },
                perfil_empreendedor: { label: 'Perfil Empreendedor', description: 'Competências e características do empreendedor' },
                tecnologia_qualidade: { label: 'Tecnologia & Qualidade', description: 'Aspectos técnicos e qualidade do produto/serviço' },
                gestao: { label: 'Gestão', description: 'Capacidade de gestão e organização' },
                financeiro: { label: 'Financeiro', description: 'Saúde financeira e viabilidade econômica' }
              }).map(([key, { label, description }]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{label}</h4>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-600">
                        {dimensionWeights[key as keyof DimensionWeights]}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{description}</p>
                  
                  {editingWeights ? (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={dimensionWeights[key as keyof DimensionWeights]}
                        onChange={(e) => {
                          const newWeights = { ...dimensionWeights };
                          newWeights[key as keyof DimensionWeights] = parseInt(e.target.value);
                          setDimensionWeights(newWeights);
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${dimensionWeights[key as keyof DimensionWeights]}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Validação dos pesos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Total dos Pesos: {Object.values(dimensionWeights).reduce((sum, weight) => sum + weight, 0)}%
                </span>
                {Object.values(dimensionWeights).reduce((sum, weight) => sum + weight, 0) !== 100 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Total deve ser 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Válido
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <button
          onClick={savePrograms}
          disabled={saving || Object.values(dimensionWeights).reduce((sum, weight) => sum + weight, 0) !== 100}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </button>
      </div>
    </div>
  );
}