
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ServiceNavigation from "../service-navigation";

type Laporan = {
  id: number;
  tanggal: string;
  pemasukan: number;
  pengeluaran: number;
  gaji: number;
  keterangan: string | null;
  created_at: string;
};

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const hariIni = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const tanggalIndonesia = (value: string) =>
  new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function LaporanPage() {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [tanggal, setTanggal] = useState(hariIni());
  const [pemasukan, setPemasukan] = useState("");
  const [pengeluaran, setPengeluaran] = useState("");
  const [gaji, setGaji] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState<"success" | "error">("success");

  const ambilLaporan = useCallback(async () => {
    const { data, error } = await supabase
      .from("laporan_keuangan")
      .select("*")
      .order("tanggal", { ascending: false });

    return {
      data: (data ?? []) as Laporan[],
      error: error?.message ?? null,
    };
  }, []);

  const muatLaporan = useCallback(async () => {
    setLoading(true);

    try {
      const hasil = await ambilLaporan();
      if (hasil.error) {
        setPesan("Gagal mengambil data: " + hasil.error);
        setJenisPesan("error");
      } else {
        setLaporan(hasil.data);
      }
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
      setPesan("Koneksi bermasalah saat mengambil data: " + detail);
      setJenisPesan("error");
    } finally {
      setLoading(false);
    }
  }, [ambilLaporan]);

  useEffect(() => {
    let aktif = true;

    async function muatAwal() {
      try {
        const hasil = await ambilLaporan();
        if (!aktif) return;

        if (hasil.error) {
          setPesan("Gagal mengambil data: " + hasil.error);
          setJenisPesan("error");
        } else {
          setLaporan(hasil.data);
        }
      } catch (error) {
        if (!aktif) return;
        const detail =
          error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
        setPesan("Koneksi bermasalah saat mengambil data: " + detail);
        setJenisPesan("error");
      } finally {
        if (aktif) setLoading(false);
      }
    }

    void muatAwal();
    return () => {
      aktif = false;
    };
  }, [ambilLaporan]);

  const totalPemasukan = laporan.reduce(
    (total, item) => total + Number(item.pemasukan || 0),
    0
  );

  const totalPengeluaran = laporan.reduce(
    (total, item) => total + Number(item.pengeluaran || 0),
    0
  );

  const totalGaji = laporan.reduce(
    (total, item) => total + Number(item.gaji || 0),
    0
  );

  const hasilBersih = totalPemasukan - totalPengeluaran - totalGaji;

  const pemasukanForm = Number(pemasukan) || 0;
  const pengeluaranForm = Number(pengeluaran) || 0;
  const gajiForm = Number(gaji) || 0;
  const hasilForm = pemasukanForm - pengeluaranForm - gajiForm;

  const tampilPesan = (
    teks: string,
    jenis: "success" | "error"
  ) => {
    setPesan(teks);
    setJenisPesan(jenis);
  };

  const resetForm = () => {
    setTanggal(hariIni());
    setPemasukan("");
    setPengeluaran("");
    setGaji("");
    setKeterangan("");
  };

  const simpanLaporan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPesan("");

    if (!tanggal) {
      tampilPesan("Tanggal laporan wajib diisi.", "error");
      return;
    }

    if (!pemasukan && !pengeluaran && !gaji) {
      tampilPesan("Isi minimal salah satu nominal laporan.", "error");
      return;
    }

    if (
      pemasukanForm < 0 ||
      pengeluaranForm < 0 ||
      gajiForm < 0
    ) {
      tampilPesan("Nominal tidak boleh negatif.", "error");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("laporan_keuangan")
      .insert({
        tanggal,
        pemasukan: pemasukanForm,
        pengeluaran: pengeluaranForm,
        gaji: gajiForm,
        keterangan: keterangan.trim() || null,
      });

    if (error) {
      tampilPesan("Gagal menyimpan laporan: " + error.message, "error");
    } else {
      resetForm();
      tampilPesan("Laporan berhasil disimpan.", "success");
      await muatLaporan();
    }

    setSaving(false);
  };

  const hapusLaporan = async (id: number) => {
    const yakin = window.confirm(
      "Apakah kamu yakin ingin menghapus laporan ini?"
    );

    if (!yakin) return;

    const { error } = await supabase
      .from("laporan_keuangan")
      .delete()
      .eq("id", id);

    if (error) {
      tampilPesan("Gagal menghapus laporan: " + error.message, "error");
    } else {
      tampilPesan("Laporan berhasil dihapus.", "success");
      await muatLaporan();
    }
  };

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#3d2c20]">
      <div className="mx-auto max-w-[1450px] px-4 py-5 sm:px-6 lg:px-9">

        <ServiceNavigation activeHref="/dashboard/laporan" />

        <section className="dashboard-enter relative isolate mt-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#38271f] via-[#5b3e2e] to-[#805a3d] px-6 py-8 text-white shadow-[0_26px_60px_-34px_rgba(54,34,23,0.65)] sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border-[32px] border-white/[0.06]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-48 h-56 w-56 rounded-full border border-white/[0.08]" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e7c9a4]">
                PURI DONUT&apos;S <span className="px-1 text-white/40">/</span>{" "}
                BUSINESS FINANCE
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Laporan Keuangan
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                Pantau catatan pemasukan, pengeluaran, dan hasil keuangan usaha dalam satu tempat.
              </p>
            </div>
            <a
              href="#form-laporan"
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#f2dfc8] px-5 py-3 text-sm font-bold text-[#4c3024] shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:self-auto motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span aria-hidden="true">＋</span>
              Buat laporan
            </a>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a07853]">
                At a glance
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#3d2c20]">
                Ringkasan Keuangan
              </h2>
              <p className="mt-1 text-xs text-[#8e7d6e]">
                Akumulasi dari seluruh laporan manual yang tersimpan
              </p>
            </div>

            <span className="rounded-full border border-[#e8ddd0] bg-white px-3.5 py-2 text-[11px] font-semibold text-[#76583f] shadow-sm">
              {laporan.length} laporan tersimpan
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Pemasukan"
              value={rupiah(totalPemasukan)}
              note="Akumulasi pemasukan"
              symbol="↗"
              color="green"
            />

            <SummaryCard
              title="Total Pengeluaran"
              value={rupiah(totalPengeluaran)}
              note="Akumulasi pengeluaran"
              symbol="↘"
              color="red"
            />

            <SummaryCard
              title="Total Gaji"
              value={rupiah(totalGaji)}
              note="Akumulasi pembayaran gaji"
              symbol="♙"
              color="orange"
            />

            <SummaryCard
              title="Hasil Bersih"
              value={rupiah(hasilBersih)}
              note="Pemasukan dikurangi biaya"
              symbol="◈"
              color="dark"
            />
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="mt-9 grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr]">

          {/* FORM */}
          <div id="form-laporan" className="dashboard-enter overflow-hidden rounded-[24px] border border-[#e8ddd0] bg-white shadow-[0_18px_48px_-34px_rgba(64,43,26,0.38)]">
            <div className="border-b border-[#eee5d9] bg-gradient-to-r from-[#fffdfa] to-[#f7f0e7] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eee2d3] text-lg font-semibold text-[#704b32]">
                  ＋
                </div>

                <div>
                  <h2 className="text-lg font-bold">Input Laporan</h2>
                  <p className="mt-0.5 text-xs text-[#8e7d6e]">
                    Manual entry · Masukkan catatan keuangan
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={simpanLaporan} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#59483a]">
                  Tanggal Laporan
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className="min-h-12 w-full rounded-xl border border-[#e8ddd0] bg-[#fcfaf7] px-4 py-3 text-sm outline-none transition duration-200 hover:border-[#cdb79b] focus:border-[#8c6241] focus:bg-white focus:ring-4 focus:ring-[#8c6241]/10"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputNominal
                  label="Pemasukan"
                  value={pemasukan}
                  onChange={setPemasukan}
                  placeholder="Contoh: 500000"
                />

                <InputNominal
                  label="Pengeluaran"
                  value={pengeluaran}
                  onChange={setPengeluaran}
                  placeholder="Contoh: 150000"
                />

                <div className="sm:col-span-2">
                  <InputNominal
                    label="Pengeluaran Gaji"
                    value={gaji}
                    onChange={setGaji}
                    placeholder="Contoh: 100000"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#55574f]">
                  Keterangan
                </label>
                <textarea
                  rows={3}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Tuliskan keterangan laporan..."
                  className="w-full resize-none rounded-xl border border-[#e8ddd0] bg-[#fcfaf7] px-4 py-3 text-sm outline-none transition duration-200 placeholder:text-[#a18d79] hover:border-[#cdb79b] focus:border-[#8c6241] focus:bg-white focus:ring-4 focus:ring-[#8c6241]/10"
                />
              </div>

              <div className="rounded-2xl border border-[#e9dfd2] bg-gradient-to-br from-[#faf6ef] to-[#f4ecdf] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#765f49]">
                      Hasil Bersih Laporan Ini
                    </p>
                    <p className="mt-1 text-[10px] text-[#9b8876]">
                      Pemasukan - Pengeluaran - Gaji
                    </p>
                  </div>

                  <p className={`text-lg font-bold tabular-nums ${hasilForm >= 0 ? "text-[#684b32]" : "text-[#9a6147]"}`}>
                    {rupiah(hasilForm)}
                  </p>
                </div>
              </div>

              {pesan && (
                <div
                  className={`rounded-xl px-4 py-3 text-xs font-medium ${
                    jenisPesan === "success"
                      ? "border border-[#d9e3d6] bg-[#f1f5ee] text-[#4e684b]"
                      : "border border-[#ead8cc] bg-[#fbf1eb] text-[#8a5039]"
                  }`}
                >
                  {pesan}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#4b3023] to-[#765039] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_-12px_rgba(74,48,36,0.75)] transition duration-200 hover:-translate-y-0.5 hover:from-[#593824] hover:to-[#805638] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70452d] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
                >
                  {saving ? "Menyimpan..." : "Simpan Laporan"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setPesan("");
                  }}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e3d8ca] bg-white px-5 py-3.5 text-sm font-semibold text-[#6b5544] transition duration-200 hover:border-[#cdb79b] hover:bg-[#faf7f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] motion-reduce:transition-none"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* SIDE PANEL */}
          <div className="space-y-5">
            <div className="dashboard-enter rounded-[24px] border border-[#e8ddd0] bg-white p-6 shadow-[0_18px_48px_-34px_rgba(64,43,26,0.38)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a07853]">
                    Financial Overview
                  </p>
                  <h2 className="mt-2 text-xl font-bold">
                    Kondisi Keuangan
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eee2d3] text-xl text-[#704b32]">
                  ◈
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-[#eee4d8] bg-[#faf7f2] p-5">
                <p className="text-xs font-medium text-[#806b55]">
                  Total Hasil Bersih
                </p>

                <p className={`mt-2 break-words text-2xl font-bold tabular-nums ${hasilBersih >= 0 ? "text-[#684b32]" : "text-[#9a6147]"}`}>
                  {rupiah(hasilBersih)}
                </p>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e8ddd0]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#80583c] to-[#c29b6b] transition-[width] duration-700 ease-out"
                    style={{
                      width: `${
                        totalPemasukan > 0
                          ? Math.min(
                              100,
                              Math.max(0, (hasilBersih / totalPemasukan) * 100)
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-[10px] text-[#998875]">
                  Perbandingan hasil bersih terhadap pemasukan
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <OverviewRow
                  label="Pemasukan"
                  value={rupiah(totalPemasukan)}
                  color="bg-[#80583c]"
                />
                <OverviewRow
                  label="Pengeluaran"
                  value={rupiah(totalPengeluaran)}
                  color="bg-[#b58561]"
                />
                <OverviewRow
                  label="Gaji"
                  value={rupiah(totalGaji)}
                  color="bg-[#d0ad7b]"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e8ddd0] bg-gradient-to-br from-[#f3eadc] to-[#e9ddca] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#80583c]">
                Informasi
              </p>

              <h3 className="mt-2 text-lg font-bold text-[#493426]">
                Catatan Keuangan
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#725d49]">
                Data laporan dimasukkan secara manual. Ringkasan
                keuangan akan diperbarui berdasarkan laporan yang
                berhasil disimpan.
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-[#d8c8b3] pt-4">
                <span className="text-xs text-[#806b55]">
                  Total laporan
                </span>
                <span className="text-sm font-bold text-[#493426]">
                  {laporan.length} data
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* HISTORY */}
        <section className="mt-9 overflow-hidden rounded-[24px] border border-[#e8ddd0] bg-white shadow-[0_18px_48px_-34px_rgba(64,43,26,0.38)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee5d9] bg-[#fffdfa] px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a07853]">
                Records
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Riwayat Laporan
              </h2>
              <p className="mt-1 text-xs text-[#8e7d6e]">
                Seluruh catatan keuangan yang sudah disimpan
              </p>
            </div>

            <button
              onClick={muatLaporan}
              disabled={loading}
              className="min-h-10 rounded-xl border border-[#e3d8ca] bg-white px-4 py-2.5 text-xs font-bold text-[#6b5544] transition duration-200 hover:border-[#cdb79b] hover:bg-[#faf7f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c6241] motion-reduce:transition-none"
            >
              {loading ? "Memuat..." : "↻ Perbarui Data"}
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-[#8e7d6e]">
              Memuat data laporan...
            </div>
          ) : laporan.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eee2d3] text-2xl text-[#704b32]">
                ▤
              </div>
              <h3 className="mt-4 font-bold text-[#493426]">
                Belum Ada Laporan
              </h3>
              <p className="mt-2 text-sm text-[#8e7d6e]">
                Data laporan yang sudah disimpan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-[#f7f0e7] text-[10px] uppercase tracking-[0.12em] text-[#806b55]">
                  <tr>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-5 py-4">Pemasukan</th>
                    <th className="px-5 py-4">Pengeluaran</th>
                    <th className="px-5 py-4">Gaji</th>
                    <th className="px-5 py-4">Hasil Bersih</th>
                    <th className="px-5 py-4">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {laporan.map((item) => {
                    const bersih =
                      Number(item.pemasukan) -
                      Number(item.pengeluaran) -
                      Number(item.gaji);

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-[#f0e9df] transition-colors hover:bg-[#fcfaf7]"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-[#493426]">
                            {tanggalIndonesia(item.tanggal)}
                          </p>
                          {item.keterangan && (
                            <p className="mt-1 max-w-[180px] truncate text-xs text-[#998875]">
                              {item.keterangan}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5 font-medium text-[#684b32]">
                          {rupiah(Number(item.pemasukan))}
                        </td>

                        <td className="px-5 py-5 font-medium text-[#9a6147]">
                          {rupiah(Number(item.pengeluaran))}
                        </td>

                        <td className="px-5 py-5 text-[#806b55]">
                          {rupiah(Number(item.gaji))}
                        </td>

                        <td className={`px-5 py-5 font-bold ${bersih >= 0 ? "text-[#684b32]" : "text-[#9a6147]"}`}>
                          {rupiah(bersih)}
                        </td>

                        <td className="px-5 py-5">
                          <button
                            onClick={() => hapusLaporan(item.id)}
                            className="min-h-9 rounded-lg border border-[#ead8cc] px-3 py-2 text-xs font-semibold text-[#8a5039] transition hover:bg-[#fbf1eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c6241] motion-reduce:transition-none"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-[#f0e9df] px-6 py-4">
            <p className="text-xs text-[#998875]">
              Menampilkan {laporan.length} laporan keuangan.
            </p>
          </div>
        </section>

        <footer className="py-8 text-center text-[11px] tracking-wide text-[#a18d79]">
          PURI DONUT&apos;S · FINANCIAL MANAGEMENT
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  note,
  symbol,
  color,
}: {
  title: string;
  value: string;
  note: string;
  symbol: string;
  color: "green" | "red" | "orange" | "dark";
}) {
  const colors = {
    green: {
      icon: "bg-[#eee2d3] text-[#704b32]",
      value: "text-[#684b32]",
      line: "bg-[#80583c]",
    },
    red: {
      icon: "bg-[#f3e7dd] text-[#9a6147]",
      value: "text-[#9a6147]",
      line: "bg-[#b58561]",
    },
    orange: {
      icon: "bg-[#f4ecdf] text-[#8b6744]",
      value: "text-[#80583c]",
      line: "bg-[#d0ad7b]",
    },
    dark: {
      icon: "bg-[#e9ddca] text-[#493426]",
      value: "text-[#493426]",
      line: "bg-[#493426]",
    },
  };

  const style = colors[color];

  return (
    <div className="group rounded-[22px] border border-[#e8ddd0] bg-white p-5 shadow-[0_12px_30px_-24px_rgba(64,43,26,0.5)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(64,43,26,0.5)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[#806b55]">
          {title}
        </p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${style.icon}`}>
          {symbol}
        </div>
      </div>

      <p className={`mt-5 break-words text-xl font-bold tracking-tight ${style.value}`}>
        {value}
      </p>

      <p className="mt-2 text-[10px] text-[#998875]">{note}</p>

      <div className={`mt-5 h-1 rounded-full ${style.line} opacity-70`} />
    </div>
  );
}

function InputNominal({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-[#59483a]">
        {label} (Rp)
      </label>

      <div className="flex overflow-hidden rounded-xl border border-[#e8ddd0] bg-[#fcfaf7] transition duration-200 focus-within:border-[#8c6241] focus-within:ring-4 focus-within:ring-[#8c6241]/10">
        <span className="flex items-center border-r border-[#e8ddd0] px-3 text-xs font-bold text-[#806b55]">
          Rp
        </span>

        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[#a18d79]"
        />
      </div>
    </div>
  );
}

function OverviewRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-xs font-medium text-[#806b55]">
          {label}
        </span>
      </div>

      <span className="text-xs font-bold text-[#493426]">
        {value}
      </span>
    </div>
  );
}
