-- Add GitHub and Discord columns to profiles if they don't exist
do $$
begin
    -- GitHub
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'github_id') then
        alter table profiles add column github_id text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'github_username') then
        alter table profiles add column github_username text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'github_avatar_url') then
        alter table profiles add column github_avatar_url text;
    end if;

    -- Discord (ensure these exist as well just in case)
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'discord_id') then
        alter table profiles add column discord_id text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'discord_username') then
        alter table profiles add column discord_username text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'discord_avatar') then
        alter table profiles add column discord_avatar text;
    end if;
end $$;
