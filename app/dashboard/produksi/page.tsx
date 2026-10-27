
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ServiceNavigation from "../service-navigation";

type Produk = {
  id: number;
  nama_produk: string;
};

type Produksi = {
  id: number;
  tanggal_produksi: string;
  produk_id: number;
  jumlah_produksi: number;
  catatan: string | null;
};

export default function ProduksiPage() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [produksi, setProduksi] = useState<Produksi[]>([]);
  const [tanggal, setTanggal] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [produkId, setProdukId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState("");

  const muatData = useCallback(async () => {
    setLoading(true);
    setPesan("");

    const [produkRes, produksiRes] = await Promise.all([
      supabase
        .from("produk")
        .select("id, nama_produk")
        .eq("status_aktif", true)
        .order("nama_produk"),
      supabase
        .from("produksi")
        .select(
          "id, tanggal_produksi, produk_id, jumlah_produksi, catatan"
        )
        .order("tanggal_produksi", { ascending: false })
        .order("id", { ascending: false }),
    ]);

    if (produkRes.error || produksiRes.error) {
      setPesan(
        produkRes.error?.message ||
        produksiRes.error?.message ||
        "Data gagal dimuat."
      );
    } else {
      setProduk((produkRes.data || []) as Produk[]);
      setProduksi((produksiRes.data || []) as Produksi[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void muatData();
  }, [muatData]);

  async function simpanProduksi(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setPesan("");

    if (!produkId || !tanggal || !jumlah || Number(jumlah) <= 0) {
      setPesan("Lengkapi tanggal, produk, dan jumlah produksi.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("produksi").insert({
      tanggal_produksi: tanggal,
      produk_id: Number(produkId),
      jumlah_produksi: Number(jumlah),
      catatan: catatan.trim() || null,
    });

    if (error) {
      setPesan("Gagal menyimpan: " + error.message);
    } else {
      setPesan("Data produksi berhasil disimpan.");
      setJumlah("");
      setCatatan("");
      await muatData();
    }

    setSaving(false);
  }

  const totalProduksi = produksi.reduce(
    (total, item) => total + Number(item.jumlah_produksi || 0),
    0
  );

  const namaProduk = (id: number) =>
    produk.find((item) => item.id === id)?.nama_produk ||
    `Produk ID ${id}`;

  return (
    <main className="dashboard-background min-h-screen px-4 py-6 text-[#38251c] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl space-y-7">
        <ServiceNavigation activeHref="/dashboard/produksi" />
        <header className="dashboard-enter flex flex-col justify-between gap-5 rounded-3xl border border-[#eae4db]/90 bg-white/85 p-5 shadow-[0_12px_38px_-28px_rgba(64,43,26,0.35)] backdrop-blur-sm sm:flex-row sm:items-center sm:p-7">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfd3] bg-[#fcfaf7] px-3 py-1.5 text-xs font-semibold text-[#80644e] transition hover:border-[#d7bea5] hover:bg-white hover:text-[#5b3828] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732]"
            >
              <span aria-hidden="true">←</span> Kembali ke Dashboard
            </Link>

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#a36c38]">
              Puri Donut&apos;s <span className="px-1 text-[#c5b6a6]">/</span> Operasional
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
              Produksi Donat
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#8a7568]">
              Catat hasil produksi dan pantau riwayatnya dengan mudah.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#f0e7df] bg-[#fcfaf7] px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1dc] text-lg text-[#986020]" aria-hidden="true">
              ✳
            </span>
            <div>
              <p className="text-xs font-semibold text-[#78695a]">Produk aktif</p>
              <p className="mt-0.5 text-sm font-bold text-[#49382b]">{produk.length} produk tersedia</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="dashboard-enter dashboard-card relative overflow-hidden rounded-3xl border border-[#7c4b2d] bg-gradient-to-br from-[#75452c] via-[#8f5a36] to-[#a76f43] p-5 text-white shadow-[0_14px_34px_-22px_rgba(64,43,26,0.5)] sm:p-6">
            <div aria-hidden="true" className="absolute -right-9 -top-12 h-36 w-36 rounded-full border-[22px] border-white/[0.07]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white/80">Total catatan produksi</p>
                <p className="mt-4 text-3xl font-bold tracking-[-0.04em] tabular-nums">
                  {produksi.length.toLocaleString("id-ID")}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl" aria-hidden="true">
                ▤
              </span>
            </div>
            <p className="relative mt-3 text-xs leading-5 text-white/70">
              Seluruh catatan yang tersimpan
            </p>
          </article>

          <article
            className="dashboard-enter dashboard-card rounded-3xl border border-[#eae4db] bg-white/90 p-5 shadow-[0_10px_30px_-22px_rgba(64,43,26,0.28)] sm:p-6"
            style={{ animationDelay: "90ms" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#78695a]">Total jumlah produksi</p>
                <p className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#35291f] tabular-nums">
                  {totalProduksi.toLocaleString("id-ID")}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f4e9] text-lg text-[#39764a]" aria-hidden="true">
                ↗
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#a08b7c]">
              Akumulasi seluruh catatan produksi
            </p>
          </article>
        </section>

        <section className="dashboard-enter rounded-3xl border border-[#eae4db] bg-white p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1dc] text-xl text-[#986020]" aria-hidden="true">
              ＋
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-[-0.03em]">Tambah Produksi</h2>
              <p className="mt-1 text-sm text-[#8a7568]">
                Isi data produksi yang ingin dicatat.
              </p>
            </div>
          </div>

          <form
            onSubmit={simpanProduksi}
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <label className="block text-sm font-semibold text-[#59483a]">
              Tanggal produksi
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="mt-2 h-12 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 text-sm font-normal text-[#45372b] outline-none transition focus:border-[#a96732] focus:bg-white focus:ring-4 focus:ring-[#a96732]/10"
              />
            </label>

            <label className="block text-sm font-semibold text-[#59483a]">
              Nama produk
              <select
                value={produkId}
                onChange={(e) => setProdukId(e.target.value)}
                required
                className="mt-2 h-12 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 text-sm font-normal text-[#45372b] outline-none transition focus:border-[#a96732] focus:bg-white focus:ring-4 focus:ring-[#a96732]/10"
              >
                <option value="">Pilih produk</option>
                {produk.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama_produk}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#59483a]">
              Jumlah produksi
              <input
                type="number"
                min="1"
                step="1"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="Contoh: 100"
                required
                className="mt-2 h-12 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#b0a194] focus:border-[#a96732] focus:bg-white focus:ring-4 focus:ring-[#a96732]/10"
              />
            </label>

            <label className="block text-sm font-semibold text-[#59483a]">
              Catatan <span className="font-normal text-[#a08b7c]">(opsional)</span>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Produksi pagi"
                className="mt-2 h-12 w-full rounded-xl border border-[#e5d8cb] bg-[#fcfbf9] px-4 text-sm font-normal text-[#45372b] outline-none transition placeholder:text-[#b0a194] focus:border-[#a96732] focus:bg-white focus:ring-4 focus:ring-[#a96732]/10"
              />
            </label>

            {pesan && (
              <p
                role={pesan.startsWith("Gagal") ? "alert" : "status"}
                className={`rounded-xl border p-3 text-sm sm:col-span-2 ${
                  pesan.startsWith("Gagal")
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {pesan}
              </p>
            )}

            {produk.length === 0 && !loading && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2">
                Belum ada produk aktif. Periksa data pada tabel produk
                sebelum mencatat produksi.
              </p>
            )}

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving || loading || produk.length === 0}
                className="min-h-12 rounded-xl bg-gradient-to-br from-[#8b5735] to-[#70452f] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(112,69,47,0.7)] transition duration-200 hover:-translate-y-0.5 hover:from-[#78492e] hover:to-[#573522] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70452f] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Produksi"}
              </button>
            </div>
          </form>
        </section>

        <section className="dashboard-enter overflow-hidden rounded-3xl border border-[#eae4db] bg-white/95 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e7df] p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-bold tracking-[-0.03em]">Riwayat Produksi</h2>
              <p className="mt-1 text-sm text-[#8a7568]">
                Daftar hasil produksi yang sudah tercatat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void muatData()}
              disabled={loading}
              className="min-h-10 rounded-xl border border-[#e5d8cb] bg-white px-4 py-2 text-sm font-semibold text-[#705a48] transition hover:border-[#cbb49c] hover:bg-[#fcfaf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Memuat..." : "↻ Muat Ulang"}
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-[#8a7568]" role="status">Memuat data produksi...</p>
          ) : produksi.length === 0 ? (
            <p className="p-6 text-sm text-[#8c7865]">
              Belum ada catatan produksi.
            </p>
          ) : (
            <div className="overflow-x-auto p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-[#f0e7df]">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-[#faf7f2] text-[11px] uppercase tracking-[0.1em] text-[#8a7568]">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 font-bold">Tanggal</th>
                      <th scope="col" className="px-4 py-3.5 font-bold">Produk</th>
                      <th scope="col" className="px-4 py-3.5 text-right font-bold">Jumlah</th>
                      <th scope="col" className="px-4 py-3.5 font-bold">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produksi.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
                        className="dashboard-enter border-t border-[#f5eee8] transition-colors first:border-0 hover:bg-[#fdfaf7]"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-[#766858]">
                          {item.tanggal_produksi}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#49382b]">
                          {namaProduk(item.produk_id)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-[#49382b] tabular-nums">
                          {Number(item.jumlah_produksi).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-4 text-[#8a7568]">
                          {item.catatan || "—"}
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
