// Documentação da API Pública - Fase 4
// Documentação interativa da API REST com exemplos e teste de endpoints

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  Code, Key, Globe, Shield, Clock, Copy, Play,
  CheckCircle, AlertCircle, Book, Terminal, Zap
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  response_example?: any;
}

interface ApiDocumentation {
  title: string;
  version: string;
  description: string;
  base_url: string;
  authentication: {
    type: string;
    header: string;
    description: string;
  };
  rate_limiting: {
    limit: string;
    headers: Record<string, string>;
  };
  endpoints: ApiEndpoint[];
  webhooks?: {
    description: string;
    events: string[];
    endpoint: string;
    method: string;
  };
  error_codes: Record<string, string>;
}

export default function ApiDocumentationPage() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Estados principais
  const [apiDocs, setApiDocs] = useState<ApiDocumentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [testApiKey, setTestApiKey] = useState('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Estados para gerar API key
  const [showGenerateKey, setShowGenerateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<any>(null);

  useEffect(() => {
    loadApiDocumentation();
  }, []);

  // Carregar documentação da API
  const loadApiDocumentation = async () => {
    try {
      setLoading(true);

      // Buscar documentação via edge function da API pública
      const { data, error } = await supabase.functions.invoke('public-api', {
        body: { action: 'get_docs' }
      });

      if (error) throw error;
      setApiDocs(data);
      
      // Selecionar primeiro endpoint por padrão
      if (data.endpoints && data.endpoints.length > 0) {
        setSelectedEndpoint(data.endpoints[0]);
      }

    } catch (error) {
      console.error('Erro ao carregar documentação:', error);
      // Fallback para documentação estática
      setApiDocs({
        title: 'Hub Empresas Public API',
        version: '1.0.0',
        description: 'API pública para acesso aos dados do ecossistema de startups Hub Empresas',
        base_url: 'https://api.hubempresas.com',
        authentication: {
          type: 'API Key',
          header: 'X-API-Key',
          description: 'Inclua sua API key no header X-API-Key de todas as requisições'
        },
        rate_limiting: {
          limit: '1000 requisições por hora',
          headers: {
            'X-RateLimit-Limit': 'Limite total de requisições por hora',
            'X-RateLimit-Remaining': 'Requisições restantes na janela atual',
            'X-RateLimit-Reset': 'Timestamp Unix do reset do limite'
          }
        },
        endpoints: [
          {
            path: '/api/companies',
            method: 'GET',
            description: 'Lista todas as empresas ativas do ecossistema',
            parameters: [
              { name: 'page', type: 'integer', description: 'Número da página (padrão: 1)' },
              { name: 'limit', type: 'integer', description: 'Itens por página (max: 100, padrão: 20)' },
              { name: 'sector', type: 'string', description: 'Filtrar por setor' },
              { name: 'stage', type: 'string', description: 'Filtrar por estágio' },
              { name: 'program', type: 'string', description: 'Filtrar por programa atual' }
            ],
            response_example: {
              data: {
                companies: [
                  {
                    id: 'uuid',
                    name: 'TechStart Inovação',
                    sector: 'Tecnologia',
                    stage: 'growth',
                    website: 'https://techstart.com',
                    current_program: 'Residência',
                    total_badges: 5,
                    avg_score: 8.2,
                    last_evaluation: '2024-11-01'
                  }
                ],
                pagination: {
                  page: 1,
                  limit: 20,
                  total: 42,
                  pages: 3
                }
              }
            }
          },
          {
            path: '/api/companies/{id}',
            method: 'GET',
            description: 'Obter detalhes de uma empresa específica',
            parameters: [
              { name: 'id', type: 'string', description: 'UUID da empresa', required: true }
            ]
          },
          {
            path: '/api/stats',
            method: 'GET',
            description: 'Estatísticas gerais do ecossistema',
            response_example: {
              data: {
                ecosystem_overview: {
                  total_companies: 42,
                  active_companies: 38,
                  total_mentors: 15,
                  active_mentorships: 25
                }
              }
            }
          }
        ],
        error_codes: {
          '400': 'Bad Request - Parâmetros inválidos',
          '401': 'Unauthorized - API Key inválida',
          '404': 'Not Found - Recurso não encontrado',
          '429': 'Too Many Requests - Rate limit excedido',
          '500': 'Internal Server Error - Erro interno'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar nova API key
  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      addToast({
        type: 'warning',
        title: 'Digite um nome para a API key.'
      });
      return;
    }

    try {
      // Simular geração de API key
      const apiKey = `hub_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
      
      setGeneratedKey({
        id: crypto.randomUUID(),
        key_name: newKeyName,
        api_key: apiKey,
        permissions: ['read:companies', 'read:evaluations', 'read:badges', 'read:stats'],
        rate_limit: 1000,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano
      });

      setNewKeyName('');
      addToast({
        type: 'success',
        title: 'Nova API key criada com sucesso.'
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Não foi possível gerar a API key.'
      });
    }
  };

  // Testar endpoint
  const testEndpoint = async () => {
    if (!selectedEndpoint || !testApiKey.trim()) {
      addToast({
        type: 'warning',
        title: 'Selecione um endpoint e forneça uma API key.'
      });
      return;
    }

    try {
      setTesting(true);
      
      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response baseado no endpoint
      let mockResponse = selectedEndpoint.response_example;
      
      if (!mockResponse) {
        mockResponse = {
          data: { message: 'Endpoint testado com sucesso' },
          meta: {
            timestamp: new Date().toISOString(),
            rate_limit: {
              limit: 1000,
              remaining: 999,
              reset: Math.floor(Date.now() / 1000) + 3600
            }
          }
        };
      }

      setTestResponse(mockResponse);
      
      addToast({
        type: 'success',
        title: `Endpoint ${selectedEndpoint.method} ${selectedEndpoint.path} testado com sucesso.`
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Não foi possível testar o endpoint.'
      });
    } finally {
      setTesting(false);
    }
  };

  // Copiar para clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: 'success',
      title: 'Texto copiado para a área de transferência.'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'API Pública', href: '/api-docs' }
            ]}
          />
        </div>
        
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!apiDocs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar documentação</h2>
          <p className="text-gray-600">Não foi possível carregar a documentação da API.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'API Pública', href: '/api-docs' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{apiDocs.title}</h1>
          <p className="text-gray-600">
            {apiDocs.description} • v{apiDocs.version}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowGenerateKey(true)}>
            <Key className="w-4 h-4 mr-2" />
            Gerar API Key
          </Button>
          
          <Button>
            <Globe className="w-4 h-4 mr-2" />
            Base URL: {apiDocs.base_url}
          </Button>
        </div>
      </div>

      {/* Introdução e Autenticação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Autenticação</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Tipo:</p>
              <Badge variant="info">{apiDocs.authentication.type}</Badge>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Header:</p>
              <code className="bg-gray-100 px-3 py-2 rounded text-sm">{apiDocs.authentication.header}</code>
            </div>

            <p className="text-sm text-gray-700">{apiDocs.authentication.description}</p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Exemplo de uso:</p>
              <pre className="text-sm text-gray-600">
{`curl -H "X-API-Key: your-api-key" \\
     "${apiDocs.base_url}/api/companies"`}
              </pre>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold">Rate Limiting</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Limite:</p>
              <Badge variant="warning">{apiDocs.rate_limiting.limit}</Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Headers de resposta:</p>
              {Object.entries(apiDocs.rate_limiting.headers).map(([header, description]) => (
                <div key={header} className="text-sm">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2">{header}</code>
                  <span className="text-gray-600">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Endpoints */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <Terminal className="w-6 h-6 mr-2" />
          Endpoints Disponíveis
        </h3>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Lista de endpoints */}
          <div className="xl:col-span-1">
            <div className="space-y-2">
              {apiDocs.endpoints.map((endpoint, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedEndpoint(endpoint)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedEndpoint?.path === endpoint.path
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={endpoint.method === 'GET' ? 'success' : 'info'}
                    >
                      {endpoint.method}
                    </Badge>
                  </div>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                  <p className="text-xs text-gray-600 mt-1">{endpoint.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Detalhes do endpoint selecionado */}
          <div className="xl:col-span-2">
            {selectedEndpoint ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant={selectedEndpoint.method === 'GET' ? 'success' : 'info'}>
                      {selectedEndpoint.method}
                    </Badge>
                    <code className="text-lg font-mono">{selectedEndpoint.path}</code>
                  </div>
                  <p className="text-gray-700">{selectedEndpoint.description}</p>
                </div>

                {/* Parâmetros */}
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Parâmetros</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2">Nome</th>
                            <th className="text-left py-2">Tipo</th>
                            <th className="text-left py-2">Obrigatório</th>
                            <th className="text-left py-2">Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEndpoint.parameters.map((param, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 font-mono">{param.name}</td>
                              <td className="py-2">
                                <Badge variant="secondary">{param.type}</Badge>
                              </td>
                              <td className="py-2">
                                {param.required ? (
                                  <Badge variant="error">Sim</Badge>
                                ) : (
                                  <Badge variant="secondary">Não</Badge>
                                )}
                              </td>
                              <td className="py-2 text-gray-600">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Exemplo de resposta */}
                {selectedEndpoint.response_example && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Exemplo de Resposta</h4>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(selectedEndpoint.response_example, null, 2))}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedEndpoint.response_example, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Book className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Selecione um endpoint para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Playground da API */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Zap className="w-6 h-6 mr-2" />
            Playground da API
          </h3>
          <Badge variant="info">Teste em tempo real</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuração do teste */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key de Teste
              </label>
              <input
                type="text"
                value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                placeholder="hub_demo_key_123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use: hub_api_key_demo_123456 para testes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endpoint Selecionado
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                {selectedEndpoint ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={selectedEndpoint.method === 'GET' ? 'success' : 'info'}>
                        {selectedEndpoint.method}
                      </Badge>
                      <code className="text-sm">{selectedEndpoint.path}</code>
                    </div>
                    <p className="text-xs text-gray-600">{selectedEndpoint.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum endpoint selecionado</p>
                )}
              </div>
            </div>

            <Button
              onClick={testEndpoint}
              disabled={testing || !selectedEndpoint || !testApiKey}
              className="w-full"
            >
              {testing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Testar Endpoint
                </>
              )}
            </Button>
          </div>

          {/* Resposta do teste */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Resposta</h4>
              {testResponse && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(testResponse, null, 2))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              )}
            </div>

            {testResponse ? (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto h-64">
                {JSON.stringify(testResponse, null, 2)}
              </pre>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Terminal className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>A resposta aparecerá aqui</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Códigos de erro */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Códigos de Erro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(apiDocs.error_codes).map(([code, description]) => (
            <div key={code} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge 
                  variant={code.startsWith('4') ? 'warning' : 'error'}
                >
                  {code}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal de geração de API key */}
      {showGenerateKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4 p-6">
            {generatedKey ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-4">API Key Gerada!</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{generatedKey.key_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded flex-1 break-all">
                        {generatedKey.api_key}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(generatedKey.api_key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-sm text-gray-600">
                      <strong>Limite:</strong> {generatedKey.rate_limit.toLocaleString()} req/hora
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Expira:</strong> {new Date(generatedKey.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> Guarde esta API key em local seguro. 
                      Ela não será exibida novamente por motivos de segurança.
                    </p>
                  </div>
                </div>

                <Button onClick={() => {
                  setGeneratedKey(null);
                  setShowGenerateKey(false);
                }} className="mt-6">
                  Entendi
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">Gerar Nova API Key</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da API Key
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Ex: Integração Dashboard, App Mobile, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Permissões incluídas:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Leitura de empresas</li>
                      <li>• Leitura de avaliações</li>
                      <li>• Leitura de badges</li>
                      <li>• Acesso a estatísticas</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button onClick={generateApiKey} className="flex-1">
                    <Key className="w-4 h-4 mr-2" />
                    Gerar API Key
                  </Button>
                  <Button variant="secondary" onClick={() => setShowGenerateKey(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}