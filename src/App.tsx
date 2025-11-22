import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './features/auth';
import { ToastProvider } from './design-system/feedback/Toast';
import { Suspense, lazy } from 'react';
import { Loader } from 'lucide-react';

// Lazy Imports
const DashboardLayout = lazy(() => import('./app/DashboardLayout'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginPage = lazy(() => import('./features/users/pages/LoginPage'));
const SetupPage = lazy(() => import('./features/users/pages/SetupPage'));
const ForgotPasswordPage = lazy(() => import('./features/users/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/users/pages/ResetPasswordPage'));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage'));

// Features Lazy Imports
const MentorsPage = lazy(() => import('./features/mentors').then(module => ({ default: module.MentorsPage })));
const MentorDashboardPage = lazy(() => import('./features/mentors').then(module => ({ default: module.MentorDashboardPage })));
const MentorPartnershipsPage = lazy(() => import('./features/mentors').then(module => ({ default: module.MentorPartnershipsPage })));

// FASE 3
const MentorDashboardOptimized = lazy(() => import('./features/mentors/pages/MentorDashboardOptimized'));
const MentorMatchingSystem = lazy(() => import('./features/mentors/pages/MentorMatchingSystem'));
const MentorshipAgenda = lazy(() => import('./features/mentors/pages/MentorshipAgenda'));
const PartnershipsDashboard = lazy(() => import('./features/mentors/pages/PartnershipsDashboard'));
const FeedbackSystemAdvanced = lazy(() => import('./features/mentors/pages/FeedbackSystemAdvanced'));

// Questionnaires
const QuestionnaireListPage = lazy(() => import('./features/questionnaires').then(module => ({ default: module.QuestionnaireListPage })));
const QuestionnairePage = lazy(() => import('./features/questionnaires').then(module => ({ default: module.QuestionnairePage })));
const QuestionnaireStatisticsPage = lazy(() => import('./features/questionnaires/pages/QuestionnaireStatisticsPage').then(module => ({ default: module.QuestionnaireStatisticsPage })));

// FASE 2
const EmpresasPageEnhanced = lazy(() => import('./features/companies/pages/EmpresasPageEnhanced'));
const CompanyDetailsPage = lazy(() => import('./features/companies').then(module => ({ default: module.CompanyDetailsPage })));
const CompanyEditPage = lazy(() => import('./features/companies/pages/CompanyEditPage'));
const AvaliacoesPageEnhanced = lazy(() => import('./features/evaluations/pages/AvaliacoesPageEnhanced'));
const BadgesPageEnhanced = lazy(() => import('./features/badges/pages/BadgesPageEnhanced'));

// FASE 4
const ExecutiveDashboard = lazy(() => import('./features/executive/pages/ExecutiveDashboard'));
const AdvancedSearchPage = lazy(() => import('./features/search/pages/AdvancedSearchPage'));
const ExportInsightsPage = lazy(() => import('./features/export/pages/ExportInsightsPage'));
const ApiDocumentationPage = lazy(() => import('./features/api/pages/ApiDocumentationPage'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

import { HubProvider, useHub } from './contexts/HubContext';

// Lazy Imports
const HubSelectionPage = lazy(() => import('./pages/HubSelectionPage'));
// ... existing lazy imports ...

function HubRouteGuard({ children }: { children: React.ReactNode }) {
  const { currentHub, isLoading } = useHub();

  if (isLoading) return <LoadingFallback />;

  if (!currentHub) {
    return <Navigate to="/select-hub" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename="/hubempresas">
      <AuthProvider>
        <HubProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Hub Selection */}
                <Route
                  path="/select-hub"
                  element={
                    <ProtectedRoute>
                      <HubSelectionPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Protected Hub Routes */}
                <Route path="/" element={
                  <HubRouteGuard>
                    <DashboardLayout />
                  </HubRouteGuard>
                }>
                  {/* Dashboard - Todos os usuários autenticados */}
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ... existing routes ... */}

                  {/* Dashboard do Mentor - Apenas mentores */}
                  <Route
                    path="mentor/dashboard"
                    element={
                      <ProtectedRoute requireAny={{ resource: "mentorship", actions: ["read", "log_notes"] }}>
                        <MentorDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Parcerias de Mentoria - Apenas mentores */}
                  <Route
                    path="mentor/partnerships"
                    element={
                      <ProtectedRoute requireAny={{ resource: "mentorship", actions: ["read", "log_notes"] }}>
                        <MentorPartnershipsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* FASE 3: Sistema Mentor-Startup */}

                  {/* Dashboard Mentor Otimizado */}
                  <Route
                    path="mentor/dashboard-otimizado"
                    element={
                      <ProtectedRoute requireAny={{ resource: "mentorship", actions: ["read", "log_notes"] }}>
                        <MentorDashboardOptimized />
                      </ProtectedRoute>
                    }
                  />

                  {/* Sistema de Matching Automático */}
                  <Route
                    path="mentor/matching"
                    element={
                      <ProtectedRoute requireAny={{ resource: "mentorship", actions: ["read", "log_notes"] }}>
                        <MentorMatchingSystem />
                      </ProtectedRoute>
                    }
                  />

                  {/* Agenda de Mentorias Integrada */}
                  <Route
                    path="mentor/agenda"
                    element={
                      <ProtectedRoute requireAny={{ resource: "mentorship", actions: ["read", "log_notes"] }}>
                        <MentorshipAgenda />
                      </ProtectedRoute>
                    }
                  />

                  {/* Dashboard de Parcerias Ativas */}
                  <Route
                    path="mentor/parcerias"
                    element={
                      <ProtectedRoute requireAny={{ resource: "mentorship", actions: ["read", "log_notes"] }}>
                        <PartnershipsDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Sistema de Feedback Avançado */}
                  <Route
                    path="mentor/feedback"
                    element={
                      <ProtectedRoute requireAny={{ resource: "mentorship", actions: ["read", "log_notes"] }}>
                        <FeedbackSystemAdvanced />
                      </ProtectedRoute>
                    }
                  />

                  {/* Empresas - FASE 2 Enhanced */}
                  <Route
                    path="empresas"
                    element={
                      <ProtectedRoute resource="startup" action="read">
                        <EmpresasPageEnhanced />
                      </ProtectedRoute>
                    }
                  />

                  {/* Detalhes da Empresa */}
                  <Route
                    path="empresas/:id"
                    element={
                      <ProtectedRoute resource="startup" action="read">
                        <CompanyDetailsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Editar Empresa */}
                  <Route
                    path="empresas/editar/:id"
                    element={
                      <ProtectedRoute resource="startup" action="update">
                        <CompanyEditPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Avaliações - FASE 2 Enhanced */}
                  <Route
                    path="avaliacoes"
                    element={
                      <ProtectedRoute resource="evaluation" action="read">
                        <AvaliacoesPageEnhanced />
                      </ProtectedRoute>
                    }
                  />

                  {/* Mentores - Admin ou Gestor */}
                  <Route
                    path="mentores"
                    element={
                      <ProtectedRoute requireAny={{ resource: "user", actions: ["create", "update"] }}>
                        <MentorsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Questionários - Todos os usuários autenticados */}
                  <Route
                    path="questionarios"
                    element={
                      <ProtectedRoute>
                        <QuestionnaireListPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Estatísticas de Questionários - Admin e Mentor */}
                  <Route
                    path="questionarios/estatisticas"
                    element={
                      <ProtectedRoute requireAny={{ resource: "questionnaire", actions: ["read_statistics"] }}>
                        <QuestionnaireStatisticsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Página de Questionário Individual - Todos os usuários autenticados */}
                  <Route
                    path="questionarios/:programKey"
                    element={
                      <ProtectedRoute>
                        <QuestionnairePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Badges - FASE 2 Enhanced */}
                  <Route
                    path="badges"
                    element={
                      <ProtectedRoute>
                        <BadgesPageEnhanced />
                      </ProtectedRoute>
                    }
                  />

                  {/* FASE 4: Analytics & Expansão */}

                  {/* Dashboard Executivo - Admin e Viewer Executivo */}
                  <Route
                    path="executive"
                    element={
                      <ProtectedRoute requireAny={{ resource: "user", actions: ["read", "create", "update"] }}>
                        <ExecutiveDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Busca Avançada - Todos os usuários autenticados */}
                  <Route
                    path="search"
                    element={
                      <ProtectedRoute>
                        <AdvancedSearchPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Sistema de Exportação - Todos os usuários autenticados para demonstração */}
                  <Route
                    path="export"
                    element={
                      <ProtectedRoute>
                        <ExportInsightsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Documentação da API - Todos os usuários autenticados para demonstração */}
                  <Route
                    path="api-docs"
                    element={
                      <ProtectedRoute>
                        <ApiDocumentationPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Configuração - Todos os usuários autenticados */}
                  <Route
                    path="configuracao"
                    element={
                      <ProtectedRoute>
                        <ConfigurationPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </HubProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
