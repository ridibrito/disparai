-- Policies for bucket 'avatars' (sem IF NOT EXISTS)
-- Recria políticas de forma idempotente com DROP + CREATE

-- Leitura pública (opcional)
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars public read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Insert apenas para autenticados e chave iniciando por userId/
DROP POLICY IF EXISTS "Avatars authenticated insert" ON storage.objects;
CREATE POLICY "Avatars authenticated insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND (name LIKE (auth.uid()::text || '/%'))
  );

-- Update/Delete apenas do dono (nome iniciando com userId/)
DROP POLICY IF EXISTS "Avatars owner update" ON storage.objects;
CREATE POLICY "Avatars owner update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND (name LIKE (auth.uid()::text || '/%'))
  )
  WITH CHECK (
    bucket_id = 'avatars' AND (name LIKE (auth.uid()::text || '/%'))
  );

DROP POLICY IF EXISTS "Avatars owner delete" ON storage.objects;
CREATE POLICY "Avatars owner delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND (name LIKE (auth.uid()::text || '/%'))
  );


