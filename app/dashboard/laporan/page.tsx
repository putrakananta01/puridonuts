
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ServiceNavigation from "../service-navigation";

type Penjualan = {
  id: number;
  tanggal_penjualan: string;
  total_penjualan: number;
};

type Pengeluaran = {
  id: number;
  tanggal_pengeluaran: string;
  kategori: string;
  jumlah: number;
};

type PembayaranGaji = {
  id: number;
  tanggal_pembayaran: string;
  jumlah_gaji: number;
};

function formatRupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai || 0);
}

function getBulanSekarang(): string {
  const sekarang = new Date();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  return `${sekarang.getFullYear()}-${bulan}`;
}

function getBatasBulan(bulan: string) {
  const [tahun, nomorBulan] = bulan.split("-").map(Number);
  const awal = `${bulan}-01`;
  const tanggalAkhir = new Date(tahun, nomorBulan, 1);
  const akhir = `${tanggalAkhir.getFullYear()}-${String(
    tanggalAkhir.getMonth() + 1
  ).padStart(2, "0")}-01`;

  return { awal, akhir };
}

export default function LaporanPage() {
  const [bulan, setBulan] = useState(getBulanSekarang());
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [pembayaranGaji, setPembayaranGaji] = useState<PembayaranGaji[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesan, setPesan] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let aktif = true;

    async function muatLaporan() {
      const { awal, akhir } = getBatasBulan(bulan);

      const hasil = await Promise.all([
        supabase
          .from("penjualan")
          .select("id,tanggal_penjualan,total_penjualan")
          .gte("tanggal_penjualan", awal)
          .lt("tanggal_penjualan", akhir),

        supabase
          .from("pengeluaran")
          .select("id,tanggal_pengeluaran,kategori,jumlah")
          .gte("tanggal_pengeluaran", awal)
          .lt("tanggal_pengeluaran", akhir),

        supabase
          .from("pembayaran_gaji")
          .select("id,tanggal_pembayaran,jumlah_gaji")
          .gte("tanggal_pembayaran", awal)
          .lt("tanggal_pembayaran", akhir),
      ]);

      if (!aktif) return;

      const error =
        hasil[0].error || hasil[1].error || hasil[2].error;

      if (error) {
        setPenjualan([]);
        setPengeluaran([]);
        setPembayaranGaji([]);
        setPesan(`Gagal memuat laporan: ${error.message}`);
      } else {
        setPenjualan((hasil[0].data ?? []) as Penjualan[]);
        setPengeluaran((hasil[1].data ?? []) as Pengeluaran[]);
        setPembayaranGaji((hasil[2].data ?? []) as PembayaranGaji[]);
        setPesan("");
      }

      setLoading(false);
    }

    void muatLaporan();

    return () => {
      aktif = false;
    };
  }, [bulan, refreshKey]);

  const totalPenjualan = penjualan.reduce(
    (total, item) => total + Number(item.total_penjualan || 0),
    0
  );

  const totalPengeluaran = pengeluaran.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  );

  const totalGaji = pembayaranGaji.reduce(
    (total, item) => total + Number(item.jumlah_gaji || 0),
    0
  );

  const totalBiaya = totalPengeluaran + totalGaji;
  const laba = totalPenjualan - totalBiaya;

  const namaBulan = new Date(`${bulan}-01T12:00:00`).toLocaleDateString(
    "id-ID",
    {
      month: "long",
      year: "numeric",
    }
  );

  const kartuRingkasan = [
    {
      judul: "Total penjualan",
      nilai: totalPenjualan,
      catatan: `${penjualan.length} transaksi`,
      simbol: "↗",
      ikon: "bg-[#f7eddf] text-[#91633c]",
      nilaiWarna: "text-[#38291f]",
    },
    {
      judul: "Pengeluaran umum",
      nilai: totalPengeluaran,
      catatan: `${pengeluaran.length} catatan`,
      simbol: "↘",
      ikon: "bg-[#f8e9e5] text-[#a35646]",
      nilaiWarna: "text-[#9b4e40]",
    },
    {
      judul: "Pembayaran gaji",
      nilai: totalGaji,
      catatan: `${pembayaranGaji.length} pembayaran`,
      simbol: "Rp",
      ikon: "bg-[#eee9f5] text-[#765b96]",
      nilaiWarna: "text-[#765b96]",
    },
    {
      judul: "Perkiraan laba bersih",
      nilai: laba,
      catatan: "Penjualan dikurangi biaya tercatat",
      simbol: "✓",
      ikon: laba < 0
        ? "bg-[#f8e9e5] text-[#a35646]"
        : "bg-[#e7f1e7] text-[#4c7953]",
      nilaiWarna: laba < 0 ? "text-[#9b4e40]" : "text-[#4c7953]",
    },
  ];

  return (
    <main className="dashboard-background min-h-screen px-4 py-6 text-[#33261e] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl space-y-6">
        <ServiceNavigation activeHref="/dashboard/laporan" />
        <header className="dashboard-enter relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4c3024] via-[#70452d] to-[#875a3a] p-6 text-white shadow-[0_24px_54px_-32px_rgba(64,43,26,0.65)] sm:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[34px] border-white/[0.06]"
          />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e7c9a4]">
              Keuangan · Ikhtisar Berkala
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Laporan Keuangan
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
              Tinjau pemasukan, pengeluaran, pembayaran gaji, dan perkiraan
              hasil usaha dalam periode yang dipilih.
            </p>
          </div>
        </header>

        <section className="dashboard-enter flex flex-col gap-4 rounded-2xl border border-[#eae4db] bg-white/90 p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <label
            htmlFor="bulan-laporan"
            className="text-sm font-semibold text-[#493a30]"
          >
            Periode laporan
            <input
              id="bulan-laporan"
              type="month"
              value={bulan}
              onChange={(event) => {
                setLoading(true);
                setPesan("");
                setBulan(event.target.value);
              }}
              required
              className="mt-2 block min-h-12 w-full rounded-xl border border-[#e5ded4] bg-[#fffefa] px-4 py-3 text-sm text-[#493a30] outline-none transition hover:border-[#cdbca8] focus:border-[#8c6241] focus:ring-4 focus:ring-[#8c6241]/10 sm:w-56"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setPesan("");
              setRefreshKey((key) => key + 1);
            }}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#70452d] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(74,48,36,0.8)] transition hover:-translate-y-0.5 hover:bg-[#593824] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70452d] disabled:cursor-wait disabled:opacity-60"
          >
            {loading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {loading ? "Memuat laporan..." : "Muat ulang"}
          </button>
        </section>

        {pesan && (
          <div
            role="alert"
            className="dashboard-enter break-words rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800"
          >
            {pesan}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#3b2b21]">
              Ringkasan keuangan
            </h2>
            <p className="mt-1 text-sm text-[#83776b]">
              Periode laporan: <span className="font-medium text-[#594738]">{namaBulan}</span>
            </p>
          </div>
          <span className="rounded-full border border-[#e5ded4] bg-white/80 px-3 py-1.5 text-xs font-medium text-[#76685a]">
            Data tercatat
          </span>
        </div>

        {loading ? (
          <div
            role="status"
            className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-[#eae4db] bg-white/90 p-8 text-center"
          >
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#e8ded1] border-t-[#70452d]" />
            <p className="mt-4 text-sm font-medium text-[#78695b]">
              Memuat laporan keuangan...
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kartuRingkasan.map((kartu, index) => (
                <article
                  key={kartu.judul}
                  className="dashboard-enter dashboard-card rounded-2xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_10px_30px_-22px_rgba(64,43,26,0.28)]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-[#78695b]">
                      {kartu.judul}
                    </p>
                    <span
                      aria-hidden="true"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${kartu.ikon}`}
                    >
                      {kartu.simbol}
                    </span>
                  </div>
                  <p
                    className={`mt-5 break-words text-xl font-semibold tracking-tight tabular-nums sm:text-2xl ${kartu.nilaiWarna}`}
                  >
                    {formatRupiah(kartu.nilai)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#938678]">
                    {kartu.catatan}
                  </p>
                </article>
              ))}
            </section>

            <section className="dashboard-enter rounded-2xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:p-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a07853]">
                  Ikhtisar periode
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#38291f]">
                  Rincian keuangan
                </h2>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#78695b]">Pemasukan penjualan</span>
                  <span className="text-right font-semibold tabular-nums text-[#38291f]">
                    {formatRupiah(totalPenjualan)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#78695b]">Pengeluaran umum</span>
                  <span className="text-right font-semibold tabular-nums text-[#9b4e40]">
                    − {formatRupiah(totalPengeluaran)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#78695b]">Pembayaran gaji</span>
                  <span className="text-right font-semibold tabular-nums text-[#9b4e40]">
                    − {formatRupiah(totalGaji)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eee6dc] bg-[#faf8f4] px-4 py-4">
                  <span className="font-semibold text-[#493a30]">
                    Perkiraan laba bersih
                  </span>
                  <span
                    className={`text-right text-base font-bold tabular-nums ${
                      laba < 0 ? "text-[#9b4e40]" : "text-[#4c7953]"
                    }`}
                  >
                    {formatRupiah(laba)}
                  </span>
                </div>
              </div>

              <p className="mt-5 rounded-xl border border-[#eee6dc] bg-[#faf8f4] p-4 text-xs leading-5 text-[#776b5f]">
                Perhitungan ini mencakup data penjualan, pengeluaran, dan
                pembayaran gaji yang telah tercatat. Pastikan pembayaran gaji
                tidak dicatat kembali sebagai pengeluaran. Biaya yang belum
                dicatat tidak termasuk dalam laporan.
              </p>
            </section>

            <section className="dashboard-enter overflow-hidden rounded-2xl border border-[#eae4db] bg-white/95 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)]">
              <div className="border-b border-[#eee8df] px-5 py-5 sm:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a07853]">
                  Biaya usaha
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#38291f]">
                  Rincian pengeluaran
                </h2>
              </div>

              {pengeluaran.length === 0 ? (
                <div className="px-5 py-10 text-center sm:px-6">
                  <p className="text-sm font-medium text-[#5d5044]">
                    Belum ada pengeluaran pada periode ini.
                  </p>
                  <p className="mt-1 text-xs text-[#938678]">
                    Catatan pengeluaran akan ditampilkan di bagian ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-[#faf8f4] text-xs font-semibold uppercase tracking-wide text-[#83776b]">
                      <tr>
                        <th scope="col" className="px-5 py-3.5 sm:px-6">Tanggal</th>
                        <th scope="col" className="px-5 py-3.5 sm:px-6">Kategori</th>
                        <th scope="col" className="px-5 py-3.5 text-right sm:px-6">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pengeluaran.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-[#f0ebe4] transition-colors hover:bg-[#fcfaf7]"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-[#78695b] sm:px-6">
                            {item.tanggal_pengeluaran}
                          </td>
                          <td className="px-5 py-4 font-medium text-[#493a30] sm:px-6">
                            {item.kategori}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-[#493a30] sm:px-6">
                            {formatRupiah(Number(item.jumlah))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="border-t border-[#e7dfd4] pt-5 text-center text-xs text-[#958879]">
          Laporan keuangan Puri Donut&apos;s · {new Date().getFullYear()}
        </footer>
      </div>
    </main>
  );
}
