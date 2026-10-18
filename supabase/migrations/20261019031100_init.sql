-- 20261019031100_init.sql
-- Saved words. The full explanation lives in `card` (shape = WordCard in 05-AI-PROMPTS.md).
create table public.words (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  word               text not null check (length(word) between 1 and 80),
  card               jsonb not null,
  quiz               jsonb not null default '[]',        -- QuizQuestion[] (05-AI-PROMPTS.md)
  quiz_generated_at  timestamptz,

  -- spaced repetition state (07-QUIZ-ENGINE.md)
  box                smallint not null default 0 check (box between 0 and 5),  -- 0 = new
  next_review_at     timestamptz not null default (now() + interval '1 day'),
  last_reviewed_at   timestamptz,
  review_count       int not null default 0,
  correct_count      int not null default 0,
  wrong_count        int not null default 0,

  -- "I forgot it" signal
  lookup_count       int not null default 1,
  last_looked_up_at  timestamptz not null default now(),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index words_user_word_unique on public.words (user_id, lower(word));
create index words_user_created on public.words (user_id, created_at desc);
create index words_user_due     on public.words (user_id, next_review_at);

-- One row per answered quiz question (history, "reviewed today", last kind used).
create table public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  word_id      uuid not null references public.words(id) on delete cascade,
  kind         text not null check (kind in ('meaning','fill_blank','usage','recall')),
  mode         text not null check (mode in ('review','practice')),
  correct      boolean not null,
  answered_at  timestamptz not null default now()
);

create index quiz_attempts_word on public.quiz_attempts (word_id, answered_at desc);
create index quiz_attempts_user_time on public.quiz_attempts (user_id, answered_at desc);

-- updated_at trigger
create function public.set_updated_at() returns trigger language plpgsql
set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger words_updated_at before update on public.words
for each row execute function public.set_updated_at();

-- RLS
alter table public.words enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "own words" on public.words
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own attempts" on public.quiz_attempts
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
