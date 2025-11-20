import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, HelpCircle } from 'lucide-react';
import { supabase, type Company, type Evaluation, type Deliverable, type Program } from '@/lib/supabase';

interface WhatsMissingWidgetProps {
  company: Company;
}

interface Requirement {
  type: 'score_geral' | 'dimension' | 'deliverable' | 'gate';
  label: string;
  status: 'met' | 'at_risk' | 'not_met' | 'pending' | 'not_evaluated';
  current?: number;
  required?: number;
  difference?: number;
  details?: string;
  action?: string;
}

export default function WhatsMissingWidget({ company }: WhatsMissingWidgetProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ 
    needsAttention: 0, 
    estimatedDays: '3-5',
    canAdvance: false 
  });

  useEffect(() => {
    loadRequirements();
  }, [company.id]);

  const loadRequirements = async () => {
    try {
      setLoading(true);

      // Buscar programa atual
      const { data: program } = await supabase
        .from('programs')
        .select('*')
        .eq('key', company.current_program_key)
        .single();

      if (!program) {
        setLoading(false);
        return;
      }

      // Buscar última avaliação válida
      const { data: latestEval } = await supabase
        .from('evaluations')
        .select('*')
        .eq('company_id', company.id)
        .eq('program_key', company.current_program_key)
        .eq('is_valid', true)
        .order('evaluation_date', { ascending: false })
        .maybeSingle();

      // Buscar deliverables
      const { data: deliverables } = await supabase
        .from('deliverables')
        .select('*')
        .eq('company_id', company.id)
        .eq('program_key', company.current_program_key);

      const reqs: Requirement[] = [];
      const config = program.config;
      const passageConfig = config.passage_to_next_program;

      if (passageConfig) {
        // 1. Score Geral
        const requiredWeighted = passageConfig.weighted_score_min;
        const currentWeighted = latestEval?.weighted_score || 0;
        const diff = requiredWeighted - currentWeighted;

        reqs.push({
          type: 'score_geral',
          label: `Score Geral ≥ ${requiredWeighted.toFixed(1)}`,
          status: currentWeighted >= requiredWeighted ? 'met' : 
                  (diff <= 0.3 ? 'at_risk' : 'not_met'),
          current: currentWeighted,
          required: requiredWeighted,
          difference: Math.max(0, diff),
          details: `Seu Score: ${currentWeighted.toFixed(1)}/10 ${diff > 0 ? `(faltam ${diff.toFixed(1)})` : '✓'}`
        });

        // 2. Scores por dimensão
        const dimensions = [
          { key: 'mercado', label: 'Mercado', weight: '28%' },
          { key: 'perfil_empreendedor', label: 'Perfil Empreendedor', weight: '21%' },
          { key: 'tecnologia_qualidade', label: 'Tecnologia & Qualidade', weight: '14%' },
          { key: 'gestao', label: 'Gestão', weight: '16%' },
          { key: 'financeiro', label: 'Financeiro', weight: '16%' }
        ];

        dimensions.forEach(dim => {
          const requiredScore = passageConfig.dimension_mins[dim.key as keyof typeof passageConfig.dimension_mins];
          const currentScore = latestEval?.[`${dim.key}_score` as keyof Evaluation] as number || 0;
          const dimDiff = requiredScore - currentScore;

          reqs.push({
            type: 'dimension',
            label: `${dim.label} ≥ ${requiredScore.toFixed(1)}`,
            status: currentScore >= requiredScore ? 'met' : 
                    (dimDiff <= 0.2 ? 'at_risk' : 'not_met'),
            current: currentScore,
            required: requiredScore,
            difference: Math.max(0, dimDiff),
            details: `Seu Score: ${currentScore.toFixed(1)}/10 ${dimDiff > 0 ? `(FALTAM ${dimDiff.toFixed(1)}!)` : '✓'}`,
            action: dimDiff > 0 ? 'Ver feedback' : undefined
          });
        });

        // 3. Deliverables obrigatórios
        const requiredDeliverables = config.required_deliverables.filter(d => d.approval_required);
        requiredDeliverables.forEach(reqDeliv => {
          const deliv = deliverables?.find(d => d.deliverable_key === reqDeliv.key);
          
          let status: Requirement['status'] = 'not_evaluated';
          let details = 'Não iniciado';
          
          if (deliv) {
            if (deliv.status === 'aprovado') {
              status = 'met';
              details = 'Aprovado ✓';
            } else if (deliv.status === 'em_revisao') {
              status = 'pending';
              const submittedDate = new Date(deliv.updated_at).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
              });
              details = `Enviado ${submittedDate}, Aguardando`;
            } else if (deliv.status === 'em_andamento') {
              status = 'at_risk';
              details = 'Em andamento';
            } else {
              status = 'not_met';
              details = 'A fazer';
            }
          }

          reqs.push({
            type: 'deliverable',
            label: reqDeliv.label,
            status,
            details,
            action: status !== 'met' ? 'Ver Detalhes' : undefined
          });
        });

        // 4. Gate (Consideração Final)
        const gateValue = latestEval?.gate_value;
        const isBlocking = gateValue === 'Muitas falhas / Total falta de amadurecimento (bloqueia)';
        
        reqs.push({
          type: 'gate',
          label: 'Consideração Final (Gate)',
          status: !gateValue ? 'not_evaluated' : 
                  isBlocking ? 'not_met' : 'met',
          details: !gateValue ? 'Não avaliado ainda' : gateValue,
        });
      }

      setRequirements(reqs);

      // Calcular resumo
      const needsAttention = reqs.filter(r => 
        r.status === 'not_met' || r.status === 'at_risk' || r.status === 'pending'
      ).length;

      const canAdvance = reqs.every(r => r.status === 'met');
      
      let estimatedDays = '3-5';
      if (needsAttention > 5) estimatedDays = '10-15';
      else if (needsAttention > 3) estimatedDays = '7-10';
      else if (needsAttention === 0) estimatedDays = '0';

      setSummary({ needsAttention, estimatedDays, canAdvance });

    } catch (error) {
      console.error('Erro ao carregar requisitos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (status: Requirement['status']) => {
    switch (status) {
      case 'met':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'at_risk':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'not_met':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'not_evaluated':
        return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Requirement['status']) => {
    switch (status) {
      case 'met':
        return 'bg-green-50 border-green-200';
      case 'at_risk':
        return 'bg-yellow-50 border-yellow-200';
      case 'not_met':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      case 'not_evaluated':
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-xl font-bold text-gray-900">O que falta para avançar?</h3>
        <p className="text-sm text-gray-600 mt-1">
          Requisitos para passar para o próximo programa
        </p>
      </div>

      <div className="p-6 space-y-4">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 transition-all ${getStatusColor(req.status)}`}
          >
            <div className="flex items-start space-x-3">
              {getIcon(req.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{req.label}</h4>
                </div>
                <p className="text-sm text-gray-700 mt-1">{req.details}</p>
                {req.action && (
                  <button className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium">
                    → {req.action}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">RESUMO:</span>
            {summary.canAdvance ? (
              <span className="text-green-600 font-bold flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Pronto para avançar!
              </span>
            ) : (
              <span className="text-orange-600 font-semibold">
                {summary.needsAttention} {summary.needsAttention === 1 ? 'item precisa' : 'itens precisam'} de atenção
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Tempo estimado:</span>
            <span className="font-semibold">{summary.estimatedDays} dias</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Contatar Mentor
            </button>
            <button className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Agendar Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
