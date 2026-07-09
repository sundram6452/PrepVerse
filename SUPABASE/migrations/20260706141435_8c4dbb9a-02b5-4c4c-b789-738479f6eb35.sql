
CREATE POLICY "oa images auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'oa-images');
CREATE POLICY "oa images auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'oa-images' AND owner = auth.uid());
CREATE POLICY "oa images auth delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'oa-images' AND owner = auth.uid());
