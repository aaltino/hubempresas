// Tipos específicos da feature mentors
export interface MentorData {
  id: string;
  full_name: string;
  email: string;
  role: 'mentor';
  created_at: string;
}

export interface MentorPartnershipData {
  id: string;
  mentor_id: string;
  company_id: string;
  partnership_start_date: string;
  partnership_type: string;
  status: 'ativo' | 'inativo';
}

// Especializações de mentores
export interface MentorSpecialization {
  id: string;
  mentor_id: string;
  area_expertise: string;
  years_experience: number;
}