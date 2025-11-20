import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, HelpCircle } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // Seletor CSS do elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface Tutorial {
  id: string;
  name: string;
  steps: TutorialStep[];
  role?: 'admin' | 'mentor' | 'company';
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'dashboard-admin',
    name: 'Dashboard - Visão Geral',
    role: 'admin',
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo ao HUB Empresas',
        description: 'Este tutorial vai guiá-lo pelas principais funcionalidades do dashboard administrativo.',
      },
      {
        id: 'stats',
        title: 'Estatísticas Gerais',
        description: 'Aqui você vê o total de empresas e a distribuição por programa (Hotel de Projetos, Pré-Residência e Residência).',
      },
      {
        id: 'filters',
        title: 'Filtros Avançados',
        description: 'Use os filtros para buscar empresas específicas por nome, programa, coorte ou status de elegibilidade.',
      },
      {
        id: 'funnel',
        title: 'Funil de Empresas',
        description: 'O funil mostra a distribuição de empresas pelos três estágios do programa.',
      },
      {
        id: 'alerts',
        title: 'Alertas e Empresas em Risco',
        description: 'Esta seção destaca empresas que precisam de atenção imediata. Use os filtros por gravidade e período para refinar a visualização.',
      },
      {
        id: 'actions',
        title: 'Ações Rápidas',
        description: 'Use o menu de ações rápidas para convidar empresas, criar avaliações e exportar relatórios.',
      },
      {
        id: 'exports',
        title: 'Exportações',
        description: 'Exporte dados em PDF, CSV ou XLSX para análises externas.',
      },
      {
        id: 'complete',
        title: 'Tutorial Completo!',
        description: 'Agora você conhece as principais funcionalidades. Explore à vontade!',
      },
    ],
  },
  {
    id: 'dashboard-company',
    name: 'Dashboard - Empresa',
    role: 'company',
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo à sua empresa',
        description: 'Este tutorial vai mostrar como acompanhar seu progresso no programa.',
      },
      {
        id: 'progress',
        title: 'Progresso no Funil',
        description: 'Veja em qual estágio do programa sua empresa está e quanto falta para avançar.',
      },
      {
        id: 'deliverables',
        title: 'Deliverables',
        description: 'Acompanhe quantos deliverables foram aprovados e quantos ainda estão pendentes.',
      },
      {
        id: 'evaluation',
        title: 'Última Avaliação',
        description: 'Veja a pontuação da sua última avaliação e os scores por dimensão.',
      },
      {
        id: 'missing',
        title: 'O que Falta para Avançar',
        description: 'Este widget crítico mostra exatamente o que sua empresa precisa fazer para avançar para o próximo estágio.',
      },
      {
        id: 'complete',
        title: 'Tutorial Completo!',
        description: 'Use o menu lateral para navegar entre as seções. Boa sorte!',
      },
    ],
  },
  {
    id: 'upload-documents',
    name: 'Upload de Documentos',
    role: 'company',
    steps: [
      {
        id: 'welcome',
        title: 'Como Fazer Upload',
        description: 'Aprenda a enviar seus deliverables obrigatórios.',
      },
      {
        id: 'select',
        title: 'Selecione o Deliverable',
        description: 'Primeiro, escolha qual deliverable você vai enviar na lista suspensa.',
      },
      {
        id: 'mode',
        title: 'Escolha o Modo',
        description: 'Você pode fazer upload de um arquivo (PDF, DOCX) ou fornecer uma URL externa.',
      },
      {
        id: 'upload',
        title: 'Faça o Upload',
        description: 'Arraste e solte o arquivo ou clique no botão para selecioná-lo. Se escolheu URL, cole o link e clique em "Adicionar URL".',
      },
      {
        id: 'status',
        title: 'Acompanhe o Status',
        description: 'Após o upload, você pode ver o status (pendente, aprovado ou rejeitado) na tabela de documentos.',
      },
      {
        id: 'complete',
        title: 'Pronto!',
        description: 'Seus deliverables serão revisados por um mentor. Você receberá notificações sobre o status.',
      },
    ],
  },
];

export function TutorialSystem() {
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

  useEffect(() => {
    // Carregar tutoriais completados do localStorage
    const completed = localStorage.getItem('completedTutorials');
    if (completed) {
      setCompletedTutorials(JSON.parse(completed));
    }
  }, []);

  const startTutorial = (tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
    setCurrentStep(0);
    setShowMenu(false);
  };

  const nextStep = () => {
    if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    if (activeTutorial && !completedTutorials.includes(activeTutorial.id)) {
      const updated = [...completedTutorials, activeTutorial.id];
      setCompletedTutorials(updated);
      localStorage.setItem('completedTutorials', JSON.stringify(updated));
    }
    closeTutorial();
  };

  const closeTutorial = () => {
    setActiveTutorial(null);
    setCurrentStep(0);
  };

  const currentStepData = activeTutorial?.steps[currentStep];
  const progress = activeTutorial
    ? ((currentStep + 1) / activeTutorial.steps.length) * 100
    : 0;

  return (
    <>
      {/* Botão de Ajuda */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-xl hover:scale-110 transition-all duration-200"
          title="Tutoriais e Ajuda"
        >
          <HelpCircle className="w-7 h-7" />
        </button>
      </div>

      {/* Menu de Tutoriais */}
      {showMenu && !activeTutorial && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Tutoriais</h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-1 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Aprenda a usar a plataforma
              </p>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {TUTORIALS.map((tutorial) => (
                <button
                  key={tutorial.id}
                  onClick={() => startTutorial(tutorial)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {tutorial.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {tutorial.steps.length} passos
                      </p>
                    </div>
                    {completedTutorials.includes(tutorial.id) && (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tutorial Ativo */}
      {activeTutorial && currentStepData && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40"></div>
          <div className="fixed inset-x-0 bottom-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 z-50">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {currentStepData.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Passo {currentStep + 1} de {activeTutorial.steps.length}
                  </p>
                </div>
                <button
                  onClick={closeTutorial}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  title="Fechar tutorial"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Barra de Progresso */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Footer com Botões */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                {currentStep === activeTutorial.steps.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
