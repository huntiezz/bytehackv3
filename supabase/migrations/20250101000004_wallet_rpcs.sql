-- Function to safely deduct coins
create or replace function deduct_coins(user_uuid uuid, amount int)
returns void
language plpgsql
security definer
as $$
declare
  current_coins int;
begin
  select coins into current_coins from profiles where id = user_uuid;
  
  if current_coins < amount then
    raise exception 'Insufficient funds';
  end if;

  update profiles 
  set coins = coins - amount 
  where id = user_uuid;
end;
$$;

-- Function to safely add coins
create or replace function add_coins(user_uuid uuid, amount int)
returns void
language plpgsql
security definer
as $$
begin
  update profiles 
  set coins = coalesce(coins, 0) + amount 
  where id = user_uuid;
end;
$$;
