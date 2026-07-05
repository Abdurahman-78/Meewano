
CREATE POLICY "Users upload own refund evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'refund-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own refund evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'refund-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
