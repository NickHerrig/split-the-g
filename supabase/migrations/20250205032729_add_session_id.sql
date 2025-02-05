-- Add session_id column to scores table
alter table public.scores
add column session_id uuid;

-- Add index for faster lookups
create index scores_session_id_idx on public.scores (session_id);