-- Stock Monitor 云端同步表
-- 在 Supabase SQL Editor 中执行此脚本

create table if not exists sync_rooms (
  room_id text primary key,
  payload text not null,
  updated_at timestamptz not null default now()
);

create index if not exists sync_rooms_updated_at_idx on sync_rooms (updated_at desc);

alter table sync_rooms enable row level security;

-- 公开读写：安全性依赖同步码 + 客户端 AES 加密
create policy "sync_rooms_select" on sync_rooms for select using (true);
create policy "sync_rooms_insert" on sync_rooms for insert with check (true);
create policy "sync_rooms_update" on sync_rooms for update using (true);
