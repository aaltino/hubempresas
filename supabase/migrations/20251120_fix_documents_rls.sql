-- Fix RLS for company_documents and storage
-- BUG-SEC-01

-- 1. Ensure company_documents table exists (if not already)
CREATE TABLE IF NOT EXISTS company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    deliverable_key TEXT NOT NULL,
    deliverable_label TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'docx', 'url'
    file_url TEXT,
    external_url TEXT,
    file_size INTEGER,
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'approved', 'rejected')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    notes TEXT
);

-- 2. Enable RLS
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

-- 3. Policies for company_documents

-- Admin/Gestor/Mentor can view all documents
CREATE POLICY "Staff can view all documents" ON company_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'mentor', 'viewer_executivo'))
  );

-- Startups can view their own documents
CREATE POLICY "Startups can view own documents" ON company_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN companies c ON c.profile_id = p.id
      WHERE p.id = auth.uid() AND c.id = company_documents.company_id
    )
  );

-- Startups can insert their own documents
CREATE POLICY "Startups can upload documents" ON company_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN companies c ON c.profile_id = p.id
      WHERE p.id = auth.uid() AND c.id = company_documents.company_id
    )
  );

-- Admin/Gestor/Mentor can update (approve/reject)
CREATE POLICY "Staff can update documents" ON company_documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'mentor'))
  );

-- Startups can delete their own documents (if not approved)
CREATE POLICY "Startups can delete own documents" ON company_documents
  FOR DELETE USING (
    status = 'uploaded' AND
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN companies c ON c.profile_id = p.id
      WHERE p.id = auth.uid() AND c.id = company_documents.company_id
    )
  );

-- 4. Storage Policies for 'company-documents' bucket

-- Ensure bucket exists (this usually needs to be done in dashboard or via API, but SQL can do it if extension enabled)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-documents', 'company-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Give startups access to their own folder
-- Path format: documents/{companyId}/{deliverableKey}/{filename}

CREATE POLICY "Startups can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-documents' AND
    (storage.foldername(name))[2] IN (
      SELECT c.id::text FROM companies c
      INNER JOIN profiles p ON c.profile_id = p.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Startups can select own folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'company-documents' AND
    (storage.foldername(name))[2] IN (
      SELECT c.id::text FROM companies c
      INNER JOIN profiles p ON c.profile_id = p.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all documents in bucket" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'company-documents' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'mentor', 'viewer_executivo'))
  );

CREATE POLICY "Startups can delete own documents in bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-documents' AND
    (storage.foldername(name))[2] IN (
      SELECT c.id::text FROM companies c
      INNER JOIN profiles p ON c.profile_id = p.id
      WHERE p.id = auth.uid()
    )
  );
