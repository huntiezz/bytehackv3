-- Create follows table
create table if not exists follows (
  follower_id uuid references profiles(id) not null,
  following_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

-- Enable RLS
alter table follows enable row level security;

-- Policies
create policy "Follows are viewable by everyone" on follows
  for select using (true);

create policy "Users can follow others" on follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow" on follows
  for delete using (auth.uid() = follower_id);

-- Add counts to profiles if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'followers_count') then
        alter table profiles add column followers_count int default 0;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'following_count') then
        alter table profiles add column following_count int default 0;
    end if;
end $$;

-- Triggers to update counts
create or replace function update_follow_counts() returns trigger as $$
begin
    if (TG_OP = 'INSERT') then
        update profiles set following_count = following_count + 1 where id = NEW.follower_id;
        update profiles set followers_count = followers_count + 1 where id = NEW.following_id;
        return NEW;
    elsif (TG_OP = 'DELETE') then
        update profiles set following_count = GREATEST(following_count - 1, 0) where id = OLD.follower_id;
        update profiles set followers_count = GREATEST(followers_count - 1, 0) where id = OLD.following_id;
        return OLD;
    end if;
    return NULL;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists to avoid duplication errors on re-runs
drop trigger if exists on_follow_change on follows;

create trigger on_follow_change
after insert or delete on follows
for each row execute procedure update_follow_counts();
