-- Script para criar o bucket de storage para documentos dos agentes
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar bucket para documentos dos agentes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents',
  'agent-documents',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Criar política RLS para o bucket
CREATE POLICY "Users can upload their own agent documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'agent-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own agent documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'agent-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own agent documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'agent-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own agent documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'agent-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
