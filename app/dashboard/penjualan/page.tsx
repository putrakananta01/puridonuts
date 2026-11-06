
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAccountPreferences } from "../preferences-provider";
import ServiceNavigation from "../service-navigation";

type Penjualan = {
  id: number;
  tanggal_penjualan: string;
  nomor_transaksi: string | null;
  total_penjualan: number;
  metode_pembayaran: string | null;
  catatan: string | null;
};

const tanggalHariIni = () => {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const hari = String(sekarang.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
};

function formatTanggal(value: string | null | undefined): string {
  if (!value) return "-";

  // Mengambil bagian tanggal saja agar aman dari perbedaan zona waktu.
  const bagianTanggal = String(value).slice(0, 10);
  const cocok = bagianTanggal.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!cocok) return "-";

  const tahun = Number(cocok[1]);
  const bulan = Number(cocok[2]);
  const hari = Number(cocok[3]);

  if (
    !Number.isInteger(tahun) ||
    !Number.isInteger(bulan) ||
    !Number.isInteger(hari) ||
    bulan < 1 ||
    bulan > 12 ||
    hari < 1 ||
    hari > 31
  ) {
    return "-";
  }

  const tanggal = new Date(tahun, bulan - 1, hari);

  if (
    tanggal.getFullYear() !== tahun ||
    tanggal.getMonth() !== bulan - 1 ||
    tanggal.getDate() !== hari
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tanggal);
}

function buatNomorTransaksi(tanggal: string, penjualan: Penjualan[]) {
  const awalan = `PJ-${tanggal.replaceAll("-", "")}-`;
  const nomorTerpakai = new Set(
    penjualan
      .filter((item) => item.tanggal_penjualan.slice(0, 10) === tanggal)
      .map((item) => item.nomor_transaksi?.trim().toUpperCase())
      .filter((nomor): nomor is string => Boolean(nomor))
  );

  let urutan = 1;
  let nomor = `${awalan}${String(urutan).padStart(3, "0")}`;

  while (nomorTerpakai.has(nomor)) {
    urutan += 1;
    nomor = `${awalan}${String(urutan).padStart(3, "0")}`;
  }

  return nomor;
}

export default function PenjualanPage() {
  const { formatCurrency } = useAccountPreferences();

  const [dataPenjualan, setDataPenjualan] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataDimuat, setDataDimuat] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pencarian, setPencarian] = useState("");
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState<"sukses" | "error">("sukses");

  const [tanggal, setTanggal] = useState(tanggalHariIni());
  const [total, setTotal] = useState("");
  const [metode, setMetode] = useState("Tunai");
  const [catatan, setCatatan] = useState("");

  const [formTerbuka, setFormTerbuka] = useState(false);

  const tampilkanPesan = (
    teks: string,
    jenis: "sukses" | "error"
  ) => {
    setPesan(teks);
    setJenisPesan(jenis);
  };

  const ambilPenjualan = useCallback(async () => {
    setLoading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("penjualan")
        .select(
          "id,tanggal_penjualan,nomor_transaksi,total_penjualan,metode_pembayaran,catatan"
        )
        .order("tanggal_penjualan", { ascending: false });

      if (error) {
        console.error("Gagal mengambil data penjualan:", error);
        tampilkanPesan(
          "Data penjualan gagal dimuat. Periksa koneksi Supabase.",
          "error"
        );
        return;
      }

      setDataPenjualan((data ?? []) as Penjualan[]);
      setDataDimuat(true);
    } catch (error) {
      console.error(error);
      tampilkanPesan("Terjadi kesalahan saat mengambil data.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void ambilPenjualan();
  }, [ambilPenjualan]);

  const totalPemasukan = useMemo(
    () =>
      dataPenjualan.reduce(
        (jumlah, item) => jumlah + Number(item.total_penjualan || 0),
        0
      ),
    [dataPenjualan]
  );

  const hariIni = tanggalHariIni();
  const bulanIni = hariIni.slice(0, 7);
  const nomorTransaksi = useMemo(
    () => buatNomorTransaksi(tanggal, dataPenjualan),
    [tanggal, dataPenjualan]
  );
  const penjualanHariIni = useMemo(
    () =>
      dataPenjualan
        .filter((item) => item.tanggal_penjualan.slice(0, 10) === hariIni)
        .reduce((jumlah, item) => jumlah + Number(item.total_penjualan || 0), 0),
    [dataPenjualan, hariIni]
  );
  const transaksiHariIni = useMemo(
    () =>
      dataPenjualan.filter(
        (item) => item.tanggal_penjualan.slice(0, 10) === hariIni
      ).length,
    [dataPenjualan, hariIni]
  );
  const penjualanBulanIni = useMemo(
    () =>
      dataPenjualan
        .filter((item) => item.tanggal_penjualan.slice(0, 7) === bulanIni)
        .reduce((jumlah, item) => jumlah + Number(item.total_penjualan || 0), 0),
    [dataPenjualan, bulanIni]
  );

  const dataTersaring = useMemo(() => {
    const kata = pencarian.trim().toLowerCase();

    if (!kata) return dataPenjualan;

    return dataPenjualan.filter((item) => {
      return (
        String(item.nomor_transaksi ?? "").toLowerCase().includes(kata) ||
        String(item.metode_pembayaran ?? "").toLowerCase().includes(kata) ||
        String(item.catatan ?? "").toLowerCase().includes(kata) ||
        formatTanggal(item.tanggal_penjualan).toLowerCase().includes(kata)
      );
    });
  }, [dataPenjualan, pencarian]);

  async function simpanPenjualan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPesan("");

    if (!dataDimuat) {
      tampilkanPesan(
        "Muat data penjualan terlebih dahulu sebelum membuat transaksi.",
        "error"
      );
      return;
    }

    const nilaiTotal = Number(total);

    if (!tanggal || formatTanggal(tanggal) === "-") {
      tampilkanPesan("Tanggal penjualan tidak valid.", "error");
      return;
    }

    if (!Number.isFinite(nilaiTotal) || nilaiTotal <= 0) {
      tampilkanPesan("Masukkan jumlah penjualan yang benar.", "error");
      return;
    }

    setMenyimpan(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        tampilkanPesan("Sesi login berakhir. Silakan login kembali.", "error");
        return;
      }

      const { error } = await supabase.from("penjualan").insert({
        tanggal_penjualan: tanggal,
        nomor_transaksi: nomorTransaksi,
        total_penjualan: nilaiTotal,
        metode_pembayaran: metode,
        catatan: catatan.trim() || null,
      });

      if (error) {
        console.error("Gagal menyimpan penjualan:", error);
        tampilkanPesan(
          `Penjualan gagal disimpan: ${error.message}`,
          "error"
        );
        return;
      }
      setTanggal(tanggalHariIni());
      setTanggal(tanggalHariIni());
      setTotal("");
      setMetode("Tunai");
      setCatatan("");
      setFormTerbuka(false);

      tampilkanPesan("Data penjualan berhasil disimpan.", "sukses");
      await ambilPenjualan();
    } catch (error) {
      console.error(error);
      tampilkanPesan("Terjadi kesalahan saat menyimpan penjualan.", "error");
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f3ed] px-4 py-6 text-[#39291f] sm:px-7 sm:py-8">
      <ServiceNavigation activeHref="/dashboard/penjualan" />

      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="relative isolate overflow-hidden rounded-[30px] bg-gradient-to-br from-[#35251e] via-[#493126] to-[#80583d] p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full border-[34px] border-[#e9c18f]/10" />
          <div className="pointer-events-none absolute bottom-0 right-40 h-32 w-32 rounded-full bg-[#e9c18f]/10 blur-3xl" />

          <div className="relative flex flex-wrap items-end justify-between gap-6 pr-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#e9c18f]">
                PURI DONUT&apos;S / FINANCIAL MANAGEMENT
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Penjualan<span className="text-[#e9c18f]">.</span>
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/70">
                Catat pemasukan dan pantau perkembangan penjualan dalam satu tempat.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8d5a0]" />
                {formatTanggal(hariIni)}
              </p>
            </div>

            <button
              type="button"
              disabled={loading || !dataDimuat}
              onClick={() => setFormTerbuka((terbuka) => !terbuka)}
              className="rounded-xl bg-[#e9c18f] px-5 py-3 text-sm font-bold text-[#49301f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f5d5ad] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memuat Data..." : formTerbuka ? "Tutup Form" : "+ Tambah Penjualan"}
            </button>
          </div>
        </header>

        {/* NOTIFIKASI */}
        {pesan && (
          <div
            role={jenisPesan === "error" ? "alert" : "status"}
            className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm ${
              jenisPesan === "sukses"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span>{pesan}</span>
            <button onClick={() => setPesan("")} aria-label="Tutup pesan">
              ×
            </button>
          </div>
        )}

        {/* RINGKASAN */}
        <section>
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17e60]">
              Sales Overview
            </p>
            <h2 className="mt-1 text-xl font-extrabold">Ringkasan Penjualan</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                judul: "Total Pemasukan",
                nilai: loading ? "Memuat..." : formatCurrency(totalPemasukan),
                catatan: "Akumulasi seluruh penjualan",
                ikon: "↗",
                utama: true,
              },
              {
                judul: "Penjualan Hari Ini",
                nilai: loading ? "Memuat..." : formatCurrency(penjualanHariIni),
                catatan: "Pemasukan pada hari ini",
                ikon: "◷",
              },
              {
                judul: "Transaksi Hari Ini",
                nilai: loading ? "..." : String(transaksiHariIni),
                catatan: "Jumlah transaksi hari ini",
                ikon: "▤",
              },
              {
                judul: "Penjualan Bulan Ini",
                nilai: loading ? "Memuat..." : formatCurrency(penjualanBulanIni),
                catatan: "Pemasukan bulan berjalan",
                ikon: "▥",
              },
            ].map((kartu) => (
              <article
                key={kartu.judul}
                className={`rounded-[25px] border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
                  kartu.utama
                    ? "border-[#634430] bg-gradient-to-br from-[#493126] to-[#936247] text-white"
                    : "border-[#e9e1d7] bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-semibold ${kartu.utama ? "text-white/75" : "text-[#817264]"}`}>
                    {kartu.judul}
                  </p>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                    kartu.utama ? "bg-white/10 text-[#f0c99d]" : "bg-[#f5ecdf] text-[#95633f]"
                  }`}>
                    {kartu.ikon}
                  </span>
                </div>
                <p className="mt-5 break-words text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl">
                  {kartu.nilai}
                </p>
                <p className={`mt-2 text-xs ${kartu.utama ? "text-white/65" : "text-[#a09284]"}`}>
                  {kartu.catatan}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* FORM TAMBAH */}
        {formTerbuka && (
          <section className="overflow-hidden rounded-[28px] border border-[#e9e0d5] bg-white shadow-sm">
            <div className="border-b border-[#eee8df] bg-gradient-to-r from-[#fffaf2] to-white px-5 py-5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17e60]">
                New Sales Entry
              </p>
              <h2 className="mt-1 text-xl font-extrabold">
                Tambah Data Penjualan
              </h2>
              <p className="mt-1 text-xs text-[#9b8d7e]">
                Nomor transaksi dan ringkasan nominal akan disiapkan otomatis.
              </p>
            </div>

            <form onSubmit={simpanPenjualan} className="space-y-5 p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Tanggal Penjualan
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#e8e0d6] bg-[#fcfaf7] px-4 py-3 text-sm outline-none transition focus:border-[#ad8058] focus:ring-4 focus:ring-[#ad8058]/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label htmlFor="nomor-transaksi" className="text-sm font-semibold">
                      Nomor Transaksi
                    </label>
                    <span className="rounded-full bg-[#edf3e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#647b54]">
                      Otomatis
                    </span>
                  </div>
                  <input
                    id="nomor-transaksi"
                    type="text"
                    value={nomorTransaksi}
                    readOnly
                    aria-describedby="nomor-transaksi-info"
                    className="w-full rounded-xl border border-[#e8e0d6] bg-[#f7f4ee] px-4 py-3 text-sm font-bold tracking-wide text-[#62462f] outline-none"
                  />
                  <p id="nomor-transaksi-info" className="mt-2 text-xs text-[#9b8d7e]">
                    Dibuat sesuai tanggal dan urutan transaksi.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Total Penjualan (Rp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="Masukkan jumlah penjualan"
                    required
                    className="w-full rounded-xl border border-[#e8e0d6] bg-[#fcfaf7] px-4 py-3 text-sm outline-none transition focus:border-[#ad8058] focus:ring-4 focus:ring-[#ad8058]/10"
                  />
                  <p className="mt-2 text-xs text-[#8e7d6d]" aria-live="polite">
                    Pratinjau:{" "}
                    <span className="font-bold text-[#60452f]">
                      {Number(total) > 0
                        ? formatCurrency(Number(total))
                        : "Masukkan nominal penjualan"}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Metode Pembayaran
                  </label>
                  <select
                    value={metode}
                    onChange={(e) => setMetode(e.target.value)}
                    className="w-full rounded-xl border border-[#e8e0d6] bg-[#fcfaf7] px-4 py-3 text-sm outline-none transition focus:border-[#ad8058] focus:ring-4 focus:ring-[#ad8058]/10"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Catatan
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  placeholder="Catatan tambahan (opsional)"
                  className="w-full resize-none rounded-xl border border-[#e8e0d6] bg-[#fcfaf7] px-4 py-3 text-sm outline-none transition focus:border-[#ad8058] focus:ring-4 focus:ring-[#ad8058]/10"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#eee8df] pt-5">
                <button
                  type="button"
                  onClick={() => setFormTerbuka(false)}
                  className="rounded-xl border border-[#e8e0d6] px-5 py-3 text-sm font-semibold text-[#796958] transition hover:bg-[#f8f4ed]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={menyimpan}
                  className="rounded-xl bg-[#493126] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#684831] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {menyimpan ? "Menyimpan..." : "Simpan Penjualan"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* DAFTAR TRANSAKSI */}
        <section className="overflow-hidden rounded-[26px] border border-[#e9e0d5] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee8df] px-5 py-5 sm:px-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17e60]">
                Sales Records
              </p>
              <h2 className="mt-1 text-xl font-extrabold">
                Riwayat Penjualan
              </h2>
              <p className="mt-1 text-xs text-[#9b8d7e]">
                Daftar transaksi yang tersimpan.
              </p>
            </div>

            <button
              onClick={ambilPenjualan}
              disabled={loading}
              className="rounded-xl border border-[#e9e0d5] px-4 py-2.5 text-xs font-bold text-[#70452d] hover:bg-[#faf6ef] disabled:opacity-50"
            >
              {loading ? "Memuat..." : "↻ Muat Ulang"}
            </button>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <input
                aria-label="Cari riwayat penjualan"
                type="search"
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                placeholder="Cari nomor transaksi, tanggal, metode pembayaran..."
                className="min-w-[220px] flex-1 rounded-xl border border-[#e9e0d5] bg-[#fcfaf7] px-4 py-3 text-sm outline-none transition focus:border-[#ad8058] focus:ring-4 focus:ring-[#ad8058]/10"
              />
              {!loading && (
                <span className="rounded-full bg-[#f5eee4] px-3 py-2 text-xs font-semibold text-[#91633c]">
                  {dataTersaring.length} dari {dataPenjualan.length} transaksi
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-[#958679]">
                Sedang mengambil data penjualan...
              </div>
            ) : dataTersaring.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl text-[#b99a7a]">▤</div>
                <p className="mt-3 font-bold">
                  {pencarian.trim() ? "Transaksi tidak ditemukan" : "Belum ada data penjualan"}
                </p>
                <p className="mt-1 text-xs text-[#9b8d7e]">
                  {pencarian.trim()
                    ? "Coba kata kunci atau tanggal yang berbeda."
                    : "Tambahkan transaksi untuk melihatnya di sini."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-[#eee8df] text-[11px] uppercase tracking-wider text-[#9b8d7e]">
                      <th className="px-3 py-4 font-bold">Tanggal</th>
                      <th className="px-3 py-4 font-bold">Nomor Transaksi</th>
                      <th className="px-3 py-4 font-bold">Metode</th>
                      <th className="px-3 py-4 font-bold">Catatan</th>
                      <th className="px-3 py-4 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataTersaring.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#f1ede7] transition hover:bg-[#fcfaf7]"
                      >
                        <td className="px-3 py-4 text-sm text-[#77685a]">
                          {formatTanggal(item.tanggal_penjualan)}
                        </td>
                        <td className="px-3 py-4 text-sm font-bold">
                          {item.nomor_transaksi || "-"}
                        </td>
                        <td className="px-3 py-4">
                          <span className="rounded-full bg-[#f5eee4] px-3 py-1.5 text-xs font-semibold text-[#91633c]">
                            {item.metode_pembayaran || "-"}
                          </span>
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-4 text-sm text-[#8f8174]">
                          {item.catatan || "-"}
                        </td>
                        <td className="px-3 py-4 text-right text-sm font-extrabold text-[#548466]">
                          {formatCurrency(Number(item.total_penjualan || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && dataTersaring.length > 0 && (
              <p className="mt-4 text-xs text-[#9b8d7e]">
                Menampilkan {dataTersaring.length} transaksi.
              </p>
            )}
          </div>
        </section>

        <footer className="pb-3 text-center text-xs text-[#a18b77]">
          © {new Date().getFullYear()} PURI DONUT&apos;S · Sales Management
        </footer>
      </div>
    </main>
  );
}
