-- =============================================================================
-- BANGER RATIOS — FULL RLS FIX & SAFE RECREATION SCRIPT
-- Run this in Supabase SQL Editor (replaces problematic parts)
-- Drops/recreates policies safely + fixes upsert RLS
-- Does NOT drop your tables/data
-- =============================================================================

-- 1. Clean up storage policies (avatars bucket) to avoid duplicates
DROP POLICY IF EXISTS "avatars_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;

-- Recreate avatars policies
CREATE POLICY "avatars_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 2. Clean up old/incorrect policies on albums & tracks
DROP POLICY IF EXISTS "albums_read"        ON public.albums;
DROP POLICY IF EXISTS "albums_insert"      ON public.albums;
DROP POLICY IF EXISTS "albums_update"      ON public.albums;
DROP POLICY IF EXISTS "albums_insert_auth" ON public.albums;
DROP POLICY IF EXISTS "albums_update_auth" ON public.albums;

DROP POLICY IF EXISTS "tracks_read"        ON public.tracks;
DROP POLICY IF EXISTS "tracks_insert"      ON public.tracks;
DROP POLICY IF EXISTS "tracks_update"      ON public.tracks;
DROP POLICY IF EXISTS "tracks_insert_auth" ON public.tracks;
DROP POLICY IF EXISTS "tracks_update_auth" ON public.tracks;

-- 3. Clean up other policies (safe drops)
DROP POLICY IF EXISTS "profiles_read"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

DROP POLICY IF EXISTS "ratings_read"    ON public.ratings;
DROP POLICY IF EXISTS "ratings_insert"  ON public.ratings;
DROP POLICY IF EXISTS "ratings_update"  ON public.ratings;
DROP POLICY IF EXISTS "ratings_delete"  ON public.ratings;

DROP POLICY IF EXISTS "follows_read"    ON public.follows;
DROP POLICY IF EXISTS "follows_insert"  ON public.follows;
DROP POLICY IF EXISTS "follows_delete"  ON public.follows;

-- 4. Recreate ALL policies correctly (no IF NOT EXISTS)

-- Read access for everyone
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "albums_read"   ON public.albums   FOR SELECT USING (true);
CREATE POLICY "tracks_read"   ON public.tracks   FOR SELECT USING (true);
CREATE POLICY "ratings_read"  ON public.ratings  FOR SELECT USING (true);
CREATE POLICY "follows_read"  ON public.follows  FOR SELECT USING (true);

-- Profiles: owner only
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Albums: authenticated users can upsert (insert + update)
CREATE POLICY "albums_insert_auth" ON public.albums
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "albums_update_auth" ON public.albums
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Tracks: same as albums
CREATE POLICY "tracks_insert_auth" ON public.tracks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tracks_update_auth" ON public.tracks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ratings: owner only
CREATE POLICY "ratings_insert" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ratings_update" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ratings_delete" ON public.ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Follows: owner only
CREATE POLICY "follows_insert" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- =============================================================================
-- Optional: Recreate function & trigger if needed (safe to run)
DROP FUNCTION IF EXISTS public.recalculate_banger_ratio(bigint) CASCADE;

CREATE OR REPLACE FUNCTION public.recalculate_banger_ratio(p_album_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  track_rec record;
  total_score numeric;
  rating_count int;
  banger_count int := 0;
  album_ratings int := 0;
BEGIN
  FOR track_rec IN SELECT id FROM public.tracks WHERE album_id = p_album_id LOOP
    SELECT count(*), coalesce(avg(score), 0)
    INTO rating_count, total_score
    FROM public.ratings WHERE track_id = track_rec.id;

    UPDATE public.tracks SET
      total_ratings = rating_count,
      avg_rating = round(total_score::numeric, 1),
      is_banger = (rating_count > 0 AND total_score >= 5.0)
    WHERE id = track_rec.id;

    IF rating_count > 0 AND total_score >= 5.0 THEN
      banger_count := banger_count + 1;
    END IF;
    album_ratings := album_ratings + rating_count;
  END LOOP;

  UPDATE public.albums SET
    total_ratings = album_ratings,
    banger_ratio = CASE
      WHEN (SELECT count(*) FROM public.tracks WHERE album_id = p_album_id) = 0 THEN 0
      ELSE round(banger_count::numeric / (SELECT count(*) FROM public.tracks WHERE album_id = p_album_id) * 100, 1)
    END
  WHERE id = p_album_id;
END;
$$;

-- Trigger for new users
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- Script complete.
-- After running:
--   - Refresh Supabase dashboard (Policies tab for each table)
--   - Log in to app (important for authenticated upsert)
--   - Test album page again
-- =============================================================================