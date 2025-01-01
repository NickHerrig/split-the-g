-- Create leaderboard table
create table public.leaderboard (
    id bigint primary key generated always as identity,
    user_name text not null,
    score numeric(4,2) not null check (score >= 0 and score <= 5),
    image_url text,
    created_at timestamp with time zone default now(),
    shareable_link text generated always as ('/score/' || id::text) stored
);

-- Set up Row Level Security (RLS)
alter table public.leaderboard enable row level security;

-- Create policies for anonymous access
create policy "Allow anonymous read access"
on public.leaderboard
for select
to anon
using (true);

create policy "Allow anonymous inserts"
on public.leaderboard
for insert
to anon
with check (true);

-- Create indexes for better query performance
create index leaderboard_score_idx on public.leaderboard (score desc);
create index leaderboard_created_at_idx on public.leaderboard (created_at desc);

-- Add helpful comments to the table and columns
comment on table public.leaderboard is 'Stores Split the G scores and user information';
comment on column public.leaderboard.user_name is 'User-provided or auto-generated username';
comment on column public.leaderboard.score is 'Split the G score (0-5)';
comment on column public.leaderboard.image_url is 'URL to the stored image of the pour';
comment on column public.leaderboard.shareable_link is 'Generated shareable URL for the score';
