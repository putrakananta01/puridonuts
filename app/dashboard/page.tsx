"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ServiceNavigation from "./service-navigation";

type MenuItem = {
  label: string;
  href: string;
  icon: string;
  description: string;
};

const menu: MenuItem[] = [
  {
    label: "Penjualan",
    href: "/dashboard/penjualan",
    icon: "↗",
    description: "Catat transaksi dan pantau pemasukan.",
  },
  {
    label: "Produksi",
    href: "/dashboard/produksi",
    icon: "✳",
    description: "Kelola produksi dan persediaan harian.",
  },
  {
    label: "Pengeluaran",
    href: "/dashboard/pengeluaran",
    icon: "↘",
    description: "Catat biaya operasional usaha.",
  },
  {
    label: "Karyawan & Gaji",
    href: "/dashboard/karyawan",
    icon: "◎",
    description: "Atur data karyawan dan penggajian.",
  },
  {
    label: "Laporan Keuangan",
    href: "/dashboard/laporan",
    icon: "▤",
    description: "Lihat laporan dan ringkasan keuangan.",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [nama, setNama] = useState("Administrator");
  const [email, setEmail] = useState("");
  const [foto, setFoto] = useState("");
  const [penjualan, setPenjualan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bukaProfil, setBukaProfil] = useState(false);
  const [nickname, setNickname] = useState("Administrator");

  useEffect(() => {
    async function ambilData() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");

      const { data: profil } = await supabase
        .from("profiles")
        .select("nama")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profil?.nama) {
        setNama(profil.nama);
        setNickname(profil.nama);
      }

      const awal = new Date();
      awal.setDate(1);
      awal.setHours(0, 0, 0, 0);

      const bulanIni = awal.toISOString().slice(0, 10);

      const [jual, biaya] = await Promise.all([
        supabase
          .from("penjualan")
          .select("total_penjualan")
          .gte("tanggal_penjualan", bulanIni),

        supabase
          .from("pengeluaran")
          .select("jumlah")
          .gte("tanggal_pengeluaran", bulanIni),
      ]);

      if (!jual.error) {
        setPenjualan(
          (jual.data ?? []).reduce(
            (total, item) => total + Number(item.total_penjualan || 0),
            0
          )
        );
      }

      if (!biaya.error) {
        setPengeluaran(
          (biaya.data ?? []).reduce(
            (total, item) => total + Number(item.jumlah || 0),
            0
          )
        );
      }

      setLoading(false);
    }

    void ambilData();
  }, [router]);

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

    setFoto(URL.createObjectURL(file));
  }

  const rupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);

  return (
    <main className="dashboard-background min-h-screen px-4 py-5 text-[#38251c] sm:px-8 sm:py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <ServiceNavigation activeHref="/dashboard" />

        <header className="dashboard-enter flex flex-wrap items-center justify-between gap-4 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b8067]">
              Ringkasan usaha
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#38251c] sm:text-4xl">
              Dashboard
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setBukaProfil(true)}
            aria-label="Buka profil administrator"
            className="group inline-flex items-center gap-3 rounded-2xl border border-[#eae4db] bg-white/90 p-2 pr-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#d7c2a8] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732]"
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
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3e5d3] font-semibold text-[#70452d]">
                {nickname.charAt(0).toUpperCase()}
              </span>
            )}
            <span>
              <span className="block text-sm font-semibold text-[#38251c]">
                {nickname}
              </span>
              <span className="mt-0.5 block text-xs text-[#9b8067]">
                Administrator
              </span>
            </span>
            <span
              aria-hidden="true"
              className="ml-1 text-xs text-[#9b8067] transition-transform group-hover:translate-y-0.5"
            >
              ▾
            </span>
          </button>
        </header>

        <section className="dashboard-enter relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#38251f] via-[#65412f] to-[#875640] p-6 text-white shadow-[0_24px_54px_-32px_rgba(64,43,26,0.65)] sm:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full border-[34px] border-white/[0.06]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 right-48 -z-10 h-44 w-44 rounded-full bg-[#d6ad74]/10 blur-2xl"
          />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8c9a7]">
              Puri Donut&apos;s <span className="px-1 text-white/40">/</span>{" "}
              Ruang kerja pemilik
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Senang melihatmu, {nickname}!
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
              Semua ringkasan keuangan dan aktivitas usaha bulan ini, tersedia
              dalam satu tempat.
            </p>
            <Link
              href="/dashboard/laporan"
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f0c99d] px-5 py-3 text-sm font-semibold text-[#49301f] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#f8d9b7] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0"
            >
              Lihat laporan keuangan
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-7 right-12 hidden h-36 w-36 rotate-[-12deg] items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/[0.04] text-7xl text-[#f0c99d]/50 md:flex"
          >
            ✳
          </div>
        </section>

        <section aria-labelledby="ringkasan-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <h2
                id="ringkasan-title"
                className="text-xl font-semibold tracking-tight text-[#38251c] sm:text-2xl"
              >
                Ringkasan keuangan
              </h2>
              <p className="mt-1 text-sm text-[#8d7969]">
                Performa usaha selama bulan berjalan
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e7dccd] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#80664d]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
              Bulan ini
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Kartu
              judul="Total penjualan"
              nilai={loading ? "Memuat..." : rupiah(penjualan)}
              catatan="Pemasukan yang tercatat"
              ikon="↗"
              warna="gelap"
              delay={0}
            />
            <Kartu
              judul="Total pengeluaran"
              nilai={loading ? "Memuat..." : rupiah(pengeluaran)}
              catatan="Biaya operasional"
              ikon="↘"
              warna="terang"
              delay={90}
            />
            <Kartu
              judul="Perkiraan selisih"
              nilai={
                loading ? "Memuat..." : rupiah(penjualan - pengeluaran)
              }
              catatan="Penjualan dikurangi pengeluaran"
              ikon="◈"
              warna="hijau"
              delay={180}
            />
          </div>
        </section>

        <section
          aria-labelledby="menu-title"
          className="dashboard-enter rounded-3xl border border-[#eae4db] bg-white/85 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.3)] sm:p-7"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="menu-title"
                className="text-xl font-semibold tracking-tight text-[#38251c]"
              >
                Menu pengelolaan
              </h2>
              <p className="mt-1 text-sm text-[#8d7969]">
                Pilih layanan untuk melanjutkan pekerjaan.
              </p>
            </div>
            <span className="hidden text-xs font-medium text-[#a08b7c] sm:block">
              Akses cepat
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {menu.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="dashboard-card group flex min-h-24 items-center gap-4 rounded-2xl border border-[#eee6dc] bg-[#fffdfa] p-4 transition-colors hover:border-[#d6bd9d] hover:bg-[#fbf5eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732]"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6ecde] text-xl text-[#91633c] transition duration-200 group-hover:scale-105 group-hover:bg-[#efe0ca]"
                >
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[#493629]">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#8d7969]">
                    {item.description}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-lg text-[#ad9274] transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {bukaProfil && (
        <div
          className="dashboard-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#241811]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBukaProfil(false);
          }}
        >
          <section
            aria-labelledby="profil-title"
            aria-modal="true"
            className="dashboard-modal my-auto w-full max-w-md rounded-3xl border border-white/60 bg-[#fffdfa] p-6 shadow-2xl sm:p-7"
            role="dialog"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b8067]">
                  Akun
                </p>
                <h2
                  id="profil-title"
                  className="mt-1 text-2xl font-semibold tracking-tight text-[#38251c]"
                >
                  Profil admin
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBukaProfil(false)}
                aria-label="Tutup profil"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-[#80664d] transition hover:bg-[#f6ecde] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732]"
              >
                ×
              </button>
            </div>

            <div className="my-6 flex flex-col items-center">
              {foto ? (
                <Image
                  src={foto}
                  alt="Foto profil"
                  width={88}
                  height={88}
                  unoptimized
                  className="h-[88px] w-[88px] rounded-2xl object-cover"
                />
              ) : (
                <span className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-[#f3e5d3] text-3xl font-semibold text-[#70452d]">
                  {nickname.charAt(0).toUpperCase()}
                </span>
              )}
              <label className="mt-3 cursor-pointer rounded-xl bg-[#f6ecde] px-4 py-2 text-sm font-semibold text-[#70452d] transition hover:bg-[#efe0ca]">
                Ganti foto
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => pilihFoto(event.target.files?.[0])}
                />
              </label>
            </div>

            <label
              htmlFor="nickname"
              className="text-sm font-medium text-[#554538]"
            >
              Nama tampilan
            </label>
            <input
              id="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="mb-4 mt-2 w-full rounded-xl border border-[#e6ded5] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#b8945b] focus:ring-2 focus:ring-[#b8945b]/15"
            />

            <label
              htmlFor="nama-lengkap"
              className="text-sm font-medium text-[#554538]"
            >
              Nama lengkap
            </label>
            <input
              id="nama-lengkap"
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              className="mb-4 mt-2 w-full rounded-xl border border-[#e6ded5] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#b8945b] focus:ring-2 focus:ring-[#b8945b]/15"
            />

            <label
              htmlFor="email-akun"
              className="text-sm font-medium text-[#554538]"
            >
              Email akun
            </label>
            <input
              id="email-akun"
              value={email}
              readOnly
              className="mb-4 mt-2 w-full rounded-xl border border-[#e6ded5] bg-[#f8f4ed] px-3.5 py-3 text-sm text-[#8d7969]"
            />

            <p className="mb-5 text-xs leading-5 text-[#8d7969]">
              Perubahan nama dan foto saat ini hanya berupa pratinjau.
              Penyimpanan permanen ke Supabase belum dihubungkan.
            </p>

            <button
              type="button"
              onClick={() => setBukaProfil(false)}
              className="w-full rounded-xl bg-[#70452d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#593721] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732]"
            >
              Simpan pratinjau
            </button>
            <button
              type="button"
              onClick={() => {
                setBukaProfil(false);
                router.push("/reset-password");
              }}
              className="mt-3 w-full rounded-xl border border-[#e6ded5] px-4 py-3 text-sm font-semibold text-[#70452d] transition hover:bg-[#f8f4ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732]"
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
  delay,
}: {
  judul: string;
  nilai: string;
  catatan: string;
  ikon: string;
  warna: "gelap" | "terang" | "hijau";
  delay: number;
}) {
  const warnaKartu = {
    gelap:
      "border-[#634430] bg-gradient-to-br from-[#493126] via-[#704a36] to-[#9b684b] text-white",
    terang: "border-[#eae4db] bg-white/90 text-[#35291f]",
    hijau: "border-[#dce5d8] bg-gradient-to-br from-[#edf2e8] to-[#fbfcf8] text-[#35291f]",
  };
  const warnaIkon = {
    gelap: "bg-[#f1c99f]/15 text-[#f1c99f]",
    terang: "bg-[#f7eddf] text-[#91633c]",
    hijau: "bg-[#dce8d4] text-[#627a58]",
  };
  const warnaJudul = {
    gelap: "text-white/75",
    terang: "text-[#78695a]",
    hijau: "text-[#687a5d]",
  };
  const warnaCatatan = {
    gelap: "text-white/70",
    terang: "text-[#a08b7c]",
    hijau: "text-[#829176]",
  };

  return (
    <article
      className={`dashboard-enter dashboard-card relative isolate overflow-hidden rounded-3xl border p-5 shadow-[0_10px_30px_-22px_rgba(64,43,26,0.28)] sm:p-6 ${warnaKartu[warna]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {warna === "gelap" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-9 -top-12 -z-10 h-36 w-36 rounded-full border-[22px] border-[#f1c99f]/[0.14]"
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${warnaJudul[warna]}`}>{judul}</p>
          <p className="mt-4 break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.7rem]">
            {nilai}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${warnaIkon[warna]}`}
        >
          {ikon}
        </span>
      </div>
      <p className={`mt-3 text-xs leading-5 ${warnaCatatan[warna]}`}>
        {catatan}
      </p>
    </article>
  );
}
