
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ServiceNavigation from "../service-navigation";

type Penjualan = {
  id: number;
  tanggal_penjualan: string;
  nomor_transaksi: string | null;
  total_penjualan: number;
  metode_pembayaran: string | null;
  catatan: string | null;
};

const formatRupiah = (nilai: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);

const tanggalHariIni = () => {
  const sekarang = new Date();
  const lokal = new Date(
    sekarang.getTime() - sekarang.getTimezoneOffset() * 60000
  );
  return lokal.toISOString().slice(0, 10);
};

export default function PenjualanPage() {
  const [data, setData] = useState<Penjualan[]>([]);
  const [tanggal, setTanggal] = useState(tanggalHariIni());
  const [nomorTransaksi, setNomorTransaksi] = useState("");
  const [total, setTotal] = useState("");
  const [metode, setMetode] = useState("Tunai");
  const [catatan, setCatatan] = useState("");
  const [pencarian, setPencarian] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
  const [formTerbuka, setFormTerbuka] = useState(false);

  const muatPenjualan = useCallback(async () => {
    setMemuat(true);
    setError("");

    const { data: hasil, error: kesalahan } = await supabase
      .from("penjualan")
      .select(
        "id, tanggal_penjualan, nomor_transaksi, total_penjualan, metode_pembayaran, catatan"
      )
      .order("tanggal_penjualan", { ascending: false })
      .order("id", { ascending: false });

    if (kesalahan) {
      setError(`Gagal memuat data: ${kesalahan.message}`);
      setData([]);
    } else {
      setData((hasil ?? []) as Penjualan[]);
    }

    setMemuat(false);
  }, []);

  useEffect(() => {
    void muatPenjualan();
  }, [muatPenjualan]);

  async function simpanPenjualan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan("");
    setError("");

    const nilaiTotal = Number(total);

    if (!tanggal || !total.trim() || !Number.isFinite(nilaiTotal) || nilaiTotal <= 0) {
      setError("Isi tanggal dan total penjualan dengan benar.");
      return;
    }

    setMenyimpan(true);

    const transaksi =
      nomorTransaksi.trim() ||
      `TRX-${tanggal.replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;

    const { error: kesalahan } = await supabase.from("penjualan").insert({
      tanggal_penjualan: tanggal,
      nomor_transaksi: transaksi,
      total_penjualan: nilaiTotal,
      metode_pembayaran: metode,
      catatan: catatan.trim() || null,
    });

    setMenyimpan(false);

    if (kesalahan) {
      setError(`Gagal menyimpan: ${kesalahan.message}`);
      return;
    }

    setPesan("Transaksi penjualan berhasil disimpan.");
    setNomorTransaksi("");
    setTotal("");
    setMetode("Tunai");
    setCatatan("");
    setFormTerbuka(false);

    await muatPenjualan();
  }

  const dataTerfilter = data.filter((item) => {
    const kata = pencarian.toLowerCase();

    return (
      (item.nomor_transaksi ?? "").toLowerCase().includes(kata) ||
      (item.metode_pembayaran ?? "").toLowerCase().includes(kata) ||
      (item.catatan ?? "").toLowerCase().includes(kata)
    );
  });

  const totalSemua = data.reduce(
    (jumlah, item) => jumlah + Number(item.total_penjualan || 0),
    0
  );

  const totalHariIni = data
    .filter((item) => item.tanggal_penjualan === tanggalHariIni())
    .reduce((jumlah, item) => jumlah + Number(item.total_penjualan || 0), 0);

  return (
    <main className="dashboard-background min-h-screen px-4 py-5 text-[#38251c] sm:px-8 sm:py-7">
      <div className="mx-auto max-w-6xl space-y-5">
        <ServiceNavigation activeHref="/dashboard/penjualan" />
        <header className="dashboard-enter relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#38251f] via-[#65412f] to-[#875640] p-6 text-white shadow-[0_24px_54px_-32px_rgba(64,43,26,0.65)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full border-[34px] border-white/[0.06]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-48 -z-10 h-44 w-44 rounded-full bg-[#d6ad74]/10 blur-2xl" />
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8c9a7]">
                Puri Donut&apos;s <span className="px-1 text-white/40">/</span>{" "}
                Operasional
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Penjualan
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/75">
                Catat transaksi dan pantau pemasukan usaha dalam satu tempat.
              </p>
            </div>

            <button
              type="button"
              aria-expanded={formTerbuka}
              aria-controls="form-penjualan"
              onClick={() => {
                setFormTerbuka(!formTerbuka);
                setPesan("");
                setError("");
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#f0c99d] px-5 py-3 text-sm font-semibold text-[#49301f] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#f8d9b7] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-0 sm:self-auto"
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#70452d]/10 text-lg transition-transform duration-200 ${
                  formTerbuka ? "rotate-45" : ""
                }`}
                aria-hidden="true"
              >
                +
              </span>
              {formTerbuka ? "Tutup formulir" : "Tambah penjualan"}
            </button>
          </div>
        </header>

        {pesan && (
          <div role="status" className="dashboard-enter rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-medium text-emerald-800 shadow-sm">
            {pesan}
          </div>
        )}

        {error && (
          <div role="alert" className="dashboard-enter rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="dashboard-enter dashboard-card relative overflow-hidden rounded-3xl border border-[#634430] bg-gradient-to-br from-[#493126] via-[#704a36] to-[#9b684b] p-5 text-white shadow-[0_18px_40px_-24px_rgba(64,43,26,0.55)] sm:p-6">
            <div aria-hidden="true" className="absolute -right-9 -top-12 h-36 w-36 rounded-full border-[22px] border-[#f1c99f]/[0.14]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white/75">Pemasukan hari ini</p>
                <p className="mt-4 break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {formatRupiah(totalHariIni)}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f1c99f]/15 text-xl text-[#f1c99f]" aria-hidden="true">↗</span>
            </div>
            <p className="relative mt-3 text-xs leading-5 text-white/70">
              Dari transaksi yang tercatat hari ini
            </p>
          </article>

          <article className="dashboard-enter dashboard-card rounded-3xl border border-[#eae4db] bg-white/90 p-5 shadow-[0_10px_30px_-22px_rgba(64,43,26,0.28)] sm:p-6" style={{ animationDelay: "90ms" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#78695a]">Total penjualan</p>
                <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-[#35291f] tabular-nums sm:text-3xl">
                  {formatRupiah(totalSemua)}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7eddf] text-lg text-[#91633c]" aria-hidden="true">▤</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#a08b7c]">
              {data.length} transaksi tercatat
            </p>
          </article>
        </section>

        {formTerbuka && (
          <section id="form-penjualan" className="dashboard-enter rounded-3xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7eddf] text-xl text-[#91633c]" aria-hidden="true">＋</span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Transaksi baru
                </h2>
                <p className="mt-1 text-sm text-[#8a7568]">
                  Lengkapi detail penjualan di bawah ini.
                </p>
              </div>
            </div>

            <form onSubmit={simpanPenjualan} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#59483a]">
                  Tanggal Penjualan *
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#b0a194] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                  />
                </label>

                <label className="block text-sm font-semibold text-[#59483a]">
                  Nomor Transaksi
                  <input
                    type="text"
                    value={nomorTransaksi}
                    onChange={(e) => setNomorTransaksi(e.target.value)}
                    placeholder="Kosongkan untuk nomor otomatis"
                    className="mt-2 h-12 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#b0a194] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                  />
                </label>

                <label className="block text-sm font-semibold text-[#59483a]">
                  Total Penjualan (Rp) *
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="Contoh: 150000"
                    className="mt-2 h-12 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#b0a194] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                  />
                </label>

                <label className="block text-sm font-semibold text-[#59483a]">
                  Metode Pembayaran *
                  <select
                    required
                    value={metode}
                    onChange={(e) => setMetode(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 text-sm font-normal text-[#45372b] outline-none transition focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-semibold text-[#59483a]">
                Catatan
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  placeholder="Catatan tambahan (opsional)"
                  className="mt-2 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 py-3 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#b0a194] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={menyimpan}
                  className="min-h-12 rounded-xl bg-[#65412f] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(74,48,36,0.8)] transition hover:-translate-y-0.5 hover:bg-[#4b3024] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70452f] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {menyimpan ? "Menyimpan..." : "Simpan Penjualan"}
                </button>

                <button
                  type="button"
                  onClick={() => setFormTerbuka(false)}
                  className="min-h-12 rounded-xl border border-[#e5d8cb] bg-white px-6 py-3 text-sm font-semibold text-[#705a48] transition hover:border-[#cbb49c] hover:bg-[#fcfaf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732]"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="dashboard-enter overflow-hidden rounded-3xl border border-[#eae4db] bg-white/95 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e7df] p-5 sm:px-6 sm:py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07853]">
                Arsip transaksi
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#3b2b21]">
                Riwayat penjualan
              </h2>
              <p className="mt-1 text-xs text-[#8a7568]">
                {data.length} transaksi tersimpan
              </p>
            </div>

            <button
              type="button"
              onClick={() => void muatPenjualan()}
              disabled={memuat}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#e5ded4] bg-white px-4 py-2 text-sm font-semibold text-[#705a48] transition hover:border-[#cbb49c] hover:bg-[#faf7f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6245] disabled:cursor-wait disabled:opacity-50"
            >
              <span aria-hidden="true" className={memuat ? "animate-spin" : ""}>↻</span>
              {memuat ? "Memuat..." : "Perbarui"}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <label className="relative block">
              <span className="sr-only">Cari transaksi penjualan</span>
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#9b8876]" aria-hidden="true">⌕</span>
              <input
                type="search"
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                placeholder="Cari nomor transaksi, metode, atau catatan"
                className="h-12 w-full rounded-xl border border-[#e5ded4] bg-[#faf8f4] py-3 pl-11 pr-4 text-sm text-[#45372b] outline-none transition placeholder:text-[#a08b7c] hover:border-[#d3c4b2] focus:border-[#8d6245] focus:bg-white focus:ring-4 focus:ring-[#8d6245]/10"
              />
            </label>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-[#eee8df]">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-[#faf8f4]">
                  <tr className="border-b border-[#eee3d8] text-[10px] uppercase tracking-[0.14em] text-[#8a7568]">
                    <th scope="col" className="px-4 py-3.5 font-semibold">Tanggal</th>
                    <th scope="col" className="px-4 py-3.5 font-semibold">No. Transaksi</th>
                    <th scope="col" className="px-4 py-3.5 font-semibold">Pembayaran</th>
                    <th scope="col" className="px-4 py-3.5 font-semibold">Catatan</th>
                    <th scope="col" className="px-4 py-3.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {memuat ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-12 text-center text-sm text-[#8a7568]">
                        <span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-[3px] border-[#e8ded1] border-t-[#70452d]" />
                        Memuat transaksi...
                      </td>
                    </tr>
                  ) : dataTerfilter.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-12 text-center text-sm text-[#8a7568]">
                        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f7eddf] text-lg text-[#91633c]" aria-hidden="true">⌕</span>
                        {pencarian ? "Tidak ada transaksi yang cocok dengan pencarian." : "Belum ada transaksi pada daftar ini."}
                      </td>
                    </tr>
                  ) : (
                    dataTerfilter.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
                        className="dashboard-enter border-b border-[#f5eee8] transition-colors last:border-0 hover:bg-[#fdfaf7]"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-[#766858]">
                          {item.tanggal_penjualan}
                        </td>
                        <td className="px-4 py-4 font-medium text-[#49382b]">
                          {item.nomor_transaksi || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-[#eee5d9] bg-[#faf7f1] px-2.5 py-1 text-[11px] font-semibold text-[#80644e]">
                            {item.metode_pembayaran || "-"}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-4 text-[#8a7568]">
                          {item.catatan || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tracking-tight text-[#49382b] tabular-nums">
                          {formatRupiah(Number(item.total_penjualan || 0))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#938678]">
              Nilai total penjualan dihitung dari seluruh transaksi yang dimuat, tidak hanya hasil pencarian.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
