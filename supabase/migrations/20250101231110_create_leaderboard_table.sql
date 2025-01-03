-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create scores table (renamed from leaderboard)
create table public.scores (
    id uuid primary key default uuid_generate_v4(),
    username text not null,
    split_score numeric(4,2) not null check (split_score >= 0 and split_score <= 5),
    created_at timestamp with time zone default timezone('UTC', now()),
    split_image_url text,
    pint_image_url text
);

-- Set up Row Level Security (RLS)
alter table public.scores enable row level security;

-- Create policies for anonymous access
create policy "Allow anonymous read access"
on public.scores
for select
to anon
using (true);

create policy "Allow anonymous inserts"
on public.scores
for insert
to anon
with check (true);

-- Create indexes for better query performance
create index scores_split_score_idx on public.scores (split_score desc);
create index scores_created_at_idx on public.scores (created_at desc);

-- Add helpful comments to the table and columns
comment on table public.scores is 'Stores Split the G scores and user information';
comment on column public.scores.username is 'User-provided or auto-generated username';
comment on column public.scores.split_score is 'Split the G score (0-5)';
comment on column public.scores.split_image_url is 'URL to the stored image of the split G.';
comment on column public.scores.pint_image_url is 'URL to the stored image of the pint.';

-- Create storage bucket for split images
insert into storage.buckets (id, name, public) 
values ('split-g-images', 'split-g-images', true);

-- Allow public access to the storage bucket
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'split-g-images' );

-- Allow anonymous uploads
create policy "Authenticated Uploads"
on storage.objects for insert
to anon
with check ( bucket_id = 'split-g-images' );
