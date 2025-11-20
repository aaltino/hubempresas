import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Building2, Users, BarChart3, FileText, LogOut, Menu, Settings, UserCheck, ClipboardCheck, Award, Zap, Calendar, Network, MessageSquare, TrendingUp, PieChart, Search, Download, Code } from 'lucide-react';
import { useState } from 'react';
import { NotificationCenter } from '@/features/notifications';
import { TutorialSystem } from '@/features/tutorials';

export default function DashboardLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, roles: ['admin', 'mentor', 'startup_owner', 'startup_member', 'viewer_executivo'] },

    // FASE 4: Analytics & Expansão
    { name: 'Dashboard Executivo', href: '/executive', icon: PieChart, roles: ['admin', 'viewer_executivo'] },
    { name: 'Busca Avançada', href: '/search', icon: Search, roles: ['admin', 'mentor', 'startup_owner', 'startup_member', 'viewer_executivo'] },
    { name: 'Exportação', href: '/export', icon: Download, roles: ['admin', 'mentor', 'startup_owner', 'startup_member', 'viewer_executivo'] },
    { name: 'API Docs', href: '/api-docs', icon: Code, roles: ['admin', 'mentor', 'startup_owner'] },

    { name: 'Dashboard Mentor', href: '/mentor/dashboard', icon: Users, roles: ['mentor'] },
    { name: 'Minhas Parcerias', href: '/mentor/partnerships', icon: UserCheck, roles: ['mentor'] },
    // FASE 3: Sistema Mentor-Startup
    { name: 'Dashboard Otimizado', href: '/mentor/dashboard-otimizado', icon: Zap, roles: ['mentor'] },
    { name: 'Matching Automático', href: '/mentor/matching', icon: Network, roles: ['mentor'] },
    { name: 'Agenda Mentorias', href: '/mentor/agenda', icon: Calendar, roles: ['mentor'] },
    { name: 'Parcerias Ativas', href: '/mentor/parcerias', icon: TrendingUp, roles: ['mentor'] },
    { name: 'Feedback Avançado', href: '/mentor/feedback', icon: MessageSquare, roles: ['mentor'] },
    { name: 'Documentos', href: '/documentos', icon: FileText, roles: ['startup_owner', 'startup_member'] },
    { name: 'Empresas', href: '/empresas', icon: Building2, roles: ['admin', 'mentor'] },
    { name: 'Avaliações', href: '/avaliacoes', icon: FileText, roles: ['admin', 'mentor'] },
    { name: 'Questionários', href: '/questionarios', icon: ClipboardCheck, roles: ['admin', 'mentor', 'startup_owner', 'startup_member', 'viewer_executivo'] },
    { name: 'Estatísticas de Questionários', href: '/questionarios/estatisticas', icon: BarChart3, roles: ['admin', 'mentor'] },
    { name: 'Badges', href: '/badges', icon: Award, roles: ['admin', 'mentor', 'startup_owner', 'startup_member', 'viewer_executivo'] },
    { name: 'Mentores', href: '/mentores', icon: Users, roles: ['admin'] },
    { name: 'Configuração', href: '/configuracao', icon: Settings, roles: ['admin', 'mentor'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(profile.role));

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">HUB Empresas</h1>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right mr-4">
                <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
              </div>
              <NotificationCenter />
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                title="Sair da plataforma"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className={`md:w-64 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            <nav className="space-y-1 bg-white rounded-lg shadow-sm p-4">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-gray-100"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Sistema de Tutoriais */}
      <TutorialSystem />
    </div>
  );
}
