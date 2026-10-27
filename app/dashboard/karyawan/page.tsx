
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ServiceNavigation from "../service-navigation";

type Karyawan = {
  id: number;
  nama: string;
  jabatan: string | null;
  gaji_pokok: number;
  created_at?: string;
};

type PembayaranGaji = {
  id: number;
  karyawan_id: number;
  tanggal_pembayaran: string;
  jumlah_gaji: number;
  catatan: string | null;
};

const rupiah = (nilai: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(nilai) || 0);

export default function KaryawanPage() {
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [pembayaran, setPembayaran] = useState<PembayaranGaji[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState("");

  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [gajiPokok, setGajiPokok] = useState("");

  const [karyawanId, setKaryawanId] = useState("");
  const [tanggal, setTanggal] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [jumlahGaji, setJumlahGaji] = useState("");
  const [catatan, setCatatan] = useState("");

  const muatData = useCallback(async () => {
    setLoading(true);
    setPesan("");

    const [hasilKaryawan, hasilGaji] = await Promise.all([
      supabase.from("karyawan").select("*").order("id", { ascending: false }),
      supabase
        .from("pembayaran_gaji")
        .select("*")
        .order("tanggal_pembayaran", { ascending: false }),
    ]);

    if (hasilKaryawan.error || hasilGaji.error) {
      setPesan(
        "Data belum berhasil dimuat. Periksa nama kolom dan izin akses Supabase. " +
          (hasilKaryawan.error?.message ||
            hasilGaji.error?.message ||
            "")
      );
    } else {
      setKaryawan((hasilKaryawan.data ?? []) as Karyawan[]);
      setPembayaran((hasilGaji.data ?? []) as PembayaranGaji[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void muatData();
  }, [muatData]);

  async function tambahKaryawan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan("");

    if (!nama.trim() || Number(gajiPokok) < 0 || !gajiPokok) {
      setPesan("Masukkan nama dan gaji pokok yang valid.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("karyawan").insert({
      nama: nama.trim(),
      jabatan: jabatan.trim() || null,
      gaji_pokok: Number(gajiPokok),
    });

    setSaving(false);

    if (error) {
      setPesan("Gagal menambahkan karyawan: " + error.message);
      return;
    }

    setNama("");
    setJabatan("");
    setGajiPokok("");
    setPesan("Karyawan berhasil ditambahkan.");
    await muatData();
  }

  async function simpanGaji(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan("");

    if (!karyawanId || !tanggal || !jumlahGaji || Number(jumlahGaji) <= 0) {
      setPesan("Lengkapi karyawan, tanggal, dan jumlah gaji.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("pembayaran_gaji").insert({
      karyawan_id: Number(karyawanId),
      tanggal_pembayaran: tanggal,
      jumlah_gaji: Number(jumlahGaji),
      catatan: catatan.trim() || null,
    });

    setSaving(false);

    if (error) {
      setPesan("Gagal mencatat gaji: " + error.message);
      return;
    }

    setKaryawanId("");
    setJumlahGaji("");
    setCatatan("");
    setPesan("Pembayaran gaji berhasil dicatat.");
    await muatData();
  }

  const totalGaji = pembayaran.reduce(
    (total, item) => total + Number(item.jumlah_gaji || 0),
    0
  );

  return (
    <main className="dashboard-background min-h-screen px-4 py-5 text-[#38251c] sm:px-8 sm:py-7">
      <div className="mx-auto max-w-6xl space-y-5">
        <ServiceNavigation activeHref="/dashboard/karyawan" />
        <header className="dashboard-enter relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#38251f] via-[#65412f] to-[#875640] p-6 text-white shadow-[0_24px_54px_-32px_rgba(64,43,26,0.65)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[34px] border-white/[0.06]" />
          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 transition hover:border-white/30 hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden="true">←</span> Dashboard
            </a>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8c9a7]">
              Puri Donut&apos;s <span className="px-1 text-white/40">/</span>{" "}
              Tim &amp; Penggajian
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Karyawan &amp; Gaji
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/75">
              Kelola data tim dan catat pembayaran gaji dengan tertib.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/85 sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e7c9a4]" aria-hidden="true" />
            {karyawan.length} karyawan terdaftar
          </span>
          </div>
        </header>

        {pesan && (
          <div
            role={pesan.startsWith("Gagal") || pesan.startsWith("Data belum") ? "alert" : "status"}
            className={`dashboard-enter break-words rounded-2xl border p-4 text-sm font-medium shadow-sm ${
              pesan.startsWith("Gagal") || pesan.startsWith("Data belum")
                ? "border-rose-200 bg-rose-50/90 text-rose-700"
                : pesan.startsWith("Masukkan") || pesan.startsWith("Lengkapi")
                  ? "border-amber-200 bg-amber-50/90 text-amber-800"
                  : "border-emerald-200 bg-emerald-50/90 text-emerald-800"
            }`}
          >
            {pesan}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="dashboard-enter dashboard-card relative overflow-hidden rounded-3xl border border-[#634430] bg-gradient-to-br from-[#493126] via-[#704a36] to-[#9b684b] p-5 text-white shadow-[0_18px_40px_-24px_rgba(64,43,26,0.55)] sm:p-6">
            <div aria-hidden="true" className="absolute -right-9 -top-12 h-36 w-36 rounded-full border-[22px] border-[#f1c99f]/[0.14]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white/75">Jumlah karyawan</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{karyawan.length}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f1c99f]/15 text-lg text-[#f1c99f]" aria-hidden="true">♧</span>
            </div>
            <p className="relative mt-3 text-xs leading-5 text-white/70">Anggota tim yang terdaftar</p>
          </article>

          <article className="dashboard-enter dashboard-card rounded-3xl border border-[#eae4db] bg-white/90 p-5 shadow-[0_10px_30px_-22px_rgba(64,43,26,0.28)] sm:p-6" style={{ animationDelay: "75ms" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#78695a]">Total gaji tercatat</p>
                <p className="mt-4 break-words text-xl font-semibold tracking-tight text-[#35291f] tabular-nums sm:text-2xl">{rupiah(totalGaji)}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1dc] text-lg text-[#986020]" aria-hidden="true">Rp</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#a08b7c]">Akumulasi pembayaran yang tercatat</p>
          </article>

          <article className="dashboard-enter dashboard-card rounded-3xl border border-[#eae4db] bg-white/90 p-5 shadow-[0_10px_30px_-22px_rgba(64,43,26,0.28)] sm:p-6" style={{ animationDelay: "150ms" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#78695a]">Jumlah pembayaran</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-[#35291f] tabular-nums">{pembayaran.length}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f0fc] text-lg text-[#4b75a6]" aria-hidden="true">✓</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#a08b7c]">Transaksi pembayaran tersimpan</p>
          </article>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="dashboard-enter rounded-3xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7eddf] text-xl text-[#91633c]" aria-hidden="true">＋</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a07853]">Data tim</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#38291f]">Daftarkan karyawan</h2>
              <p className="mt-1 text-sm text-[#8a7568]">Tambahkan anggota baru beserta informasi gaji pokok.</p>
            </div>
          </div>

          <form onSubmit={tambahKaryawan} className="mt-6 grid gap-5">
            <label className="block text-sm font-medium text-[#59483a]">
              Nama Karyawan
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                placeholder="Nama lengkap"
                className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
              />
            </label>

            <label className="block text-sm font-medium text-[#59483a]">
              Jabatan
              <input
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Produksi"
                className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
              />
            </label>

            <label className="block text-sm font-medium text-[#59483a]">
              Gaji Pokok (Rp)
              <input
                type="number"
                min="0"
                step="1"
                value={gajiPokok}
                onChange={(e) => setGajiPokok(e.target.value)}
                required
                placeholder="Contoh: 1500000"
                className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
              />
            </label>

            <div className="border-t border-[#eee8df] pt-5">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65412f] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(74,48,36,0.8)] transition hover:-translate-y-0.5 hover:bg-[#4b3024] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70452f] active:translate-y-0 disabled:cursor-wait disabled:opacity-60"
              >
                <span aria-hidden="true">{saving ? "…" : "+"}</span>
                {saving ? "Menyimpan data karyawan..." : "Daftarkan karyawan"}
              </button>
            </div>
          </form>
        </section>

        <section className="dashboard-enter rounded-3xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:p-6" style={{ animationDelay: "80ms" }}>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7eddf] text-sm font-semibold text-[#91633c]" aria-hidden="true">Rp</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a07853]">Penggajian</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#38291f]">Catat pembayaran gaji</h2>
              <p className="mt-1 text-sm text-[#8a7568]">Catat pembayaran untuk anggota tim yang terdaftar.</p>
            </div>
          </div>

          <form onSubmit={simpanGaji} className="mt-6 grid gap-5">
            <label className="block text-sm font-medium text-[#59483a]">
              Pilih Karyawan
              <select
                value={karyawanId}
                onChange={(e) => setKaryawanId(e.target.value)}
                required
                className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
              >
                <option value="">Pilih karyawan</option>
                {karyawan.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-[#59483a]">
              Tanggal Pembayaran
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
              />
            </label>

            <label className="block text-sm font-medium text-[#59483a]">
              Jumlah Gaji Dibayar (Rp)
              <input
                type="number"
                min="1"
                step="1"
                value={jumlahGaji}
                onChange={(e) => setJumlahGaji(e.target.value)}
                required
                placeholder="Masukkan jumlah pembayaran"
                className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
              />
            </label>

            <label className="block text-sm font-medium text-[#59483a]">
              Catatan (opsional)
              <input
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: gaji bulan ini"
                className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
              />
            </label>

            {!karyawan.length && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                Daftarkan karyawan terlebih dahulu sebelum mencatat pembayaran gaji.
              </p>
            )}

            <div className="border-t border-[#eee8df] pt-5">
              <button
                type="submit"
                disabled={saving || karyawan.length === 0}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#65412f] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(74,48,36,0.8)] transition hover:-translate-y-0.5 hover:bg-[#4b3024] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70452f] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden="true">{saving ? "…" : "✓"}</span>
                {saving ? "Menyimpan pembayaran..." : "Catat pembayaran gaji"}
              </button>
            </div>
          </form>
        </section>
        </div>

        <section className="dashboard-enter overflow-hidden rounded-3xl border border-[#eae4db] bg-white/95 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e7df] p-5 sm:px-6 sm:py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07853]">Data tim</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#3b2b21]">Daftar karyawan</h2>
              <p className="mt-1 text-xs text-[#8a7568]">Informasi anggota tim dan gaji pokok.</p>
            </div>
            <button
              type="button"
              onClick={() => void muatData()}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#e5ded4] bg-white px-4 py-2 text-sm font-semibold text-[#705a48] transition hover:border-[#cbb49c] hover:bg-[#faf7f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6245] disabled:cursor-wait disabled:opacity-50"
            >
              <span aria-hidden="true" className={loading ? "animate-spin" : ""}>↻</span>
              {loading ? "Memuat..." : "Perbarui"}
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-[#8a7568]" role="status">Memuat data karyawan...</p>
          ) : karyawan.length === 0 ? (
            <p className="p-6 text-sm text-[#8a7568]">
              Belum ada data karyawan.
            </p>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
              {karyawan.map((item, index) => (
                <article
                  key={item.id}
                  style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
                  className="dashboard-enter dashboard-card rounded-2xl border border-[#f0e7df] bg-[#fffdfa] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3e8d9] text-sm font-bold text-[#8c592f]">
                      {item.nama.trim().slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[#49382b]">{item.nama}</h3>
                      <p className="mt-1 truncate text-xs text-[#8a7568]">{item.jabatan || "Belum ada jabatan"}</p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-[#f0e7df] pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9b8c7c]">Gaji pokok</p>
                    <p className="mt-1 text-sm font-bold tracking-[-0.02em] text-[#805032] tabular-nums">{rupiah(item.gaji_pokok)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-enter overflow-hidden rounded-3xl border border-[#eae4db] bg-white/95 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)]">
          <div className="border-b border-[#f0e7df] p-5 sm:px-6 sm:py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07853]">Arsip penggajian</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#3b2b21]">Riwayat pembayaran gaji</h2>
            <p className="mt-1 text-xs text-[#8a7568]">{pembayaran.length} pembayaran tercatat.</p>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-[#8a7568]" role="status">Memuat riwayat pembayaran...</p>
          ) : pembayaran.length === 0 ? (
            <p className="p-6 text-sm text-[#8a7568]">
              Belum ada pembayaran gaji yang dicatat.
            </p>
          ) : (
            <div className="overflow-x-auto p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-[#f0e7df]">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-[#faf7f2] text-[11px] uppercase tracking-[0.1em] text-[#8a7568]">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 font-bold">Tanggal</th>
                      <th scope="col" className="px-4 py-3.5 font-bold">Karyawan</th>
                      <th scope="col" className="px-4 py-3.5 text-right font-bold">Jumlah gaji</th>
                      <th scope="col" className="px-4 py-3.5 font-bold">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                  {pembayaran.map((item, index) => {
                    const namaKaryawan =
                      karyawan.find((k) => k.id === item.karyawan_id)?.nama ??
                      `ID ${item.karyawan_id}`;

                    return (
                      <tr
                        key={item.id}
                        style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
                        className="dashboard-enter border-t border-[#f5eee8] transition-colors first:border-0 hover:bg-[#fdfaf7]"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-[#766858]">
                          {item.tanggal_pembayaran}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#49382b]">{namaKaryawan}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-[#49382b] tabular-nums">
                          {rupiah(item.jumlah_gaji)}
                        </td>
                        <td className="px-4 py-4 text-[#8a7568]">{item.catatan || "—"}</td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
