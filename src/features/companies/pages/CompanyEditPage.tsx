import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/design-system/ui/Button';
import { Card } from '@/design-system/ui/Card';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { useToast } from '@/design-system/feedback/Toast';

export default function CompanyEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        cnpj: '',
        sector: ''
    });

    useEffect(() => {
        if (id) loadCompany();
    }, [id]);

    const loadCompany = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    website: data.website || '',
                    cnpj: data.cnpj || '',
                    sector: data.sector || ''
                });
            }
        } catch (error) {
            console.error('Error loading company:', error);
            addToast({
                type: 'error',
                title: 'Erro ao carregar empresa'
            });
            navigate('/empresas');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const { error } = await supabase
                .from('companies')
                .update({
                    name: formData.name,
                    description: formData.description,
                    website: formData.website,
                    cnpj: formData.cnpj,
                    sector: formData.sector,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            addToast({
                type: 'success',
                title: 'Empresa atualizada com sucesso'
            });
            navigate(`/empresas/${id}`);
        } catch (error) {
            console.error('Error updating company:', error);
            addToast({
                type: 'error',
                title: 'Erro ao atualizar empresa'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Editar Empresa</h1>
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                            <input
                                type="text"
                                value={formData.cnpj}
                                onChange={e => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Setor</label>
                            <input
                                type="text"
                                value={formData.sector}
                                onChange={e => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                            {saving ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
