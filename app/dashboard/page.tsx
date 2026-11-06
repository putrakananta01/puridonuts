
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAccountPreferences } from "./preferences-provider";
import ServiceNavigation from "./service-navigation";

type Periode = "hari" | "bulan" | "tahun";

type Transaksi = {
  id: string;
  tanggal: string;
  jenis: "Pemasukan" | "Pengeluaran" | "Gaji";
  keterangan: string;
  jumlah: number;
};

type GrafikItem = {
  label: string;
  pemasukan: number;
  pengeluaran: number;
};

const BULAN = [
  "Januari", "Februari", "Maret", "April",
  "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember",
];

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (value: string) =>
  new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function DashboardPage() {
  const router = useRouter();
  const { formatCurrency } = useAccountPreferences();

  const sekarang = new Date();

  const [nama, setNama] = useState("Administrator");
  const [nickname, setNickname] = useState("Administrator");
  const [email, setEmail] = useState("");
  const [foto, setFoto] = useState("");
  const [bukaProfil, setBukaProfil] = useState(false);

  const [periode, setPeriode] = useState<Periode>("bulan");
  const [bulanDipilih, setBulanDipilih] = useState(sekarang.getMonth());
  const [tahunDipilih, setTahunDipilih] = useState(sekarang.getFullYear());

  const [penjualan, setPenjualan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [totalGaji, setTotalGaji] = useState(0);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [grafik, setGrafik] = useState<GrafikItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorData, setErrorData] = useState("");

  const namaBulan = BULAN[bulanDipilih];
  const totalBiaya = pengeluaran + totalGaji;
  const selisih = penjualan - totalBiaya;
  const margin = penjualan > 0 ? (selisih / penjualan) * 100 : 0;

  const tahunSekarang = new Date().getFullYear();
  const daftarTahun = Array.from(
    { length: 6 },
    (_, i) => tahunSekarang - i
  );

  const periodeLabel =
    periode === "hari"
      ? "Hari ini"
      : periode === "bulan"
        ? `${namaBulan} ${tahunDipilih}`
        : `Tahun ${tahunDipilih}`;

  const ambilData = useCallback(async () => {
    setLoading(true);
    setErrorData("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      setEmail(authData.user.email ?? "");

      const { data: profil } = await supabase
        .from("profiles")
        .select("nama")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profil?.nama) {
        setNama(profil.nama);
        setNickname(profil.nama);
      }

      let awal: Date;
      let akhir: Date;

      if (periode === "hari") {
        awal = new Date();
        akhir = new Date();
      } else if (periode === "bulan") {
        awal = new Date(tahunDipilih, bulanDipilih, 1);
        akhir = new Date(tahunDipilih, bulanDipilih + 1, 0);
      } else {
        awal = new Date(tahunDipilih, 0, 1);
        akhir = new Date(tahunDipilih, 11, 31);
      }

      const tanggalAwal = formatDate(awal);
      const tanggalAkhir = formatDate(akhir);

      const [jual, biaya, gaji] = await Promise.all([
        supabase
          .from("penjualan")
          .select("tanggal_penjualan,total_penjualan")
          .gte("tanggal_penjualan", tanggalAwal)
          .lte("tanggal_penjualan", tanggalAkhir),

        supabase
          .from("pengeluaran")
          .select("tanggal_pengeluaran,kategori,jumlah")
          .gte("tanggal_pengeluaran", tanggalAwal)
          .lte("tanggal_pengeluaran", tanggalAkhir),

        supabase
          .from("pembayaran_gaji")
          .select("tanggal_pembayaran,jumlah_gaji")
          .gte("tanggal_pembayaran", tanggalAwal)
          .lte("tanggal_pembayaran", tanggalAkhir),
      ]);

      const errors = [
        jual.error && `Penjualan: ${jual.error.message}`,
        biaya.error && `Pengeluaran: ${biaya.error.message}`,
        gaji.error && `Gaji: ${gaji.error.message}`,
      ].filter(Boolean);

      if (errors.length) setErrorData(errors.join(" | "));

      const dataJual = jual.data ?? [];
      const dataBiaya = biaya.data ?? [];
      const dataGaji = gaji.data ?? [];

      const totalJual = dataJual.reduce(
        (sum, item) => sum + Number(item.total_penjualan || 0),
        0
      );

      const totalPengeluaran = dataBiaya.reduce(
        (sum, item) => sum + Number(item.jumlah || 0),
        0
      );

      const totalPembayaranGaji = dataGaji.reduce(
        (sum, item) => sum + Number(item.jumlah_gaji || 0),
        0
      );

      setPenjualan(totalJual);
      setPengeluaran(totalPengeluaran);
      setTotalGaji(totalPembayaranGaji);

      const daftarTransaksi: Transaksi[] = [
        ...dataJual.map((item, i) => ({
          id: `jual-${i}`,
          tanggal: String(item.tanggal_penjualan),
          jenis: "Pemasukan" as const,
          keterangan: "Penjualan produk",
          jumlah: Number(item.total_penjualan || 0),
        })),
        ...dataBiaya.map((item, i) => ({
          id: `biaya-${i}`,
          tanggal: String(item.tanggal_pengeluaran),
          jenis: "Pengeluaran" as const,
          keterangan: item.kategori || "Biaya operasional",
          jumlah: Number(item.jumlah || 0),
        })),
        ...dataGaji.map((item, i) => ({
          id: `gaji-${i}`,
          tanggal: String(item.tanggal_pembayaran),
          jenis: "Gaji" as const,
          keterangan: "Pembayaran gaji karyawan",
          jumlah: Number(item.jumlah_gaji || 0),
        })),
      ];

      daftarTransaksi.sort((a, b) =>
        b.tanggal.localeCompare(a.tanggal)
      );

      setTransaksi(daftarTransaksi.slice(0, 8));

      // Grafik bulanan: satu batang untuk setiap tanggal.
      // Grafik tahunan: satu batang untuk setiap bulan.
      const jumlahTitik =
        periode === "tahun"
          ? 12
          : periode === "hari"
            ? 1
            : new Date(tahunDipilih, bulanDipilih + 1, 0).getDate();

      const hasilGrafik: GrafikItem[] = Array.from(
        { length: jumlahTitik },
        (_, i) => ({
          label:
            periode === "tahun"
              ? BULAN[i].slice(0, 3)
              : periode === "hari"
                ? "Hari ini"
                : String(i + 1),
          pemasukan: 0,
          pengeluaran: 0,
        })
      );

      const masukkanGrafik = (
        tanggal: string,
        jenis: "pemasukan" | "pengeluaran",
        jumlah: number
      ) => {
        const date = new Date(tanggal + "T00:00:00");
        let index = 0;

        if (periode === "tahun") {
          index = date.getMonth();
        } else if (periode === "bulan") {
          index = date.getDate() - 1;
        }

        if (hasilGrafik[index]) {
          hasilGrafik[index][jenis] += jumlah;
        }
      };

      dataJual.forEach((item) =>
        masukkanGrafik(
          String(item.tanggal_penjualan),
          "pemasukan",
          Number(item.total_penjualan || 0)
        )
      );

      dataBiaya.forEach((item) =>
        masukkanGrafik(
          String(item.tanggal_pengeluaran),
          "pengeluaran",
          Number(item.jumlah || 0)
        )
      );

      dataGaji.forEach((item) =>
        masukkanGrafik(
          String(item.tanggal_pembayaran),
          "pengeluaran",
          Number(item.jumlah_gaji || 0)
        )
      );

      setGrafik(hasilGrafik);
    } catch (error) {
      console.error(error);
      setErrorData("Terjadi kesalahan saat memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }, [periode, bulanDipilih, tahunDipilih, router]);

  useEffect(() => {
    void ambilData();
  }, [ambilData]);

  const maksimumGrafik = Math.max(
    1,
    ...grafik.flatMap((item) => [
      item.pemasukan,
      item.pengeluaran,
    ])
  );

  const totalAktivitas = transaksi.length;

  function pilihFoto(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Pilih file gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2 MB.");
      return;
    }

    setFoto((lama) => {
      if (lama.startsWith("blob:")) URL.revokeObjectURL(lama);
      return URL.createObjectURL(file);
    });
  }

  const tanggalSekarang = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    []
  );

  return (
    <main className="min-h-screen bg-[#f5f2ec] px-4 py-5 text-[#35271f] sm:px-7 sm:py-7">
      <ServiceNavigation activeHref="/dashboard" />

      <div className="mx-auto max-w-[1450px] space-y-7">

        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4 pr-14">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#a47e5c]">
              PURI DONUT'S · FINANCIAL STUDIO
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Dashboard<span className="text-[#b77b51]">.</span>
            </h1>
            <p className="mt-2 text-sm text-[#918274]">{tanggalSekarang}</p>
          </div>

          <button
            onClick={() => setBukaProfil(true)}
            className="flex items-center gap-3 rounded-2xl border border-[#e9e0d5] bg-white p-2 pr-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {foto ? (
              <Image
                src={foto}
                alt="Foto profil"
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 rounded-xl object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0e1d0] font-bold text-[#70452d]">
                {nickname.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-left">
              <span className="block text-sm font-bold">{nickname}</span>
              <span className="block text-xs text-[#a18b77]">Administrator</span>
            </span>
          </button>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[30px] bg-[#35251e] p-7 text-white shadow-xl sm:p-9">
          <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[42px] border-[#e5b986]/10" />
          <div className="absolute bottom-0 right-20 h-36 w-36 rounded-full bg-[#c58b62]/10 blur-3xl" />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d8b58a]/30 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9c99f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b9d59c]" />
              Owner Workspace
            </span>

            <p className="mt-5 text-sm italic text-[#e3c39d]">
              “Small steps, sweet progress.”
            </p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Hello, {nickname}!
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-white/70">
              Semua aktivitas keuangan Puri Donut's dalam satu tempat.
              Tetap terarah, pantau perkembangan, dan kelola usaha dengan mudah.
            </p>

          </div>
          <span className="pointer-events-none absolute bottom-3 right-8 hidden text-8xl text-[#e9c18f]/20 md:block">
            ✳
          </span>
        </section>

        {/* PERIODE */}
        <section className="flex flex-col gap-4 rounded-[24px] border border-[#e9e0d5] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47e5c]">
              Monthly Performance
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">
              {periode === "hari"
                ? "Hari Ini"
                : periode === "bulan"
                  ? `${namaBulan} ${tahunDipilih}`
                  : `Tahun ${tahunDipilih}`}
            </h2>
            <p className="mt-1 text-xs text-[#9b8d7e]">
              Ringkasan performa keuangan usaha
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value as Periode)}
              className="rounded-xl border border-[#e9e0d5] bg-[#faf8f4] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#b77b51]"
            >
              <option value="hari">Harian</option>
              <option value="bulan">Bulanan</option>
              <option value="tahun">Tahunan</option>
            </select>

            {periode !== "hari" && (
              <select
                value={tahunDipilih}
                onChange={(e) => setTahunDipilih(Number(e.target.value))}
                className="rounded-xl border border-[#e9e0d5] bg-[#faf8f4] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#b77b51]"
              >
                {daftarTahun.map((tahun) => (
                  <option key={tahun} value={tahun}>{tahun}</option>
                ))}
              </select>
            )}

            {periode === "bulan" && (
              <select
                value={bulanDipilih}
                onChange={(e) => setBulanDipilih(Number(e.target.value))}
                className="rounded-xl border border-[#e9e0d5] bg-[#faf8f4] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#b77b51]"
              >
                {BULAN.map((bulan, index) => (
                  <option key={bulan} value={index}>{bulan}</option>
                ))}
              </select>
            )}

            <button
              onClick={ambilData}
              disabled={loading}
              className="rounded-xl bg-[#493126] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#674630] disabled:opacity-50"
            >
              {loading ? "..." : "↻"}
            </button>
          </div>
        </section>

        {errorData && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Perhatian:</strong> {errorData}
          </div>
        )}

        {/* FINANCIAL OVERVIEW */}
        <section>
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47e5c]">
              Financial Overview
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">Angka Keuangan</h2>
            <p className="mt-1 text-sm text-[#958679]">
              Perhitungan otomatis untuk {periodeLabel}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kartu
              judul="Total Pemasukan"
              nilai={loading ? "Memuat..." : formatCurrency(penjualan)}
              catatan="Dari seluruh penjualan"
              ikon="↗"
              warna="gelap"
            />
            <Kartu
              judul="Total Pengeluaran"
              nilai={loading ? "Memuat..." : formatCurrency(totalBiaya)}
              catatan="Termasuk pembayaran gaji"
              ikon="↘"
              warna="putih"
            />
            <Kartu
              judul="Pembayaran Gaji"
              nilai={loading ? "Memuat..." : formatCurrency(totalGaji)}
              catatan="Total gaji karyawan"
              ikon="♙"
              warna="emas"
            />
            <Kartu
              judul="Hasil Bersih"
              nilai={loading ? "Memuat..." : formatCurrency(selisih)}
              catatan="Pemasukan dikurangi biaya"
              ikon="◈"
              warna="hijau"
            />
          </div>
        </section>

        {/* GRAPH */}
        <section className="rounded-[26px] border border-[#e9e0d5] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47e5c]">
                Financial Analytics
              </p>
              <h2 className="mt-1 text-xl font-extrabold">
                Statistik Keuangan
              </h2>
              <p className="mt-1 text-xs text-[#9b8d7e]">
                {periode === "tahun"
                  ? `Perbandingan Januari–Desember ${tahunDipilih}`
                  : periode === "bulan"
                    ? `Perbandingan transaksi harian · ${namaBulan} ${tahunDipilih}`
                    : `Aktivitas keuangan ${tanggalSekarang}`}
              </p>
            </div>

            <div className="flex gap-3 text-[11px] font-semibold text-[#88796b]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#a66c4b]" />
                Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#dfbd85]" />
                Keluar
              </span>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <div className="flex h-[245px] min-w-full items-end gap-1 border-b border-[#eee8df] pb-2 sm:gap-2">
              {grafik.map((item, index) => {
                const tinggiMasuk =
                  (item.pemasukan / maksimumGrafik) * 100;
                const tinggiKeluar =
                  (item.pengeluaran / maksimumGrafik) * 100;

                return (
                  <div
                    key={`${item.label}-${index}`}
                    className="group flex min-w-[18px] flex-1 flex-col items-center justify-end"
                    title={`${item.label}: Masuk ${formatCurrency(item.pemasukan)} · Keluar ${formatCurrency(item.pengeluaran)}`}
                  >
                    <div className="flex h-[205px] w-full items-end justify-center gap-[3px]">
                      <div
                        className="w-1/2 max-w-5 rounded-t-md bg-[#a66c4b] transition-all duration-300 group-hover:bg-[#74452e]"
                        style={{
                          height: `${tinggiMasuk}%`,
                          minHeight: item.pemasukan > 0 ? "4px" : "0",
                        }}
                      />
                      <div
                        className="w-1/2 max-w-5 rounded-t-md bg-[#dfbd85] transition-all duration-300 group-hover:bg-[#bd955b]"
                        style={{
                          height: `${tinggiKeluar}%`,
                          minHeight: item.pengeluaran > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    {(periode === "tahun" ||
                      periode === "hari" ||
                      index % 5 === 0 ||
                      index === grafik.length - 1) && (
                      <span className="mt-2 whitespace-nowrap text-[9px] font-medium text-[#9b8d7e]">
                        {item.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f6f2eb] p-4">
              <p className="text-xs text-[#8e7d6d]">Total pemasukan</p>
              <p className="mt-1 font-bold text-[#54846b]">
                {loading ? "Memuat..." : formatCurrency(penjualan)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f6f2eb] p-4">
              <p className="text-xs text-[#8e7d6d]">Total pengeluaran</p>
              <p className="mt-1 font-bold text-[#b46e51]">
                {loading ? "Memuat..." : formatCurrency(totalBiaya)}
              </p>
            </div>
          </div>
        </section>

        {/* BUSINESS INSIGHT */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[25px] border border-[#e9e0d5] bg-white p-6 shadow-sm lg:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47e5c]">
              Business Insight
            </p>
            <h2 className="mt-1 text-xl font-extrabold">Kondisi Usaha</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f6f2eb] p-5">
                <p className="text-xs text-[#8e7d6d]">Status keuangan</p>
                <p className={`mt-3 text-2xl font-extrabold ${
                  selisih >= 0 ? "text-[#648365]" : "text-[#b65d4e]"
                }`}>
                  {loading ? "Memuat..." : selisih >= 0 ? "Surplus" : "Defisit"}
                </p>
                <p className="mt-2 text-xs text-[#9b8d7e]">
                  Hasil berdasarkan transaksi tercatat.
                </p>
              </div>

              <div className="rounded-2xl bg-[#f6f2eb] p-5">
                <p className="text-xs text-[#8e7d6d]">Margin hasil bersih</p>
                <p className="mt-3 text-2xl font-extrabold text-[#9b784b]">
                  {loading ? "Memuat..." : `${margin.toFixed(1)}%`}
                </p>
                <p className="mt-2 text-xs text-[#9b8d7e]">
                  Hasil bersih dibandingkan pemasukan.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-[#8e7d6d]">
                <span>Persentase hasil bersih</span>
                <span>{loading ? "..." : `${Math.max(0, Math.min(100, margin)).toFixed(1)}%`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eee9e1]">
                <div
                  className="h-full rounded-full bg-[#829675] transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[25px] bg-gradient-to-br from-[#493126] to-[#80583d] p-6 text-white shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e6c9a5]">
              Activity Summary
            </p>
            <h2 className="mt-1 text-xl font-extrabold">Aktivitas</h2>
            <p className="mt-6 text-4xl font-extrabold">
              {loading ? "..." : totalAktivitas}
            </p>
            <p className="mt-1 text-xs text-white/65">
              Transaksi terbaru yang ditampilkan
            </p>
            <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-6 text-white/70">
              “Consistency creates progress.” Pantau pencatatan secara rutin
              untuk menjaga kondisi usaha tetap terarah.
            </p>
          </div>
        </section>

        {/* RECENT TRANSACTIONS */}
        <section className="overflow-hidden rounded-[26px] border border-[#e9e0d5] bg-white shadow-sm">
          <div className="border-b border-[#eee8df] px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47e5c]">
              Recent Transactions
            </p>
            <h2 className="mt-1 text-xl font-extrabold">Transaksi Terbaru</h2>
            <p className="mt-1 text-xs text-[#9b8d7e]">
              Aktivitas pada {periodeLabel}
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[#928477]">
              Memuat transaksi...
            </div>
          ) : transaksi.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-3xl">▤</div>
              <p className="mt-3 font-bold">Belum ada transaksi</p>
              <p className="mt-1 text-xs text-[#988a7c]">
                Transaksi yang dicatat akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0ece5]">
              {transaksi.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-[#fcfaf7]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                      item.jenis === "Pemasukan"
                        ? "bg-[#eaf3ed] text-[#478466]"
                        : item.jenis === "Gaji"
                          ? "bg-[#faf1e4] text-[#b6813f]"
                          : "bg-[#f9eeeb] text-[#bd5c50]"
                    }`}>
                      {item.jenis === "Pemasukan" ? "↗" : "↘"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.keterangan}</p>
                      <p className="mt-1 text-xs text-[#a09284]">
                        {item.jenis} · {formatDisplayDate(item.tanggal)}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${
                    item.jenis === "Pemasukan" ? "text-[#478466]" : "text-[#b66b50]"
                  }`}>
                    {item.jenis === "Pemasukan" ? "+" : "-"}
                    {formatCurrency(item.jumlah)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="pb-4 pt-2 text-center text-xs text-[#a18b77]">
          © {new Date().getFullYear()} PURI DONUT'S · Made with care
        </footer>
      </div>

      {/* PROFIL */}
      {bukaProfil && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#241811]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBukaProfil(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-[#fffdfa] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b8067]">Account</p>
                <h2 className="mt-1 text-2xl font-bold">Profil Admin</h2>
              </div>
              <button onClick={() => setBukaProfil(false)} className="h-10 w-10 rounded-xl text-xl hover:bg-[#f6ecde]">×</button>
            </div>

            <div className="my-6 flex flex-col items-center">
              {foto ? (
                <Image src={foto} alt="Foto profil" width={88} height={88} unoptimized className="h-[88px] w-[88px] rounded-2xl object-cover" />
              ) : (
                <span className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-[#f3e5d3] text-3xl font-bold text-[#70452d]">
                  {nickname.charAt(0).toUpperCase()}
                </span>
              )}
              <label className="mt-3 cursor-pointer rounded-xl bg-[#f6ecde] px-4 py-2 text-sm font-semibold text-[#70452d]">
                Ganti foto
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => pilihFoto(e.target.files?.[0])} />
              </label>
            </div>

            <label htmlFor="nickname" className="text-sm font-semibold">Nama tampilan</label>
            <input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="mb-4 mt-2 w-full rounded-xl border border-[#e6ded5] px-3.5 py-3 text-sm outline-none focus:border-[#b8945b]" />

            <label htmlFor="nama-lengkap" className="text-sm font-semibold">Nama lengkap</label>
            <input id="nama-lengkap" value={nama} onChange={(e) => setNama(e.target.value)} className="mb-4 mt-2 w-full rounded-xl border border-[#e6ded5] px-3.5 py-3 text-sm outline-none focus:border-[#b8945b]" />

            <label htmlFor="email-akun" className="text-sm font-semibold">Email akun</label>
            <input id="email-akun" value={email} readOnly className="mb-4 mt-2 w-full rounded-xl border border-[#e6ded5] bg-[#f8f4ed] px-3.5 py-3 text-sm text-[#8d7969]" />

            <p className="mb-5 text-xs leading-5 text-[#8d7969]">
              Nama dan foto di sini masih berupa pratinjau lokal.
              Penyimpanan permanen belum dihubungkan.
            </p>

            <button onClick={() => setBukaProfil(false)} className="w-full rounded-xl bg-[#70452d] px-4 py-3 text-sm font-bold text-white hover:bg-[#593721]">
              Simpan pratinjau
            </button>
            <button
              onClick={() => {
                setBukaProfil(false);
                router.push("/reset-password");
              }}
              className="mt-3 w-full rounded-xl border border-[#e6ded5] px-4 py-3 text-sm font-semibold text-[#70452d] hover:bg-[#f8f4ed]"
            >
              Ganti kata sandi
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function Kartu({
  judul,
  nilai,
  catatan,
  ikon,
  warna,
}: {
  judul: string;
  nilai: string;
  catatan: string;
  ikon: string;
  warna: "gelap" | "putih" | "hijau" | "emas";
}) {
  const style = {
    gelap: "border-[#634430] bg-gradient-to-br from-[#493126] to-[#946447] text-white",
    putih: "border-[#e9e3da] bg-white text-[#35281f]",
    hijau: "border-[#dce5d8] bg-gradient-to-br from-[#edf2e8] to-white text-[#35281f]",
    emas: "border-[#eadfca] bg-gradient-to-br from-[#fbf4e7] to-white text-[#35281f]",
  };

  const iconStyle = {
    gelap: "bg-white/10 text-[#f0c99d]",
    putih: "bg-[#f6eee4] text-[#91633c]",
    hijau: "bg-[#dce8d4] text-[#627a58]",
    emas: "bg-[#f2e5ca] text-[#a47b40]",
  };

  const labelStyle = {
    gelap: "text-white/70",
    putih: "text-[#84766a]",
    hijau: "text-[#687a5d]",
    emas: "text-[#8c7656]",
  };

  const noteStyle = {
    gelap: "text-white/65",
    putih: "text-[#a08b7c]",
    hijau: "text-[#829176]",
    emas: "text-[#a18c70]",
  };

  return (
    <article className={`rounded-[23px] border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6 ${style[warna]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm font-semibold ${labelStyle[warna]}`}>{judul}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${iconStyle[warna]}`}>{ikon}</span>
      </div>
      <p className="mt-5 break-words text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl">{nilai}</p>
      <p className={`mt-2 text-xs ${noteStyle[warna]}`}>{catatan}</p>
    </article>
  );
}
