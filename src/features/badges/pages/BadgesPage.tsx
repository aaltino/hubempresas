import { useState, useEffect } from 'react';
import { BadgeDisplay } from '@/features/badges/components/BadgeDisplay';
import { BadgeService } from '@/features/badges/services/badgeService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function BadgesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyBadges, setCompanyBadges] = useState<any[]>([]);

  useEffect(() => {
    const loadBadges = async () => {
      if (!profile?.id) return;
      
      try {
        setLoading(true);
        const badges = await BadgeService.getCompanyBadges(profile.id);
        setCompanyBadges(badges);
      } catch (error) {
        console.error('Erro ao carregar badges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando badges...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Badges Conquistados</h1>
        <p className="text-gray-600 mt-2">
          Acompanhe seus marcos e conquistas na jornada de empreendedorismo
        </p>
      </div>

      <BadgeDisplay companyBadges={companyBadges} />
    </div>
  );
}