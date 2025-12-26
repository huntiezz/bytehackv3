-- Create table for Code Off Matches
create table if not exists code_matches (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  player1_id uuid references profiles(id),
  player2_id uuid references profiles(id),
  moderator_id uuid references profiles(id),
  topic text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'live', 'voting', 'finished', 'cancelled')),
  winner_id uuid references profiles(id),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  player1_votes int default 0,
  player2_votes int default 0
);

-- Enable RLS for code_matches
alter table code_matches enable row level security;

-- Policies for code_matches
create policy "Matches are viewable by everyone" on code_matches
  for select using (true);

create policy "Authenticated users can create matches" on code_matches
  for insert with check (auth.uid() = player1_id);

create policy "Players and Mods can update matches" on code_matches
  for update using (
    auth.uid() = player1_id or 
    auth.uid() = player2_id or 
    auth.uid() = moderator_id or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Create table for Betting
create table if not exists code_bets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  match_id uuid references code_matches(id) not null,
  user_id uuid references profiles(id) not null,
  amount int not null check (amount > 0),
  prediction text check (prediction in ('player1', 'player2')),
  status text default 'pending' check (status in ('pending', 'won', 'lost', 'refunded'))
);

-- Enable RLS for code_bets
alter table code_bets enable row level security;

create policy "Bets are viewable by everyone" on code_bets
  for select using (true);

create policy "Users can place bets" on code_bets
  for insert with check (auth.uid() = user_id);

-- Create table for Match Chat
create table if not exists code_chat (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  match_id uuid references code_matches(id) not null,
  user_id uuid references profiles(id) not null,
  message text not null
);

-- Enable RLS for code_chat
alter table code_chat enable row level security;

create policy "Chat is viewable by everyone" on code_chat
  for select using (true);

create policy "Authenticated users can chat" on code_chat
  for insert with check (auth.uid() = user_id);

-- Add real-time
alter publication supabase_realtime add table code_matches;
alter publication supabase_realtime add table code_bets;
alter publication supabase_realtime add table code_chat;
