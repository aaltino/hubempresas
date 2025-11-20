// Tipos específicos da feature companies
export interface CompanyData {
  id: string;
  name: string;
  description?: string;
  current_program_key: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

// Status possíveis para uma empresa
export type CompanyStatus = 'ativo' | 'inativo' | 'pausado' | 'formado';