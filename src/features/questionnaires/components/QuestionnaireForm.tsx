// Componente: QuestionnaireForm - Formulário de Questionário com Auto-Save
// Implementa sistema de questionários self-service com feedback em tempo real

import React, { useState, useEffect, useCallback } from 'react';
import { QuestionnaireService } from '../services/questionnaireService';
import type {
  QuestionnaireTemplate,
  QuestionnaireResponse,
  QuestionnaireResponses,
  QuestionnaireBlockScores
} from '../types/questionnaire';
import { Button } from '@/design-system/ui/Button';
import { Card } from '@/design-system/ui/Card';
import { Alert } from '@/design-system/feedback/Alert';
import { Loader } from 'lucide-react';

interface QuestionnaireFormProps {
  companyId: string;
  template: QuestionnaireTemplate;
  existingResponse?: QuestionnaireResponse;
  onComplete?: (response: QuestionnaireResponse) => void;
}

export function QuestionnaireForm({
  companyId,
  template,
  existingResponse,
  onComplete
}: QuestionnaireFormProps) {
  const [currentStep, setCurrentStep] = useState(existingResponse?.current_step || 1);
  const [responses, setResponses] = useState<QuestionnaireResponses>(
    existingResponse?.responses || {}
  );
  const [responseId, setResponseId] = useState<string | undefined>(existingResponse?.id);
  const [blockScores, setBlockScores] = useState<QuestionnaireBlockScores>(
    existingResponse?.block_scores || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const blocks = template.blocks.blocks;
  const currentBlock = blocks[currentStep - 1];
  const totalSteps = blocks.length;

  // Auto-save quando respostas mudam (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (Object.keys(responses).length > 0) {
        saveResponses();
      }
    }, 2000); // 2 segundos de debounce

    return () => clearTimeout(timeout);
  }, [responses]);

  const saveResponses = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validar dados antes de enviar
      const payload = {
        company_id: companyId,
        template_id: template.id,
        responses: responses,
        current_step: currentStep,
        response_id: responseId
      };

      // Validação Zod (lançará erro se inválido)
      // Importado dinamicamente para evitar ciclo ou apenas usar se necessário
      const { SaveResponsesSchema } = await import('../schemas/questionnaireSchema');
      SaveResponsesSchema.parse(payload);

      const result = await QuestionnaireService.saveResponses(payload);

      if (!responseId) {
        setResponseId(result.response_id);
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error('Erro ao salvar:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao salvar respostas automaticamente');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateBlockProgress = () => {
    const answeredInBlock = currentBlock.questions.filter(
      q => responses[q.id] !== undefined
    ).length;
    return (answeredInBlock / currentBlock.questions.length) * 100;
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      await saveResponses();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Salvar respostas finais
      await saveResponses();

      // Calcular score final
      if (responseId) {
        const scoreResult = await QuestionnaireService.calculateScore({
          response_id: responseId,
          company_id: companyId,
          template_id: template.id,
          responses: responses
        });

        setBlockScores(scoreResult.block_scores);

        // Buscar resposta atualizada
        const updatedResponse = await QuestionnaireService.getLatestResponse(
          companyId,
          template.program_key
        );

        if (updatedResponse && onComplete) {
          onComplete(updatedResponse);
        }
      }
    } catch (err) {
      console.error('Erro ao finalizar:', err);
      setError('Erro ao finalizar questionário');
    } finally {
      setIsSaving(false);
    }
  };

  const isBlockComplete = () => {
    return currentBlock.questions.every(q => responses[q.id] !== undefined);
  };

  const blockProgress = calculateBlockProgress();

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{template.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Bloco {currentStep} de {totalSteps}: {currentBlock.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {isSaving ? (
                <span className="flex items-center gap-2 text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  Salvando...
                </span>
              ) : lastSaved ? (
                <span className="text-green-600">
                  Salvo às {lastSaved.toLocaleTimeString()}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Barra de progresso geral */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso Geral</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Barra de progresso do bloco atual */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso do Bloco</span>
            <span>{Math.round(blockProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${blockProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <Alert type="error" title="Erro">
          {error}
        </Alert>
      )}

      {/* Questões do bloco atual */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">{currentBlock.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Peso: {(currentBlock.weight * 100).toFixed(0)}% do score final
            </p>
          </div>

          {currentBlock.questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <label className="block">
                <span className="text-gray-900 font-medium">
                  {index + 1}. {question.text}
                </span>
              </label>

              {/* Escala 0-2 (Não, Parcial, Sim) */}
              <div className="flex gap-4">
                {[
                  { value: 0, label: 'Não', color: 'red' },
                  { value: 1, label: 'Parcial', color: 'yellow' },
                  { value: 2, label: 'Sim', color: 'green' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswerChange(question.id, option.value)}
                    className={`
                      flex-1 py-3 px-4 rounded-lg border-2 transition-all
                      ${responses[question.id] === option.value
                        ? `border-${option.color}-500 bg-${option.color}-50 ring-2 ring-${option.color}-200`
                        : 'border-gray-300 bg-white hover:border-gray-400'
                      }
                    `}
                  >
                    <span className={`
                      font-medium
                      ${responses[question.id] === option.value
                        ? `text-${option.color}-700`
                        : 'text-gray-700'
                      }
                    `}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>

        <div className="text-sm text-gray-600">
          {isBlockComplete() ? (
            <span className="text-green-600 font-medium">
              Bloco completo
            </span>
          ) : (
            <span>
              {currentBlock.questions.filter(q => responses[q.id] !== undefined).length} de{' '}
              {currentBlock.questions.length} respondidas
            </span>
          )}
        </div>

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={!isBlockComplete()}
          >
            Próximo Bloco
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!isBlockComplete() || isSaving}
            variant="primary"
          >
            {isSaving ? 'Finalizando...' : 'Finalizar Questionário'}
          </Button>
        )}
      </div>
    </div>
  );
}
