-- Add missing columns to profiles table to support frontend requirements
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS font_style text,
ADD COLUMN IF NOT EXISTS name_color text,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Ensure thread_reactions table exists (missing from current schema list)
CREATE TABLE IF NOT EXISTS public.thread_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id uuid REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(thread_id, user_id, emoji)
);

-- Ensure offsets table exists (referenced in profile page)
CREATE TABLE IF NOT EXISTS public.offsets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    game text NOT NULL,
    code_snippet text,
    description text,
    author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.thread_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offsets ENABLE ROW LEVEL SECURITY;

-- Add policies for thread_reactions
CREATE POLICY "Reactions are viewable by everyone" 
ON public.thread_reactions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can react" 
ON public.thread_reactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" 
ON public.thread_reactions FOR DELETE 
USING (auth.uid() = user_id);

-- Add policies for offsets
CREATE POLICY "Offsets are viewable by everyone" 
ON public.offsets FOR SELECT 
USING (true);

CREATE POLICY "Users can create offsets" 
ON public.offsets FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own offsets" 
ON public.offsets FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own offsets" 
ON public.offsets FOR DELETE 
USING (auth.uid() = author_id);
