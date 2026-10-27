
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ServiceNavigation from "../service-navigation";

type Pengeluaran = {
  id: number;
  tanggal_pengeluaran: string;
  kategori: string;
  keterangan: string;
  jumlah: number;
  metode_pembayaran: string | null;
  catatan: string | null;
  created_at: string;
};

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka || 0);

const formatTanggal = (tanggal: string) => {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(tahun, bulan - 1, hari));
};

export default function PengeluaranPage() {
  const [data, setData] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState("");

  const [tanggal, setTanggal] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [kategori, setKategori] = useState("Bahan Baku");
  const [keterangan, setKeterangan] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [metode, setMetode] = useState("Tunai");
  const [catatan, setCatatan] = useState("");

  async function ambilData() {
    setLoading(true);

    const { data: hasil, error } = await supabase
      .from("pengeluaran")
      .select("*")
      .order("tanggal_pengeluaran", { ascending: false });

    if (error) {
      setPesan("Gagal mengambil data: " + error.message);
      setData([]);
    } else {
      setData((hasil ?? []) as Pengeluaran[]);
      setPesan("");
    }

    setLoading(false);
  }

  useEffect(() => {
    void ambilData();
  }, []);

  async function simpanPengeluaran(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan("");

    const nilaiJumlah = Number(jumlah);

    if (!tanggal || !keterangan.trim() || !jumlah || nilaiJumlah <= 0) {
      setPesan("Lengkapi data dan masukkan jumlah lebih dari nol.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("pengeluaran").insert({
      tanggal_pengeluaran: tanggal,
      kategori,
      keterangan: keterangan.trim(),
      jumlah: nilaiJumlah,
      metode_pembayaran: metode,
      catatan: catatan.trim() || null,
    });

    setSaving(false);

    if (error) {
      setPesan("Gagal menyimpan: " + error.message);
      return;
    }

    setPesan("Pengeluaran berhasil disimpan.");
    setKeterangan("");
    setJumlah("");
    setCatatan("");

    await ambilData();
  }

  const totalPengeluaran = data.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  );

  const totalBulanIni = data
    .filter((item) => item.tanggal_pengeluaran?.slice(0, 7) === tanggal.slice(0, 7))
    .reduce((total, item) => total + Number(item.jumlah || 0), 0);

  return (
    <main className="dashboard-background min-h-screen px-4 py-5 text-[#38251c] sm:px-8 sm:py-7">
      <div className="mx-auto max-w-6xl space-y-5">
        <ServiceNavigation activeHref="/dashboard/pengeluaran" />
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
                Keuangan
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Pengeluaran
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/75">
                Catat biaya usaha dan pantau penggunaannya dengan mudah.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/85 sm:self-auto">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#e7c9a4]"
                aria-hidden="true"
              />
              Pencatatan biaya
            </span>
          </div>
        </header>

        {pesan && (
          <div
            role={pesan.startsWith("Gagal") ? "alert" : "status"}
            className={`dashboard-enter rounded-2xl border p-4 text-sm font-medium shadow-sm ${
              pesan.startsWith("Gagal")
                ? "border-rose-200 bg-rose-50/90 text-rose-700"
                : pesan.startsWith("Lengkapi")
                  ? "border-amber-200 bg-amber-50/90 text-amber-800"
                  : "border-emerald-200 bg-emerald-50/90 text-emerald-800"
            }`}
          >
            {pesan}
          </div>
        )}

        <section aria-label="Ringkasan pengeluaran" className="grid gap-4 sm:grid-cols-2">
          <article className="dashboard-enter dashboard-card relative overflow-hidden rounded-3xl border border-[#634430] bg-gradient-to-br from-[#493126] via-[#704a36] to-[#9b684b] p-5 text-white shadow-[0_18px_40px_-24px_rgba(64,43,26,0.55)] sm:p-6">
            <div aria-hidden="true" className="absolute -right-9 -top-12 h-36 w-36 rounded-full border-[22px] border-[#f1c99f]/[0.14]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white/75">Total pengeluaran</p>
                <p className="mt-4 break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {formatRupiah(totalPengeluaran)}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f1c99f]/15 text-xl text-[#f1c99f]" aria-hidden="true">
                ↘
              </span>
            </div>
            <p className="relative mt-3 text-xs leading-5 text-white/70">
              {data.length} catatan biaya tersimpan
            </p>
          </article>

          <article
            className="dashboard-enter dashboard-card rounded-3xl border border-[#eae4db] bg-white/90 p-5 shadow-[0_10px_30px_-22px_rgba(64,43,26,0.28)] sm:p-6"
            style={{ animationDelay: "90ms" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#78695a]">Pengeluaran bulan ini</p>
                <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-[#35291f] tabular-nums sm:text-3xl">
                  {formatRupiah(totalBulanIni)}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f8e9e5] text-lg text-[#a35646]" aria-hidden="true">
                ◷
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#a08b7c]">
              Berdasarkan bulan pada tanggal terpilih
            </p>
          </article>
        </section>

        <section className="dashboard-enter rounded-3xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7eddf] text-xl text-[#91633c]" aria-hidden="true">
              ＋
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a07853]">
                Pencatatan biaya
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#38291f]">
                Tambah pengeluaran
              </h2>
              <p className="mt-1 text-sm text-[#8a7568]">
                Lengkapi informasi biaya usaha di bawah ini.
              </p>
            </div>
          </div>

          <form onSubmit={simpanPengeluaran} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#59483a]">
                Tanggal
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                />
              </label>

              <label className="block text-sm font-medium text-[#59483a]">
                Kategori
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                >
                  <option>Bahan Baku</option>
                  <option>Gaji Karyawan</option>
                  <option>Listrik dan Air</option>
                  <option>Transportasi</option>
                  <option>Peralatan</option>
                  <option>Operasional</option>
                  <option>Lainnya</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-[#59483a]">
                Keterangan
                <input
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: pembelian tepung"
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                />
              </label>

              <label className="block text-sm font-medium text-[#59483a]">
                Jumlah (Rp)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  placeholder="Contoh: 150000"
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                />
              </label>

              <label className="block text-sm font-medium text-[#59483a]">
                Metode Pembayaran
                <select
                  value={metode}
                  onChange={(e) => setMetode(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                >
                  <option>Tunai</option>
                  <option>Transfer</option>
                  <option>QRIS</option>
                  <option>Lainnya</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-[#59483a]">
                Catatan <span className="font-normal text-[#a08b7c]">(opsional)</span>
                <input
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan tambahan"
                  className="mt-2 h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                />
              </label>
            </div>

            <div className="border-t border-[#eee8df] pt-5">
            <p className="mb-4 text-xs leading-5 text-[#938678]">
              Pastikan jumlah sesuai bukti pembayaran. Catatan tambahan bersifat opsional.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="min-h-12 w-full rounded-xl bg-[#65412f] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(74,48,36,0.8)] transition hover:-translate-y-0.5 hover:bg-[#4b3024] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70452f] active:translate-y-0 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Menyimpan..." : "Simpan pengeluaran"}
            </button>
            </div>
          </form>
        </section>

        <section className="dashboard-enter overflow-hidden rounded-3xl border border-[#eae4db] bg-white/95 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e7df] p-5 sm:px-6 sm:py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07853]">
                Arsip biaya
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#3b2b21]">
                Riwayat pengeluaran
              </h2>
              <p className="mt-1 text-xs text-[#8a7568]">
                {data.length} catatan tersimpan
              </p>
            </div>

            <button
              type="button"
              onClick={() => void ambilData()}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#e5ded4] bg-white px-4 py-2 text-sm font-semibold text-[#705a48] transition hover:border-[#cbb49c] hover:bg-[#faf7f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6245] disabled:cursor-wait disabled:opacity-50"
            >
              <span aria-hidden="true" className={loading ? "animate-spin" : ""}>↻</span>
              {loading ? "Memuat..." : "Perbarui"}
            </button>
          </div>

          {loading ? (
            <div role="status" className="flex min-h-40 flex-col items-center justify-center p-6 text-sm text-[#8a7568]">
              <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#e8ded1] border-t-[#70452d]" />
              <p className="mt-3">Memuat catatan pengeluaran...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="px-5 py-10 text-center sm:px-6">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f7eddf] text-lg text-[#91633c]" aria-hidden="true">↘</span>
              <p className="mt-3 text-sm font-medium text-[#5d5044]">
                Belum ada pengeluaran yang tercatat.
              </p>
              <p className="mt-1 text-xs text-[#938678]">
                Catatan biaya yang Anda simpan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-[#eee8df]">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#faf8f4] text-[10px] uppercase tracking-[0.14em] text-[#8a7568]">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Tanggal</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Kategori</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Keterangan</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Metode</th>
                      <th scope="col" className="px-4 py-3.5 text-right font-semibold">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
                        className="dashboard-enter border-t border-[#f0ebe4] transition-colors first:border-0 hover:bg-[#fcfaf7]"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-[#766858]">
                          {formatTanggal(item.tanggal_pengeluaran)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-[#eee5d9] bg-[#faf7f1] px-2.5 py-1 text-[11px] font-semibold text-[#80644e]">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-[#49382b]">{item.keterangan}</div>
                          {item.catatan && (
                            <div className="mt-1 text-xs text-[#8a7568]">
                              {item.catatan}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[#766858]">{item.metode_pembayaran || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tracking-tight text-[#49382b] tabular-nums">
                          {formatRupiah(Number(item.jumlah))}
                        </td>
                      </tr>
                    ))}
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
