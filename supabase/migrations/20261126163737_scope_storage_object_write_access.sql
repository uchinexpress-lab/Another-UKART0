/*
  # Scope storage write access to the uploader

  1. Problem
    - The policy "Authenticated upload files" on storage.objects was FOR ALL
      TO authenticated with USING (true) and WITH CHECK (true). Any signed-in
      user could therefore overwrite or delete ANY file in ANY bucket,
      including product images, page media and other customers' review photos.

  2. Security changes
    - Drop the blanket policy.
    - INSERT: signed-in users may upload only into the 'uploads' and
      'app-media' buckets.
    - SELECT: both buckets stay publicly readable (they are public buckets
      serving product images and approved review photos).
    - UPDATE / DELETE: only the user who uploaded the object (owner) or an
      admin may modify or remove it.

  3. Notes
    - The existing app_media_insert / app_media_read / "Public read uploads"
      policies are left in place; they are already bucket-scoped.
*/

DROP POLICY IF EXISTS "Authenticated upload files" ON storage.objects;

DROP POLICY IF EXISTS "uploads_insert_scoped" ON storage.objects;
CREATE POLICY "uploads_insert_scoped"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('uploads', 'app-media'));

DROP POLICY IF EXISTS "uploads_read_public" ON storage.objects;
CREATE POLICY "uploads_read_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('uploads', 'app-media'));

DROP POLICY IF EXISTS "uploads_update_owner_or_admin" ON storage.objects;
CREATE POLICY "uploads_update_owner_or_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('uploads', 'app-media') AND (owner = auth.uid() OR public.is_admin()))
WITH CHECK (bucket_id IN ('uploads', 'app-media') AND (owner = auth.uid() OR public.is_admin()));

DROP POLICY IF EXISTS "uploads_delete_owner_or_admin" ON storage.objects;
CREATE POLICY "uploads_delete_owner_or_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('uploads', 'app-media') AND (owner = auth.uid() OR public.is_admin()));
