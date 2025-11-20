// Componente: QuestionnairePage - Página para Preencher Questionário
// Carrega template e resposta existente, renderiza QuestionnaireForm

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { QuestionnaireService } from '../services/questionnaireService';
import { QuestionnaireForm } from '../components/QuestionnaireForm';
import type { QuestionnaireTemplate, QuestionnaireResponse } from '../types/questionnaire';
import { Alert } from '@/design-system/feedback/Alert';
import { Loader, ArrowLeft } from 'lucide-react';
import { Button } from '@/design-system/ui/Button';

export function QuestionnairePage() {
  const { programKey } = useParams<{ programKey: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [template, setTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [existingResponse, setExistingResponse] = useState<QuestionnaireResponse | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestionnaireData() {
      try {
        setLoading(true);
        setError(null);

        // Validar parâmetros necessários
        if (!programKey) {
          setError('Programa não especificado.');
          setLoading(false);
          return;
        }

        if (!profile?.id) {
          setError('Usuário não autenticado.');
          setLoading(false);
          return;
        }

        // Buscar empresa associada ao perfil
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (companyError) {
          console.error('Erro ao buscar empresa:', companyError);
          setError('Erro ao buscar empresa associada ao seu perfil.');
          setLoading(false);
          return;
        }

        if (!companyData) {
          setError('Empresa não encontrada. Certifique-se de estar logado com uma conta vinculada a uma empresa.');
          setLoading(false);
          return;
        }

        const fetchedCompanyId = companyData.id;
        setCompanyId(fetchedCompanyId);

        // Carregar template do questionário
        const templateData = await QuestionnaireService.getTemplateByProgram(programKey);
        if (!templateData) {
          setError(`Template de questionário não encontrado para o programa "${programKey}".`);
          setLoading(false);
          return;
        }
        setTemplate(templateData);

        // Carregar resposta existente (se houver)
        const responseData = await QuestionnaireService.getLatestResponse(
          fetchedCompanyId,
          programKey
        );
        
        // Se há resposta, mas está completa, criar nova
        if (responseData && responseData.status === 'completed') {
          // Iniciar novo questionário
          const newResponse = await QuestionnaireService.startQuestionnaire(
            fetchedCompanyId,
            templateData.id
          );
          setExistingResponse(newResponse);
        } else if (responseData) {
          setExistingResponse(responseData);
        } else {
          // Criar novo questionário se não houver resposta
          const newResponse = await QuestionnaireService.startQuestionnaire(
            fetchedCompanyId,
            templateData.id
          );
          setExistingResponse(newResponse);
        }

      } catch (err: any) {
        console.error('Erro ao carregar questionário:', err);
        setError(err.message || 'Erro ao carregar questionário. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    loadQuestionnaireData();
  }, [programKey, profile?.id]);

  const handleComplete = (response: QuestionnaireResponse) => {
    // Redirecionar de volta para lista de questionários após conclusão
    navigate('/questionarios', { 
      state: { message: 'Questionário concluído com sucesso!' }
    });
  };

  const handleGoBack = () => {
    navigate('/questionarios');
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
          <p className="text-gray-600 font-medium">Carregando questionário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Alert type="error" className="mb-6">
          <div className="space-y-2">
            <p className="font-semibold">Erro ao Carregar Questionário</p>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
        <Button
          variant="secondary"
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista de Questionários
        </Button>
      </div>
    );
  }

  if (!template || !companyId || !existingResponse) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Alert type="warning" className="mb-6">
          <div className="space-y-2">
            <p className="font-semibold">Questionário Não Disponível</p>
            <p className="text-sm">
              Não foi possível carregar o questionário solicitado. Verifique se você tem permissão para acessar este conteúdo.
            </p>
          </div>
        </Alert>
        <Button
          variant="secondary"
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista de Questionários
        </Button>
      </div>
    );
  }

  // Renderizar formulário
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Botão de voltar */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista
        </Button>
      </div>

      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {template.title}
        </h1>
        <p className="text-gray-600">
          Preencha o questionário abaixo para avaliar a prontidão da sua empresa.
        </p>
      </div>

      {/* Formulário de Questionário */}
      <QuestionnaireForm
        companyId={companyId}
        template={template}
        existingResponse={existingResponse}
        onComplete={handleComplete}
      />
    </div>
  );
}
