alter table public.penjualan
add column if not exists deleted_at timestamptz;

create index if not exists penjualan_deleted_at_idx
on public.penjualan (deleted_at);
