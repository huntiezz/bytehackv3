-- Create the offsets table
CREATE TABLE IF NOT EXISTS offsets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core fields
  game_name TEXT NOT NULL,
  version TEXT NOT NULL,
  
  -- Data fields (using JSONB for flexibility with complex offset structures)
  offset_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  structures JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  notes TEXT,
  description TEXT,
  
  -- Media / External Links
  image_url TEXT,
  sdk_dump_url TEXT,
  mem_dump_url TEXT,
  dump_images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
  
  -- Author relation
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0
);

-- Enable Row Level Security (RLS)
ALTER TABLE offsets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Offsets are viewable by everyone" ON offsets;
DROP POLICY IF EXISTS "Authenticated users can create offsets" ON offsets;
DROP POLICY IF EXISTS "Users can update their own offsets" ON offsets;
DROP POLICY IF EXISTS "Users can delete their own offsets" ON offsets;

-- Policies (Adjust specific field access as needed)
-- 1. Everyone can view offsets
CREATE POLICY "Offsets are viewable by everyone" 
ON offsets FOR SELECT 
USING (true);

-- 2. Only authenticated users with role 'offset_updater' or 'admin' can insert
-- Note: You'll need a way to check roles. For simple auth check:
CREATE POLICY "Authenticated users can create offsets" 
ON offsets FOR INSERT 
WITH CHECK (auth.uid() = author_id); 
-- In a real app, you'd add a role check trigger or RLS function here.

-- 3. Authors (or admins) can update their own offsets
CREATE POLICY "Users can update their own offsets" 
ON offsets FOR UPDATE 
USING (auth.uid() = author_id);

-- 4. Authors (or admins) can delete their own offsets
CREATE POLICY "Users can delete their own offsets" 
ON offsets FOR DELETE 
USING (auth.uid() = author_id);
