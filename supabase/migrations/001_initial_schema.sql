-- ============================================================
-- Life OS — Schema inicial
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- Áreas de vida (dados de referência)
-- ============================================================
create table if not exists life_areas (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  color text not null,
  icon text not null
);

insert into life_areas (slug, name, color, icon) values
  ('health',        'Saúde',             '#22c55e', 'Heart'),
  ('career',        'Carreira',          '#3b82f6', 'Briefcase'),
  ('finances',      'Finanças',          '#f59e0b', 'DollarSign'),
  ('relationships', 'Relacionamentos',   '#ec4899', 'Users'),
  ('personal',      'Desenvolvimento',   '#8b5cf6', 'Star'),
  ('leisure',       'Lazer',             '#f97316', 'Smile'),
  ('family',        'Família',           '#ef4444', 'Home'),
  ('spirituality',  'Espiritualidade',   '#6366f1', 'Sun')
on conflict (slug) do nothing;

-- ============================================================
-- Perfis e configurações
-- ============================================================
create table if not exists profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid unique not null references auth.users(id) on delete cascade,
  name         text not null,
  avatar_url   text,
  timezone     text not null default 'America/Sao_Paulo',
  household_id uuid,
  created_at   timestamptz not null default now()
);

create table if not exists user_settings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid unique not null references auth.users(id) on delete cascade,
  preferences  jsonb not null default '{}',
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- Scores por área
-- ============================================================
create table if not exists area_scores (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  area_id        uuid not null references life_areas(id),
  score          integer not null check (score >= 0 and score <= 100),
  week_of        date not null,
  computed_from  jsonb not null default '{}',
  unique (user_id, area_id, week_of)
);

-- ============================================================
-- Planejamento
-- ============================================================
create table if not exists life_vision (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid unique not null references auth.users(id) on delete cascade,
  mission    text,
  values     text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists okrs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  period     text not null check (period in ('annual', 'quarterly')),
  year       integer not null,
  quarter    integer check (quarter between 1 and 4),
  status     text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  shared     boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists key_results (
  id       uuid primary key default uuid_generate_v4(),
  okr_id   uuid not null references okrs(id) on delete cascade,
  title    text not null,
  target   numeric not null,
  current  numeric not null default 0,
  unit     text not null,
  due_date date
);

-- ============================================================
-- Projetos e tarefas
-- ============================================================
create table if not exists projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  area        text,
  status      text not null default 'active' check (status in ('active', 'completed', 'archived')),
  due_date    date,
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  shared      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid references projects(id) on delete set null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  status      text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'archived')),
  due_date    date,
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee_id uuid references auth.users(id),
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists subtasks (
  id      uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  title   text not null,
  done    boolean not null default false
);

-- ============================================================
-- Hábitos
-- ============================================================
create table if not exists habits (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  frequency      text not null default 'daily' check (frequency in ('daily', 'weekly', 'custom')),
  area           text,
  target_streak  integer not null default 21,
  shared         boolean not null default false,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists habit_logs (
  id        uuid primary key default uuid_generate_v4(),
  habit_id  uuid not null references habits(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  date      date not null,
  done      boolean not null default false,
  note      text,
  unique (habit_id, user_id, date)
);

-- ============================================================
-- Saúde
-- ============================================================
create table if not exists health_logs (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  sleep_hours    numeric,
  sleep_quality  integer check (sleep_quality between 1 and 10),
  exercise_min   integer,
  water_ml       integer,
  mood           integer check (mood between 1 and 10),
  energy         jsonb not null default '{}',
  notes          text,
  unique (user_id, date)
);

-- ============================================================
-- Finanças
-- ============================================================
create table if not exists accounts (
  id       uuid primary key default uuid_generate_v4(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  name     text not null,
  type     text not null check (type in ('checking', 'savings', 'credit', 'investment', 'other')),
  balance  numeric not null default 0,
  currency text not null default 'BRL',
  shared   boolean not null default false
);

create table if not exists categories (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  type            text not null check (type in ('income', 'expense')),
  color           text not null default '#6b7280',
  budget_monthly  numeric
);

create table if not exists transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  account_id  uuid not null references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount      numeric not null,
  type        text not null check (type in ('income', 'expense')),
  date        date not null,
  description text,
  shared      boolean not null default false
);

create table if not exists financial_goals (
  id       uuid primary key default uuid_generate_v4(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  title    text not null,
  target   numeric not null,
  current  numeric not null default 0,
  deadline date,
  shared   boolean not null default false
);

-- ============================================================
-- Relacionamentos
-- ============================================================
create table if not exists contacts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  relationship    text,
  frequency_days  integer,
  notes           text,
  birthday        date,
  last_contact_at date,
  tags            text[] not null default '{}'
);

create table if not exists contact_logs (
  id         uuid primary key default uuid_generate_v4(),
  contact_id uuid not null references contacts(id) on delete cascade,
  date       date not null,
  medium     text,
  summary    text
);

-- ============================================================
-- Conhecimento
-- ============================================================
create table if not exists notes (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  content      text,
  tags         text[] not null default '{}',
  type         text not null default 'note' check (type in ('note', 'idea', 'learning', 'reference', 'project')),
  linked_notes uuid[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists books (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  author      text,
  status      text not null default 'want_to_read' check (status in ('want_to_read', 'reading', 'read')),
  rating      integer check (rating between 1 and 5),
  notes       text,
  started_at  date,
  finished_at date
);

-- ============================================================
-- Check-ins diários
-- ============================================================
create table if not exists daily_checkins (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  mood       integer check (mood between 1 and 10),
  energy     integer check (energy between 1 and 10),
  gratitude  text,
  intention  text,
  highlights text,
  challenges text,
  done       boolean not null default false,
  unique (user_id, date)
);

-- ============================================================
-- Revisões periódicas
-- ============================================================
create table if not exists reviews (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null check (type in ('weekly', 'monthly', 'yearly')),
  period_start date not null,
  period_end   date not null,
  content      jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

-- ============================================================
-- Índices para performance
-- ============================================================
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_habits_user_id on habits(user_id);
create index if not exists idx_habit_logs_habit_date on habit_logs(habit_id, date);
create index if not exists idx_habit_logs_user_date on habit_logs(user_id, date);
create index if not exists idx_health_logs_user_date on health_logs(user_id, date);
create index if not exists idx_transactions_user_date on transactions(user_id, date);
create index if not exists idx_daily_checkins_user_date on daily_checkins(user_id, date);
create index if not exists idx_notes_user_id on notes(user_id);
create index if not exists idx_contacts_user_id on contacts(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table life_vision enable row level security;
alter table okrs enable row level security;
alter table key_results enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table subtasks enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table health_logs enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table financial_goals enable row level security;
alter table contacts enable row level security;
alter table contact_logs enable row level security;
alter table notes enable row level security;
alter table books enable row level security;
alter table daily_checkins enable row level security;
alter table reviews enable row level security;
alter table area_scores enable row level security;

-- Políticas: usuário acessa apenas seus próprios dados
-- (shared=true será tratado em fase futura com household_id)

create policy "profiles: own data" on profiles
  for all using (auth.uid() = user_id);

create policy "user_settings: own data" on user_settings
  for all using (auth.uid() = user_id);

create policy "life_vision: own data" on life_vision
  for all using (auth.uid() = user_id);

create policy "okrs: own data" on okrs
  for all using (auth.uid() = user_id);

create policy "key_results: own okrs" on key_results
  for all using (
    exists (select 1 from okrs where okrs.id = key_results.okr_id and okrs.user_id = auth.uid())
  );

create policy "projects: own data" on projects
  for all using (auth.uid() = user_id);

create policy "tasks: own data" on tasks
  for all using (auth.uid() = user_id);

create policy "subtasks: own tasks" on subtasks
  for all using (
    exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid())
  );

create policy "habits: own data" on habits
  for all using (auth.uid() = user_id);

create policy "habit_logs: own data" on habit_logs
  for all using (auth.uid() = user_id);

create policy "health_logs: own data" on health_logs
  for all using (auth.uid() = user_id);

create policy "accounts: own data" on accounts
  for all using (auth.uid() = user_id);

create policy "categories: own data" on categories
  for all using (auth.uid() = user_id);

create policy "transactions: own data" on transactions
  for all using (auth.uid() = user_id);

create policy "financial_goals: own data" on financial_goals
  for all using (auth.uid() = user_id);

create policy "contacts: own data" on contacts
  for all using (auth.uid() = user_id);

create policy "contact_logs: own contacts" on contact_logs
  for all using (
    exists (select 1 from contacts where contacts.id = contact_logs.contact_id and contacts.user_id = auth.uid())
  );

create policy "notes: own data" on notes
  for all using (auth.uid() = user_id);

create policy "books: own data" on books
  for all using (auth.uid() = user_id);

create policy "daily_checkins: own data" on daily_checkins
  for all using (auth.uid() = user_id);

create policy "reviews: own data" on reviews
  for all using (auth.uid() = user_id);

create policy "area_scores: own data" on area_scores
  for all using (auth.uid() = user_id);

-- life_areas é leitura pública (dados de referência)
create policy "life_areas: public read" on life_areas
  for select using (true);

-- ============================================================
-- Trigger: criar perfil automaticamente ao registrar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
