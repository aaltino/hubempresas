// Sistema de Busca Avançada e Rankings - Fase 4  
// Busca inteligente, filtros múltiplos, rankings de startups e sistema de favoritos

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { 
  Search, Filter, Star, Heart, TrendingUp, Trophy, Medal,
  Users, Building2, Award, Target, ChevronDown, ChevronUp,
  Eye, BarChart3, Calendar, ArrowUpRight, Bookmark, Plus
} from 'lucide-react';
import { Card } from '@/design-system/ui/Card';
import { Button } from '@/design-system/ui/Button';
import { Badge } from '@/design-system/ui/Badge';
import { Breadcrumbs } from '@/design-system/navigation/Breadcrumbs';
import { useToast } from '@/design-system/feedback/Toast';

interface SearchResult {
  id: string;
  name: string;
  sector: string;
  stage: string;
  description: string;
  score: number;
  badges: string[];
  relevance: number;
  founded_date: string;
}

interface CompanyRanking {
  id: string;
  name: string;
  sector: string;
  stage: string;
  avg_score: number;
  total_badges: number;
  ranking_score: number;
  rank: number;
  platinum_badges: number;
  gold_badges: number;
  silver_badges: number;
  bronze_badges: number;
}

interface SearchFilters {
  sector?: string;
  stage?: string;
  score_min?: number;
  score_max?: number;
  badge_levels?: string[];
  mentor_assigned?: boolean;
}

interface AutocompleteResult {
  text: string;
  type: string;
  id?: string;
}

export default function AdvancedSearchPage() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Estados principais
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [rankings, setRankings] = useState<CompanyRanking[]>([]);
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 10]);

  // Estados de visualização
  const [activeTab, setActiveTab] = useState<'search' | 'rankings' | 'favorites'>('search');
  const [rankingType, setRankingType] = useState<'overall' | 'by_score' | 'by_badges' | 'sector_leaders'>('overall');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  // Opções de filtros
  const sectorOptions = ['Tecnologia', 'Fintech', 'E-commerce', 'Saúde', 'Educação', 'Agritech'];
  const stageOptions = ['idea', 'mvp', 'traction', 'growth', 'scale'];
  const badgeLevels = ['platinum', 'gold', 'silver', 'bronze'];

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounce para autocomplete
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        loadAutocomplete();
      } else {
        setAutocompleteResults([]);
        setShowAutocomplete(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Carregar dados iniciais
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRankings(),
        loadFavorites()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar autocomplete
  const loadAutocomplete = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('search-analytics', {
        body: {
          action: 'autocomplete_search',
          query: searchQuery,
          limit: 8
        }
      });

      if (error) throw error;
      setAutocompleteResults(data.suggestions || []);
      setShowAutocomplete(true);
    } catch (error) {
      console.error('Erro no autocomplete:', error);
    }
  };

  // Realizar busca inteligente
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      addToast({
        type: 'warning',
        title: 'Digite um termo para buscar.'
      });
      return;
    }

    try {
      setSearchLoading(true);
      setShowAutocomplete(false);

      const { data, error } = await supabase.functions.invoke('search-analytics', {
        body: {
          action: 'smart_search',
          query: searchQuery,
          filters: {
            sector: selectedSectors.length > 0 ? selectedSectors : undefined,
            stage: selectedStages.length > 0 ? selectedStages : undefined,
            score_min: scoreRange[0] > 0 ? scoreRange[0] : undefined,
            score_max: scoreRange[1] < 10 ? scoreRange[1] : undefined,
            badge_levels: filters.badge_levels
          },
          limit: 20,
          page: 1
        }
      });

      if (error) throw error;
      setSearchResults(data.results || []);
      setActiveTab('search');

      addToast({
        type: 'success',
        title: `Encontrados ${data.total || 0} resultados em ${data.query_time_ms || 0}ms.`
      });

    } catch (error) {
      console.error('Erro na busca:', error);
      addToast({
        type: 'error',
        title: 'Não foi possível realizar a busca.'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Carregar rankings
  const loadRankings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('search-analytics', {
        body: {
          action: 'generate_rankings',
          ranking_type: rankingType,
          period: 'all_time'
        }
      });

      if (error) throw error;
      setRankings(data.rankings || []);
    } catch (error) {
      console.error('Erro ao carregar rankings:', error);
    }
  };

  // Carregar favoritos e watchlist
  const loadFavorites = async () => {
    if (!profile?.id) return;

    try {
      const [favoritesResponse, watchlistResponse] = await Promise.all([
        supabase.functions.invoke('search-analytics', {
          body: {
            action: 'list_favorites',
            user_id: profile.id
          }
        }),
        supabase.functions.invoke('search-analytics', {
          body: {
            action: 'list_watchlist',
            user_id: profile.id
          }
        })
      ]);

      setFavorites(favoritesResponse.data?.favorites || []);
      setWatchlist(watchlistResponse.data?.favorites || []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  // Gerenciar favoritos
  const toggleFavorite = async (resourceId: string, resourceType: string = 'company', isFavorite: boolean) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase.functions.invoke('search-analytics', {
        body: {
          action: isFavorite ? 'remove' : 'add_favorite',
          user_id: profile.id,
          resource_type: resourceType,
          resource_id: resourceId
        }
      });

      if (error) throw error;

      await loadFavorites();
      addToast({
        type: 'success',
        title: `Item ${isFavorite ? 'removido' : 'adicionado'} com sucesso.`
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Não foi possível atualizar os favoritos.'
      });
    }
  };

  // Verificar se item está nos favoritos
  const isFavorited = (resourceId: string) => {
    return favorites.some(fav => fav.resource_id === resourceId);
  };

  // Aplicar filtro de setor
  const toggleSectorFilter = (sector: string) => {
    setSelectedSectors(prev => 
      prev.includes(sector) 
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  // Aplicar filtro de estágio
  const toggleStageFilter = (stage: string) => {
    setSelectedStages(prev => 
      prev.includes(stage) 
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  // Limpar filtros
  const clearFilters = () => {
    setSelectedSectors([]);
    setSelectedStages([]);
    setScoreRange([0, 10]);
    setFilters({});
  };

  // Selecionar sugestão de autocomplete
  const selectAutocompleteSuggestion = (suggestion: AutocompleteResult) => {
    setSearchQuery(suggestion.text);
    setShowAutocomplete(false);
    setTimeout(() => performSearch(), 100);
  };

  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Barra de busca */}
      <Card className="p-6">
        <div className="relative">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Busque por empresas, setores, mentores, badges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Autocomplete dropdown */}
              {showAutocomplete && autocompleteResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {autocompleteResults.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectAutocompleteSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{suggestion.text}</span>
                      <Badge variant="secondary">{suggestion.type}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={performSearch} disabled={searchLoading}>
              {searchLoading ? 'Buscando...' : 'Buscar'}
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="mt-6 p-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Filtro por setor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Setores</label>
                  <div className="flex flex-wrap gap-2">
                    {sectorOptions.map(sector => (
                      <button
                        key={sector}
                        onClick={() => toggleSectorFilter(sector)}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          selectedSectors.includes(sector)
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro por estágio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estágios</label>
                  <div className="flex flex-wrap gap-2">
                    {stageOptions.map(stage => (
                      <button
                        key={stage}
                        onClick={() => toggleStageFilter(stage)}
                        className={`px-3 py-1 rounded-full text-sm border capitalize ${
                          selectedStages.includes(stage)
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro por score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faixa de Score: {scoreRange[0]} - {scoreRange[1]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={scoreRange[1]}
                    onChange={(e) => setScoreRange([scoreRange[0], parseFloat(e.target.value)])}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
                <div className="text-sm text-gray-500">
                  {(selectedSectors.length + selectedStages.length) > 0 && (
                    <span>{selectedSectors.length + selectedStages.length} filtro(s) ativo(s)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Resultados da busca */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resultados da Busca</h3>
            <span className="text-sm text-gray-500">{searchResults.length} resultados</span>
          </div>

          {searchResults.map((result) => (
            <Card key={result.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{result.name}</h4>
                    <Badge variant="secondary">{result.sector}</Badge>
                    <Badge variant="info">{result.stage}</Badge>
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 mr-1" />
                      <span className="font-medium">{result.score.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{result.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Fundada em {new Date(result.founded_date).getFullYear()}</span>
                    <span>{result.badges.length} badges</span>
                    <span>Relevância: {Math.round(result.relevance)}%</span>
                  </div>

                  {result.badges.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.badges.slice(0, 3).map((badge, index) => (
                        <Badge key={index} variant="warning">
                          <Award className="w-3 h-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                      {result.badges.length > 3 && (
                        <span className="text-sm text-gray-500">+{result.badges.length - 3} badges</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleFavorite(result.id, 'company', isFavorited(result.id))}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorited(result.id) ? 'fill-current text-red-500' : ''}`} />
                    {isFavorited(result.id) ? 'Favoritado' : 'Favoritar'}
                  </Button>
                  
                  <Button size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderRankingsTab = () => (
    <div className="space-y-6">
      {/* Seletor de tipo de ranking */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Rankings do Ecossistema</h3>
          <div className="flex gap-2">
            <select
              value={rankingType}
              onChange={(e) => setRankingType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="overall">Ranking Geral</option>
              <option value="by_score">Por Score</option>
              <option value="by_badges">Por Badges</option>
              <option value="sector_leaders">Líderes por Setor</option>
            </select>
            
            <Button variant="secondary" size="sm" onClick={loadRankings}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de rankings */}
      {rankings.length > 0 && (
        <div className="space-y-3">
          {rankings.map((company) => (
            <Card key={company.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Posição no ranking */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg">
                    {company.rank <= 3 ? (
                      company.rank === 1 ? <Trophy className="w-6 h-6" /> :
                      company.rank === 2 ? <Medal className="w-6 h-6" /> :
                      <Award className="w-6 h-6" />
                    ) : (
                      company.rank
                    )}
                  </div>

                  {/* Informações da empresa */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{company.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="secondary">{company.sector}</Badge>
                      <Badge variant="info">{company.stage}</Badge>
                      <span className="text-sm text-gray-600">Score: {company.avg_score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Métricas */}
                <div className="flex items-center gap-6">
                  {/* Badges por nível */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{company.total_badges}</p>
                    <p className="text-sm text-gray-600">Badges Totais</p>
                    <div className="flex gap-1 mt-1">
                      {company.platinum_badges > 0 && <Badge variant="info">{company.platinum_badges}P</Badge>}
                      {company.gold_badges > 0 && <Badge variant="warning">{company.gold_badges}G</Badge>}
                      {company.silver_badges > 0 && <Badge variant="secondary">{company.silver_badges}S</Badge>}
                      {company.bronze_badges > 0 && <Badge variant="secondary">{company.bronze_badges}B</Badge>}
                    </div>
                  </div>

                  {/* Score de ranking */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{company.ranking_score.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">Score Final</p>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleFavorite(company.id, 'company', isFavorited(company.id))}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited(company.id) ? 'fill-current text-red-500' : ''}`} />
                    </Button>
                    
                    <Button size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderFavoritesTab = () => (
    <div className="space-y-6">
      {/* Favoritos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Favoritos</h3>
          <Badge variant="info">{favorites.length} itens</Badge>
        </div>

        {favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{favorite.resource_name}</h4>
                  <p className="text-sm text-gray-600">Adicionado em {new Date(favorite.added_date).toLocaleDateString('pt-BR')}</p>
                  {favorite.notes && (
                    <p className="text-sm text-gray-500 mt-1">{favorite.notes}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => toggleFavorite(favorite.resource_id, favorite.resource_type, true)}
                  >
                    <Heart className="w-4 h-4 fill-current text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum item favoritado ainda</p>
            <p className="text-sm">Use o coração para favoritar empresas e mentores</p>
          </div>
        )}
      </Card>

      {/* Watchlist */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Lista de Observação</h3>
          <Badge variant="warning">{watchlist.length} itens</Badge>
        </div>

        {watchlist.length > 0 ? (
          <div className="space-y-4">
            {watchlist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{item.resource_name}</h4>
                  <p className="text-sm text-gray-600">Em observação desde {new Date(item.added_date).toLocaleDateString('pt-BR')}</p>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Bookmark className="w-4 h-4 text-yellow-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum item em observação</p>
            <p className="text-sm">Adicione empresas à sua watchlist para acompanhar</p>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Busca Avançada', href: '/busca-avancada' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Busca Avançada & Rankings</h1>
          <p className="text-gray-600">
            Busca inteligente, rankings do ecossistema e sistema de favoritos
          </p>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Search className="w-5 h-5 inline mr-2" />
            Busca Inteligente
          </button>
          
          <button
            onClick={() => setActiveTab('rankings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rankings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Rankings
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'favorites'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Heart className="w-5 h-5 inline mr-2" />
            Favoritos ({favorites.length})
          </button>
        </nav>
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'search' && renderSearchTab()}
      {activeTab === 'rankings' && renderRankingsTab()}
      {activeTab === 'favorites' && renderFavoritesTab()}
    </div>
  );
}