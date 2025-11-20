import React, { useEffect, useState } from 'react';
import { QuestionnaireService } from '../services/questionnaireService';
import { Card } from '@/design-system/ui/Card';
import { DashboardSkeleton } from '@/design-system/feedback/Skeleton';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { Alert } from '@/design-system/feedback/Alert';
import { BarChart3, CheckCircle, FileText, TrendingUp } from 'lucide-react';

interface Stats {
    total_responses: number;
    completed_responses: number;
    average_score: number;
    completion_rate: number;
}

export function QuestionnaireStatisticsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await QuestionnaireService.getQuestionnaireStatistics();
            setStats(data);
        } catch (err) {
            console.error('Erro ao carregar estatísticas:', err);
            setError('Não foi possível carregar as estatísticas.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Breadcrumbs items={[
                    { label: 'Questionários', href: '/questionarios' },
                    { label: 'Estatísticas', icon: <BarChart3 className="w-4 h-4" /> }
                ]} />
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[
                { label: 'Questionários', href: '/questionarios' },
                { label: 'Estatísticas', icon: <BarChart3 className="w-4 h-4" /> }
            ]} />

            <div>
                <h1 className="text-3xl font-bold text-gray-900">Estatísticas de Questionários</h1>
                <p className="text-gray-600 mt-2">
                    Visão geral do engajamento e desempenho das startups
                </p>
            </div>

            {error && (
                <Alert type="error" title="Erro">
                    {error}
                </Alert>
            )}

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total de Respostas</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_responses}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Completados</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.completed_responses}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Média de Score</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.average_score.toFixed(1)}%</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.completion_rate}%</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
