import React from 'react';
import { useHub } from '../../contexts/HubContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight } from 'lucide-react';

export default function HubSelectionPage() {
    const { userHubs, selectHub, isLoading } = useHub();
    const navigate = useNavigate();

    const handleSelectHub = (hubId: string) => {
        selectHub(hubId);
        navigate('/dashboard');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Selecione seu Hub</h1>
                    <p className="text-lg text-gray-600">Escolha o ambiente de trabalho que deseja acessar</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {userHubs.map((hub) => (
                        <button
                            key={hub.id}
                            onClick={() => handleSelectHub(hub.id)}
                            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-left border border-gray-200 hover:border-blue-500 flex flex-col h-full"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    {hub.logo_url ? (
                                        <img src={hub.logo_url} alt={hub.name} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-blue-600" />
                                    )}
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                            </div>

                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{hub.name}</h3>
                            <p className="text-sm text-gray-500 mt-auto">
                                Acessar ambiente
                            </p>
                        </button>
                    ))}

                    {/* Card para Criar Novo Hub (Visível apenas para admins ou se permitido) */}
                    <button
                        onClick={() => {/* Implementar criação de Hub */ }}
                        className="group relative bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]"
                    >
                        <div className="p-3 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Criar Novo Hub</h3>
                        <p className="text-sm text-gray-500 mt-2">Configure um novo ambiente para sua organização</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
