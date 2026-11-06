alter table public.karyawan
  add column if not exists client_id uuid,
  add column if not exists telepon text not null default '',
  add column if not exists tanggal_masuk date,
  add column if not exists status text not null default 'Aktif',
  add column if not exists diarsipkan boolean not null default false;

update public.karyawan
set client_id = gen_random_uuid()
where client_id is null;

alter table public.karyawan
  alter column client_id set default gen_random_uuid(),
  alter column client_id set not null;

create unique index if not exists karyawan_client_id_key
  on public.karyawan (client_id);

alter table public.pembayaran_gaji
  add column if not exists client_id uuid,
  add column if not exists periode_bulan date;

update public.pembayaran_gaji
set
  client_id = coalesce(client_id, gen_random_uuid()),
  periode_bulan = coalesce(
    periode_bulan,
    date_trunc('month', tanggal_pembayaran::timestamp)::date
  );

alter table public.pembayaran_gaji
  alter column client_id set default gen_random_uuid(),
  alter column client_id set not null,
  alter column periode_bulan set not null;

create unique index if not exists pembayaran_gaji_client_id_key
  on public.pembayaran_gaji (client_id);

create index if not exists pembayaran_gaji_periode_bulan_idx
  on public.pembayaran_gaji (periode_bulan);
