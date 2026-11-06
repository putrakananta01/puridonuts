
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Barang = {
  id: number;
  nama: string;
  harga: string;
};

type Pengeluaran = {
  id: number;
  tanggal_pengeluaran: string;
  kategori: string;
  jumlah: number;
};

type Penjualan = {
  id: number;
  tanggal_penjualan: string;
  total_penjualan: number;
};

const kategoriPilihan = [
  "Bahan Baku",
  "Peralatan",
  "Kemasan",
  "Operasional",
  "Listrik & Air",
  "Transportasi",
  "Lainnya",
];

const rupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(angka) || 0);

function hariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function awalBulan() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

function formatTanggal(tanggal: string) {
  if (!tanggal) return "-";

  return new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function bacaDataPeriode(tanggalMulai: string, tanggalAkhir: string) {
  const [hasilPenjualan, hasilPengeluaran] = await Promise.all([
    supabase
      .from("penjualan")
      .select("id, tanggal_penjualan, total_penjualan")
      .gte("tanggal_penjualan", tanggalMulai)
      .lte("tanggal_penjualan", tanggalAkhir)
      .order("tanggal_penjualan", { ascending: false }),
    supabase
      .from("pengeluaran")
      .select("id, tanggal_pengeluaran, kategori, jumlah")
      .gte("tanggal_pengeluaran", tanggalMulai)
      .lte("tanggal_pengeluaran", tanggalAkhir)
      .order("tanggal_pengeluaran", { ascending: false }),
  ]);

  if (hasilPenjualan.error) {
    throw new Error(
      "Gagal mengambil data penjualan: " + hasilPenjualan.error.message
    );
  }

  if (hasilPengeluaran.error) {
    throw new Error(
      "Gagal mengambil data pengeluaran: " + hasilPengeluaran.error.message
    );
  }

  return {
    penjualan: hasilPenjualan.data || [],
    pengeluaran: hasilPengeluaran.data || [],
  };
}

export default function PengeluaranPage() {
  const [tanggal, setTanggal] = useState(hariIni());
  const [kategori, setKategori] = useState("Bahan Baku");

  const [tanggalMulai, setTanggalMulai] = useState(awalBulan());
  const [tanggalAkhir, setTanggalAkhir] = useState(hariIni());

  const [barang, setBarang] = useState<Barang[]>([
    { id: 1, nama: "", harga: "" },
  ]);
  const idBarangBerikutnya = useRef(2);

  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);

  const [loading, setLoading] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [pesan, setPesan] = useState("");

  const totalPembelian = barang.reduce(
    (total, item) => total + (Number(item.harga) || 0),
    0
  );

  const totalPengeluaran = pengeluaran.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  );

  const totalPenjualan = penjualan.reduce(
    (total, item) => total + Number(item.total_penjualan || 0),
    0
  );

  const labaRugi = totalPenjualan - totalPengeluaran;

  async function ambilData() {
    if (tanggalMulai > tanggalAkhir) {
      setPesan("Tanggal awal tidak boleh melebihi tanggal akhir.");
      setMemuat(false);
      return;
    }

    setMemuat(true);
    setPesan("");

    try {
      const data = await bacaDataPeriode(tanggalMulai, tanggalAkhir);
      setPenjualan(data.penjualan);
      setPengeluaran(data.pengeluaran);
    } catch (error) {
      setPesan(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data keuangan."
      );
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    if (tanggalMulai > tanggalAkhir) return;

    let masihAktif = true;

    async function muatDataPeriode() {
      try {
        const data = await bacaDataPeriode(tanggalMulai, tanggalAkhir);
        if (!masihAktif) return;
        setPenjualan(data.penjualan);
        setPengeluaran(data.pengeluaran);
        setPesan("");
      } catch (error) {
        if (!masihAktif) return;
        setPesan(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengambil data keuangan."
        );
      } finally {
        if (masihAktif) setMemuat(false);
      }
    }

    void muatDataPeriode();

    return () => {
      masihAktif = false;
    };
  }, [tanggalMulai, tanggalAkhir]);

  function tambahBarang() {
    const id = idBarangBerikutnya.current;
    idBarangBerikutnya.current += 1;
    setBarang((sebelumnya) => [
      ...sebelumnya,
      {
        id,
        nama: "",
        harga: "",
      },
    ]);
  }

  function hapusBarang(id: number) {
    if (barang.length === 1) {
      setPesan("Minimal harus ada satu barang.");
      return;
    }

    setBarang((sebelumnya) =>
      sebelumnya.filter((item) => item.id !== id)
    );

    setPesan("");
  }

  function ubahBarang(
    id: number,
    field: "nama" | "harga",
    nilai: string
  ) {
    setBarang((sebelumnya) =>
      sebelumnya.map((item) =>
        item.id === id ? { ...item, [field]: nilai } : item
      )
    );
  }

  async function simpanPembelian(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setPesan("");

    if (!tanggal) {
      setPesan("Tanggal pembelian harus diisi.");
      return;
    }

    if (
      barang.some(
        (item) =>
          !item.nama.trim() ||
          !item.harga ||
          !Number.isFinite(Number(item.harga)) ||
          Number(item.harga) <= 0
      )
    ) {
      setPesan("Lengkapi nama dan harga setiap barang.");
      return;
    }

    if (totalPembelian <= 0) {
      setPesan("Total pembelian harus lebih dari nol.");
      return;
    }

    const rincian = barang
      .map(
        (item) =>
          `${item.nama.trim()} (${rupiah(Number(item.harga))})`
      )
      .join(", ");

    setLoading(true);

    const { error } = await supabase.from("pengeluaran").insert([
      {
        tanggal_pengeluaran: tanggal,
        kategori: `${kategori}: ${rincian}`,
        jumlah: totalPembelian,
      },
    ]);

    if (error) {
      setPesan("Gagal menyimpan pembelian: " + error.message);
      setLoading(false);
      return;
    }

    const idBarangBaru = idBarangBerikutnya.current;
    idBarangBerikutnya.current += 1;
    setBarang([{ id: idBarangBaru, nama: "", harga: "" }]);
    setTanggal(hariIni());
    setKategori("Bahan Baku");
    setFormTerbuka(false);
    setPesan("Pembelian berhasil disimpan.");

    await ambilData();
    setLoading(false);
  }

  async function hapusPengeluaran(id: number) {
    const yakin = window.confirm(
      "Apakah kamu yakin ingin menghapus nota pembelian ini?"
    );

    if (!yakin) return;

    const { error } = await supabase
      .from("pengeluaran")
      .delete()
      .eq("id", id);

    if (error) {
      setPesan("Gagal menghapus: " + error.message);
      return;
    }

    setPesan("Nota pembelian berhasil dihapus.");
    await ambilData();
  }

  function cetakLaporan() {
    window.print();
  }

  return (
    <div className="dashboard-background min-h-screen overflow-hidden text-[#39291f]">

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            background: white !important;
            color: #222 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            display: block !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          .print-area table {
            width: 100%;
            border-collapse: collapse;
          }

          .print-area th,
          .print-area td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 11px;
          }

          .print-area th {
            background: #f1eee9 !important;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="no-print sticky top-0 z-30 border-b border-[#eadfce]/80 bg-white/85 shadow-[0_8px_24px_-22px_rgba(64,43,26,0.5)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <Link href="/dashboard" className="group flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8d6242] to-[#563721] text-lg font-bold text-white shadow-md shadow-[#795238]/20 transition duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:h-11 sm:w-11">
              P
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-wide sm:text-base">
                PURI DONUT&apos;S
              </h1>
              <p className="hidden text-[10px] tracking-[0.2em] text-[#a4774d] sm:block">
                FINANCIAL MANAGEMENT
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            aria-label="Kembali ke Dashboard"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#eadfd3] bg-white/90 p-2 pr-3 text-sm font-semibold text-[#62452f] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#cdb69d] hover:bg-[#fcfaf7] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#a96732] motion-reduce:transform-none sm:gap-3 sm:pr-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5ede3] text-[#795238] transition-colors group-hover:bg-[#795238] group-hover:text-white">
              <svg
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </span>
            <span className="hidden sm:inline">Kembali ke Dashboard</span>
          </Link>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">

        {/* JUDUL */}
        <section className="no-print dashboard-enter relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#37251d] via-[#563721] to-[#80583d] px-5 py-7 text-white shadow-[0_24px_60px_-34px_rgba(64,43,26,0.7)] sm:mb-8 sm:px-8 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10 bg-white/[0.04] sm:h-80 sm:w-80" />
          <div className="pointer-events-none absolute -bottom-28 right-24 h-52 w-52 rounded-full border border-[#e7c68e]/15" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f0d7b3] backdrop-blur-sm sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e7c68e] shadow-[0_0_10px_2px_rgba(231,198,142,0.45)]" />
              Manajemen keuangan
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Pengeluaran
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Catat pembelian dan pantau arus biaya usaha dengan lebih rapi.
            </p>
          </div>
        </section>

        {/* FILTER PERIODE */}
        <section className="no-print dashboard-enter dashboard-card mb-5 rounded-2xl border border-[#eadfce]/90 bg-white/90 p-4 shadow-[0_12px_34px_-26px_rgba(64,43,26,0.36)] sm:mb-6 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5ede3] text-[#795238]">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
                <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" />
              </svg>
            </span>
            <div>
              <h3 className="font-bold">Periode keuangan</h3>
              <p className="mt-1 text-xs leading-5 text-[#88796e] sm:text-sm">
              Pilih periode untuk melihat ringkasan keuangan.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-semibold text-[#695544]">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => {
                  const nilai = e.target.value;
                  setTanggalMulai(nilai);
                  if (nilai > tanggalAkhir) {
                    setPesan("Tanggal awal tidak boleh melebihi tanggal akhir.");
                    setMemuat(false);
                  } else {
                    setPesan("");
                    setMemuat(true);
                  }
                }}
                className="w-full rounded-xl border border-[#e5d8c8] bg-[#fffdfa] px-3 py-3 text-sm outline-none transition focus:border-[#9b7049] focus:ring-4 focus:ring-[#9b7049]/10 sm:px-4"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-[#695544]">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={tanggalAkhir}
                onChange={(e) => {
                  const nilai = e.target.value;
                  setTanggalAkhir(nilai);
                  if (tanggalMulai > nilai) {
                    setPesan("Tanggal awal tidak boleh melebihi tanggal akhir.");
                    setMemuat(false);
                  } else {
                    setPesan("");
                    setMemuat(true);
                  }
                }}
                className="w-full rounded-xl border border-[#e5d8c8] bg-[#fffdfa] px-3 py-3 text-sm outline-none transition focus:border-[#9b7049] focus:ring-4 focus:ring-[#9b7049]/10 sm:px-4"
              />
            </div>

            <button
              type="button"
              onClick={ambilData}
              disabled={memuat}
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#795238]/20 bg-[#f8f3ec] px-5 py-3 text-sm font-semibold text-[#67452e] transition duration-200 hover:-translate-y-0.5 hover:border-[#795238]/40 hover:bg-[#f1e7d8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none"
            >
              <svg aria-hidden="true" className={`h-4 w-4 ${memuat ? "animate-spin" : "transition-transform duration-300 group-hover:rotate-180"}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M20 7v5h-5M4 17v-5h5" />
                <path d="M5.6 9A7 7 0 0 1 17.5 6L20 12M4 12l2.5 6A7 7 0 0 0 18.4 15" />
              </svg>
              {memuat ? "Memuat..." : "Perbarui data"}
            </button>
          </div>
        </section>

        {/* RINGKASAN */}
        <section className="no-print mb-5 grid gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">

          <div className="dashboard-enter dashboard-card rounded-2xl border border-[#eadfce]/90 bg-white/90 p-5 shadow-[0_12px_34px_-26px_rgba(64,43,26,0.36)] sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#88796e]">
                Total Penjualan
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5ed] text-[#4c8059]">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </span>
            </div>

            <h3 className="mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl">
              {memuat ? "Memuat..." : rupiah(totalPenjualan)}
            </h3>

            <p className="mt-2 text-xs text-[#88796e]">
              {penjualan.length} transaksi penjualan
            </p>
          </div>

          <div className="dashboard-enter dashboard-card rounded-2xl border border-[#eadfce]/90 bg-white/90 p-5 shadow-[0_12px_34px_-26px_rgba(64,43,26,0.36)] sm:p-6" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#88796e]">
                Total Pengeluaran
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fbefea] text-[#a15b3c]">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="m7 7 10 10M8 17h9V8" />
                </svg>
              </span>
            </div>

            <h3 className="mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl">
              {memuat ? "Memuat..." : rupiah(totalPengeluaran)}
            </h3>

            <p className="mt-2 text-xs text-[#88796e]">
              {pengeluaran.length} nota pembelian
            </p>
          </div>

          <div className="dashboard-enter dashboard-card rounded-2xl border border-[#eadfce]/90 bg-white/90 p-5 shadow-[0_12px_34px_-26px_rgba(64,43,26,0.36)] sm:col-span-2 sm:p-6 xl:col-span-1" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#88796e]">
                {labaRugi >= 0 ? "Selisih Positif" : "Selisih Negatif"}
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5ede3] text-[#795238]">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
                  <path d="M12 3.5 14.6 9l5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3.5Z" />
                </svg>
              </span>
            </div>

            <h3
              className={`mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl ${
                labaRugi >= 0 ? "text-green-700" : "text-red-600"
              }`}
            >
              {memuat ? "Memuat..." : rupiah(Math.abs(labaRugi))}
            </h3>

            <p className="mt-2 text-xs text-[#88796e]">
              {labaRugi >= 0
                ? "Penjualan lebih besar dari pengeluaran"
                : "Pengeluaran lebih besar dari penjualan"}
            </p>
          </div>
        </section>

        {/* TOMBOL PEMBELIAN */}
        <section className="no-print dashboard-enter dashboard-card mb-5 rounded-2xl border border-[#eadfce]/90 bg-white/90 p-4 shadow-[0_12px_34px_-26px_rgba(64,43,26,0.36)] sm:mb-6 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5ede3] text-[#795238]">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
                  <path d="M4 7.5h16M6.5 4v3.5M17.5 4v3.5M5 10.5h14v9H5z" />
                  <path d="M8 14h3M8 17h6" />
                </svg>
              </span>
              <div>
                <h3 className="text-lg font-bold">Catatan pembelian</h3>
                <p className="mt-1 max-w-lg text-sm leading-5 text-[#88796e]">
                  Masukkan beberapa barang dalam satu nota pembelian.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={formTerbuka}
              onClick={() => {
                setFormTerbuka(!formTerbuka);
                setPesan("");
              }}
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#795238] to-[#5c3c29] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-10px_rgba(64,43,26,0.75)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-10px_rgba(64,43,26,0.65)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#a96732] active:translate-y-0 sm:w-auto motion-reduce:transform-none"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 transition-transform duration-300 ${formTerbuka ? "rotate-45" : "group-hover:scale-110"}`}>
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              {formTerbuka ? "Tutup formulir" : "Catat pembelian"}
            </button>
          </div>

          {formTerbuka && (
            <form onSubmit={simpanPembelian} className="dashboard-enter mt-6 border-t border-[#eee5da] pt-6 sm:mt-7 sm:pt-7">

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#695544]">
                    Tanggal Pembelian
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#e5d8c8] bg-[#fffdfa] px-4 py-3 text-sm outline-none transition focus:border-[#9b7049] focus:ring-4 focus:ring-[#9b7049]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#695544]">
                    Kategori Pembelian
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full rounded-xl border border-[#e5d8c8] bg-[#fffdfa] px-4 py-3 text-sm outline-none transition focus:border-[#9b7049] focus:ring-4 focus:ring-[#9b7049]/10"
                  >
                    {kategoriPilihan.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold">Daftar Barang</h4>
                  <p className="mt-1 text-xs text-[#88796e]">
                    Isi nama barang dan harga totalnya.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={tambahBarang}
                  className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d9c5af] bg-white px-4 py-2 text-sm font-semibold text-[#67452e] transition duration-200 hover:-translate-y-0.5 hover:border-[#a4774d] hover:bg-[#fbf7f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] motion-reduce:transform-none"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f5ede3] text-[#795238] transition-colors group-hover:bg-[#795238] group-hover:text-white">
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  Tambah barang
                </button>
              </div>

              <div className="space-y-3">
                {barang.map((item, index) => (
                  <div
                    key={item.id}
                    className="dashboard-enter rounded-2xl border border-[#eadfce] bg-[#fcfaf7] p-4 transition-colors hover:border-[#d7bea5] sm:p-5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-[#513a2b]">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0e5d5] text-xs text-[#795238]">
                          {index + 1}
                        </span>
                        Rincian barang
                      </span>

                      <button
                        type="button"
                        aria-label={`Hapus barang ${index + 1}`}
                        onClick={() => hapusBarang(item.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#a34c3b] transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3" />
                        </svg>
                        Hapus
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Nama barang, misalnya tepung terigu"
                        value={item.nama}
                        aria-label={`Nama barang ${index + 1}`}
                        onChange={(e) =>
                          ubahBarang(item.id, "nama", e.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-[#e5d8c8] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b5a797] focus:border-[#9b7049] focus:ring-4 focus:ring-[#9b7049]/10"
                      />

                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Harga total barang"
                        value={item.harga}
                        aria-label={`Harga barang ${index + 1}`}
                        onChange={(e) =>
                          ubahBarang(item.id, "harga", e.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-[#e5d8c8] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b5a797] focus:border-[#9b7049] focus:ring-4 focus:ring-[#9b7049]/10"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-[#eadfce] bg-gradient-to-br from-[#faf6ef] to-[#f2e9dd] p-4 sm:p-5">
                <p className="text-xs text-[#88796e]">
                  Jumlah jenis barang: {barang.length}
                </p>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-bold">Total Pembelian</span>
                  <span className="text-xl font-bold text-[#795238]">
                    {rupiah(totalPembelian)}
                  </span>
                </div>
              </div>

              {pesan && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {pesan}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#795238] to-[#5c3c29] px-5 py-3 font-bold text-white shadow-[0_8px_18px_-10px_rgba(64,43,26,0.75)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-10px_rgba(64,43,26,0.65)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#a96732] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none"
              >
                {loading ? (
                  <>
                    <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-80" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                    Simpan nota pembelian
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* PESAN */}
        {pesan && !formTerbuka && (
          <div role="status" className="no-print dashboard-enter mb-5 rounded-xl border border-[#e7d8c5] bg-[#f8f2e9] p-4 text-sm text-[#795238]">
            {pesan}
          </div>
        )}

        {/* RIWAYAT PENGELUARAN */}
        <section className="no-print dashboard-enter mb-5 rounded-2xl border border-[#eadfce]/90 bg-white/90 p-4 shadow-[0_12px_34px_-26px_rgba(64,43,26,0.36)] sm:mb-6 sm:p-6">
          <div className="mb-5 flex items-start gap-3 sm:mb-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5ede3] text-[#795238]">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
                <path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v12H3.5V7A1.5 1.5 0 0 1 5 5.5Z" />
                <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M7.5 14h2M12 14h2M7.5 17h2M12 17h2" />
              </svg>
            </span>
            <div>
            <h3 className="text-lg font-bold">
              Riwayat Pengeluaran
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#88796e] sm:text-sm">
              Daftar pembelian berdasarkan periode yang dipilih.
            </p>
            </div>
          </div>

          {memuat ? (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-[#88796e]" role="status">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d9c5af] border-t-[#795238]" />
              Memuat data...
            </div>
          ) : pengeluaran.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dfd0bd] bg-[#fcfaf7] px-5 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3eadf] text-[#8b6b4c]">
                <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24">
                  <path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v12H3.5V7A1.5 1.5 0 0 1 5 5.5Z" />
                  <path d="M8 11h8M8 15h5" />
                </svg>
              </span>
              <p className="mt-3 text-sm font-semibold text-[#513a2b]">
                Belum ada pengeluaran
              </p>
              <p className="mt-1 text-xs text-[#88796e]">
                Nota pembelian pada periode ini akan muncul di sini.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {pengeluaran.map((item, index) => (
                  <article key={item.id} className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] p-4 shadow-[0_8px_24px_-22px_rgba(64,43,26,0.5)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5ede3] text-xs font-bold text-[#795238]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#88796e]">
                            {formatTanggal(item.tanggal_pengeluaran)}
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold leading-5 text-[#513a2b]">
                            {item.kategori}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => hapusPengeluaran(item.id)}
                        aria-label={`Hapus nota pembelian ${formatTanggal(item.tanggal_pengeluaran)}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#a34c3b] transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#f0e9df] pt-3">
                      <span className="text-xs text-[#88796e]">Total nota</span>
                      <strong className="text-sm text-[#795238]">
                        {rupiah(Number(item.jumlah))}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border border-[#eee5da] md:block">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eadfce] bg-[#fcfaf7] text-xs uppercase tracking-wide text-[#88796e]">
                    <th className="px-3 py-4">No.</th>
                    <th className="px-3 py-4">Tanggal</th>
                    <th className="px-3 py-4">Rincian Pembelian</th>
                    <th className="px-3 py-4 text-right">Jumlah</th>
                    <th className="px-3 py-4 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {pengeluaran.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f0e9df] transition-colors last:border-0 hover:bg-[#fcfaf7]"
                    >
                      <td className="px-3 py-4">{index + 1}</td>

                      <td className="px-3 py-4">
                        {formatTanggal(item.tanggal_pengeluaran)}
                      </td>

                      <td className="max-w-[350px] px-3 py-4">
                        {item.kategori}
                      </td>

                      <td className="px-3 py-4 text-right font-semibold">
                        {rupiah(Number(item.jumlah))}
                      </td>

                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => hapusPengeluaran(item.id)}
                          aria-label={`Hapus nota pembelian ${formatTanggal(item.tanggal_pengeluaran)}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#a34c3b] transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3" />
                          </svg>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>

        {/* LAPORAN LABA RUGI */}
        <section className="print-area rounded-2xl border border-[#eadfce] bg-white p-4 shadow-[0_12px_34px_-26px_rgba(64,43,26,0.36)] sm:p-6 md:p-8">

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#a4774d]">
                PURI DONUT&apos;S
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Laporan Laba Rugi
              </h2>

              <p className="mt-2 text-sm text-[#88796e]">
                Periode {formatTanggal(tanggalMulai)} sampai{" "}
                {formatTanggal(tanggalAkhir)}
              </p>
            </div>

            <button
              type="button"
              onClick={cetakLaporan}
              disabled={memuat}
              className="no-print inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#795238] to-[#5c3c29] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-10px_rgba(64,43,26,0.75)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#a96732] disabled:cursor-wait disabled:opacity-60 sm:w-auto motion-reduce:transform-none"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
                <path d="M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
                <path d="M7 14h10v6H7zM17 12h.01" />
              </svg>
              Print / Cetak PDF
            </button>
          </div>

          <div className="mb-6 border-t border-[#eadfce] pt-5">
            <h3 className="mb-5 font-bold">Ringkasan Keuangan</h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between gap-3">
                <span>Total Pemasukan Penjualan</span>
                <strong>{rupiah(totalPenjualan)}</strong>
              </div>

              <div className="flex justify-between gap-3">
                <span>Total Pengeluaran</span>
                <strong>{rupiah(totalPengeluaran)}</strong>
              </div>

              <div className="border-t border-dashed border-[#d9cbb9] pt-4">
                <div className="flex justify-between gap-3 text-base font-bold">
                  <span>
                    {labaRugi >= 0 ? "Selisih Positif" : "Selisih Negatif"}
                  </span>

                  <span
                    className={
                      labaRugi >= 0 ? "text-green-700" : "text-red-600"
                    }
                  >
                    {rupiah(Math.abs(labaRugi))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-7">
            <h3 className="mb-3 font-bold">Rincian Penjualan</h3>

            {penjualan.length === 0 ? (
              <p className="text-sm text-[#88796e]">
                Tidak ada penjualan pada periode ini.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#eee5da]">
              <table className="w-full min-w-[380px] text-left text-sm">
                <thead>
                  <tr className="bg-[#f8f5ef]">
                    <th className="px-3 py-3">Tanggal</th>
                    <th className="px-3 py-3 text-right">
                      Total Penjualan
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {penjualan.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#eee5da]"
                    >
                      <td className="px-3 py-3">
                        {formatTanggal(item.tanggal_penjualan)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {rupiah(Number(item.total_penjualan))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-3 font-bold">Rincian Pengeluaran</h3>

            {pengeluaran.length === 0 ? (
              <p className="text-sm text-[#88796e]">
                Tidak ada pengeluaran pada periode ini.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#eee5da]">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="bg-[#f8f5ef]">
                    <th className="px-3 py-3">Tanggal</th>
                    <th className="px-3 py-3">Keterangan</th>
                    <th className="px-3 py-3 text-right">Jumlah</th>
                  </tr>
                </thead>

                <tbody>
                  {pengeluaran.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#eee5da]"
                    >
                      <td className="px-3 py-3">
                        {formatTanggal(item.tanggal_pengeluaran)}
                      </td>
                      <td className="px-3 py-3">{item.kategori}</td>
                      <td className="px-3 py-3 text-right">
                        {rupiah(Number(item.jumlah))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-[#eadfce] pt-4 text-xs leading-6 text-[#88796e]">
            <p>
              Laporan ini dibuat otomatis berdasarkan data transaksi
              penjualan dan pengeluaran yang tercatat di sistem.
            </p>
            <p>
              Dicetak pada: {new Date().toLocaleString("id-ID")}
            </p>
            <p className="mt-2">
              Catatan: hasil perhitungan merupakan penjualan dikurangi
              pengeluaran yang tercatat, belum memperhitungkan seluruh
              komponen HPP, pajak, dan penyusutan.
            </p>
          </div>
        </section>

        <footer className="no-print py-8 text-center text-xs text-[#a18e7d]">
          &copy; {new Date().getFullYear()} Puri Donut&apos;s Financial Management
        </footer>

      </main>
    </div>
  );
}
