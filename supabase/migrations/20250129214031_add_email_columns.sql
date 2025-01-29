-- Add email column to scores table
alter table public.scores
add column email text,
add column email_opted_out boolean default false;

-- Add comment for the new fields
comment on column public.scores.email is 'Optional email for competition entry';
comment on column public.scores.email_opted_out is 'Whether user has explicitly opted out of email collection';

-- Enable RLS if not already enabled
alter table public.scores enable row level security;

-- Create policy to allow email updates
create policy "Allow email updates"
on public.scores
for update
using (true)  -- Anyone can see the row
with check (true);  -- Anyone can update the row
