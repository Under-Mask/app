create extension if not exists pgcrypto;

create table if not exists public.app_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id text not null unique,
  display_name text not null default '지민',
  campus text,
  avatar_asset text,
  birth text,
  age integer,
  gender text,
  region text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  device_id text primary key references public.app_profiles(device_id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  coins integer not null default 0,
  daily_comment text,
  onboarding_completed boolean not null default false,
  notifications_read boolean not null default false,
  notification_origin jsonb not null default '{}'::jsonb,
  my_preferences jsonb not null default '{}'::jsonb,
  auth_mode text,
  updated_at timestamptz not null default now()
);

create table if not exists public.emotion_records (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  device_id text not null references public.app_profiles(device_id) on delete cascade,
  recorded_at timestamptz not null,
  emotion_id text not null,
  intensity integer not null check (intensity >= 0 and intensity <= 100),
  note text not null default '',
  tags text[] not null default '{}',
  source text not null default 'app',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_goals (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  device_id text not null references public.app_profiles(device_id) on delete cascade,
  task_key text not null,
  title text,
  is_done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_id, task_key)
);

create table if not exists public.reward_claims (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  device_id text not null references public.app_profiles(device_id) on delete cascade,
  reward_key text not null,
  reward_title text,
  claimed boolean not null default false,
  coins_awarded integer not null default 0,
  claimed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (device_id, reward_key)
);

create table if not exists public.ai_conversations (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  device_id text not null references public.app_profiles(device_id) on delete cascade,
  record_id text references public.emotion_records(id) on delete set null,
  title text not null default 'AI 공감 대화',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id text primary key,
  conversation_id text references public.ai_conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  device_id text not null references public.app_profiles(device_id) on delete cascade,
  record_id text references public.emotion_records(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_state (
  device_id text primary key references public.app_profiles(device_id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  read_all boolean not null default false,
  last_read_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  device_id text not null references public.app_profiles(device_id) on delete cascade,
  category text not null default 'general',
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mental_health_centers (
  id text primary key,
  name text not null,
  region text not null,
  address text not null,
  phone text,
  hours text,
  distance_label text,
  services text[] not null default '{}',
  rating numeric(2,1),
  review_count integer not null default 0,
  latitude numeric,
  longitude numeric,
  photo_asset text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_resources (
  id text primary key,
  title text not null,
  body text not null,
  category text not null,
  contact text,
  action_label text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brainfit_app_state (
  device_id text primary key references public.app_profiles(device_id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  sync_reason text,
  records jsonb not null default '[]'::jsonb,
  reward_claims jsonb not null default '{}'::jsonb,
  goals jsonb not null default '{}'::jsonb,
  ai_messages jsonb not null default '[]'::jsonb,
  coins integer not null default 0,
  daily_comment text,
  notifications_read boolean not null default false,
  my_profile jsonb not null default '{}'::jsonb,
  my_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_profiles add column if not exists birth text;
alter table public.app_profiles add column if not exists age integer;
alter table public.app_profiles add column if not exists gender text;
alter table public.app_profiles add column if not exists region text;
alter table public.app_profiles add column if not exists bio text;
alter table public.app_settings add column if not exists my_preferences jsonb not null default '{}'::jsonb;
alter table public.brainfit_app_state add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.brainfit_app_state add column if not exists my_profile jsonb not null default '{}'::jsonb;
alter table public.brainfit_app_state add column if not exists my_preferences jsonb not null default '{}'::jsonb;

create index if not exists emotion_records_device_recorded_at_idx
  on public.emotion_records (device_id, recorded_at desc);

create index if not exists ai_messages_device_created_at_idx
  on public.ai_messages (device_id, created_at asc);

create index if not exists notification_events_device_created_at_idx
  on public.notification_events (device_id, created_at desc);

create index if not exists mental_health_centers_region_idx
  on public.mental_health_centers (region);

create index if not exists app_profiles_user_id_idx
  on public.app_profiles (user_id);

create index if not exists brainfit_app_state_user_updated_idx
  on public.brainfit_app_state (user_id, updated_at desc);

insert into public.mental_health_centers
  (id, name, region, address, phone, hours, distance_label, services, rating, review_count, photo_asset)
values
  ('gangnam-center', '강남구정신건강복지센터', '서울특별시 강남구', '서울 강남구 선릉로 123, 강남구보건소 3층', '02-123-4567', '평일 09:00 - 18:00', '1.2km', array['상담서비스', '정신건강검진', '사례관리', '교육 및 프로그램'], 4.8, 23, 'help_center_building_photo_card.png'),
  ('seocho-center', '서초구정신건강복지센터', '서울특별시 서초구', '서울 서초구 반포대로 58, 서초구보건소 4층', '02-987-6543', '평일 09:00 - 18:00', '3.6km', array['상담서비스', '위기지원', '가족지원', '마음건강교육'], 4.7, 18, 'help_center_building_photo_card.png'),
  ('songpa-center', '송파구정신건강복지센터', '서울특별시 송파구', '서울 송파구 송파대로 201, 송파구보건지소 2층', '02-555-7890', '평일 09:00 - 18:00', '5.8km', array['상담서비스', '정신건강검진', '사례관리', '집단프로그램'], 4.6, 12, 'help_center_building_photo_card.png')
on conflict (id) do update set
  name = excluded.name,
  region = excluded.region,
  address = excluded.address,
  phone = excluded.phone,
  hours = excluded.hours,
  distance_label = excluded.distance_label,
  services = excluded.services,
  rating = excluded.rating,
  review_count = excluded.review_count,
  photo_asset = excluded.photo_asset,
  updated_at = now();

insert into public.help_resources
  (id, title, body, category, contact, action_label, sort_order)
values
  ('hotline-1393', '24시간 전화 상담', '정신건강 상담전화를 연결할 수 있어요.', 'hotline', '1393', '전화 상담', 10),
  ('message-1388', '24시간 문자 상담', '청소년 상담 문자로 도움을 받을 수 있어요.', 'hotline', '#1388', '문자 상담', 20),
  ('emergency-112-119', '긴급 상황 도움', '위급할 때 즉시 연락해야 해요.', 'emergency', '112 / 119', '긴급 전화', 30),
  ('center-search', '정신건강복지센터 찾기', '내 주변 센터 위치와 프로그램을 확인해보세요.', 'resource', null, '센터 찾기', 40)
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  category = excluded.category,
  contact = excluded.contact,
  action_label = excluded.action_label,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.app_profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.emotion_records enable row level security;
alter table public.user_goals enable row level security;
alter table public.reward_claims enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.notification_state enable row level security;
alter table public.notification_events enable row level security;
alter table public.mental_health_centers enable row level security;
alter table public.help_resources enable row level security;
alter table public.brainfit_app_state enable row level security;

drop policy if exists "demo anon all app profiles" on public.app_profiles;
drop policy if exists "users manage own app profiles" on public.app_profiles;
create policy "users manage own app profiles" on public.app_profiles
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon all app settings" on public.app_settings;
drop policy if exists "users manage own app settings" on public.app_settings;
create policy "users manage own app settings" on public.app_settings
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon all emotion records" on public.emotion_records;
drop policy if exists "users manage own emotion records" on public.emotion_records;
create policy "users manage own emotion records" on public.emotion_records
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon all user goals" on public.user_goals;
drop policy if exists "users manage own goals" on public.user_goals;
create policy "users manage own goals" on public.user_goals
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon all reward claims" on public.reward_claims;
drop policy if exists "users manage own reward claims" on public.reward_claims;
create policy "users manage own reward claims" on public.reward_claims
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon all ai conversations" on public.ai_conversations;
drop policy if exists "users manage own ai conversations" on public.ai_conversations;
create policy "users manage own ai conversations" on public.ai_conversations
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon all ai messages" on public.ai_messages;
drop policy if exists "users manage own ai messages" on public.ai_messages;
create policy "users manage own ai messages" on public.ai_messages
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon all notification state" on public.notification_state;
drop policy if exists "users manage own notification state" on public.notification_state;
create policy "users manage own notification state" on public.notification_state
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon all notification events" on public.notification_events;
drop policy if exists "users manage own notification events" on public.notification_events;
create policy "users manage own notification events" on public.notification_events
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());

drop policy if exists "demo anon read mental health centers" on public.mental_health_centers;
drop policy if exists "public read mental health centers" on public.mental_health_centers;
create policy "public read mental health centers" on public.mental_health_centers
  for select to anon, authenticated
  using (true);

drop policy if exists "demo anon read help resources" on public.help_resources;
drop policy if exists "public read help resources" on public.help_resources;
create policy "public read help resources" on public.help_resources
  for select to anon, authenticated
  using (true);

drop policy if exists "demo anon all brainfit app state" on public.brainfit_app_state;
drop policy if exists "users manage own app state" on public.brainfit_app_state;
create policy "users manage own app state" on public.brainfit_app_state
  for all to authenticated
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid());
