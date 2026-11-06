"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type BahanBaku = {
  id: number;
  nama_bahan: string;
  satuan: string;
  stok_minimum: number;
  created_at: string;
};

export default function BahanBakuPage() {
  const [bahan, setBahan] = useState<BahanBaku[]>([]);
  const [namaBahan, setNamaBahan] = useState("");
  const [stokMinimum, setStokMinimum] = useState("");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState("");

  async function ambilBahan() {
    setLoading(true);

    const { data, error } = await supabase
      .from("bahan_baku")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setPesan("Gagal mengambil data bahan: " + error.message);
    } else {
      setBahan(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    ambilBahan();
  }, []);

  async function tambahBahan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!namaBahan.trim()) {
      setPesan("Nama bahan harus diisi.");
      return;
    }

    setMenyimpan(true);
    setPesan("");

    const { error } = await supabase.from("bahan_baku").insert([
      {
        nama_bahan: namaBahan.trim(),
        satuan: "unit",
        stok_minimum: Number(stokMinimum) || 0,
      },
    ]);

    if (error) {
      setPesan("Gagal menyimpan bahan: " + error.message);
    } else {
      setNamaBahan("");
      setStokMinimum("");
      setPesan("Bahan berhasil ditambahkan.");
      await ambilBahan();
    }

    setMenyimpan(false);
  }

  async function hapusBahan(id: number) {
    const yakin = window.confirm("Yakin ingin menghapus bahan ini?");
    if (!yakin) return;

    const { error } = await supabase
      .from("bahan_baku")
      .delete()
      .eq("id", id);

    if (error) {
      setPesan("Gagal menghapus bahan: " + error.message);
    } else {
      setPesan("Bahan berhasil dihapus.");
      await ambilBahan();
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-4 py-8 text-[#38271f] md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-[#a4774d]">
            PURI DONUT’S
          </p>

          <h1 className="text-3xl font-bold">
            Pencatatan Bahan Baku
          </h1>

          <p className="mt-2 text-sm text-[#88796e]">
            Kelola daftar bahan baku yang digunakan dalam produksi donat.
          </p>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#88796e]">Total jenis bahan</p>
            <p className="mt-2 text-3xl font-bold">{bahan.length}</p>
          </div>

          <div className="rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#88796e]">Status pencatatan</p>
            <p className="mt-2 text-lg font-semibold text-[#8b633d]">
              Daftar bahan baku
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Tambah Bahan Baru</h2>

          <form onSubmit={tambahBahan} className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Nama bahan
              </label>
              <input
                type="text"
                value={namaBahan}
                onChange={(e) => setNamaBahan(e.target.value)}
                placeholder="Contoh: Tepung terigu"
                className="w-full rounded-xl border border-[#e5d8c8] px-4 py-3 outline-none transition focus:border-[#9b7049]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Stok minimum
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={stokMinimum}
                onChange={(e) => setStokMinimum(e.target.value)}
                placeholder="Contoh: 5"
                className="w-full rounded-xl border border-[#e5d8c8] px-4 py-3 outline-none transition focus:border-[#9b7049]"
              />
            </div>

            <button
              type="submit"
              disabled={menyimpan}
              className="rounded-xl bg-[#795238] px-6 py-3 font-semibold text-white transition hover:bg-[#5f3e2b] disabled:opacity-60 md:col-span-3"
            >
              {menyimpan ? "Menyimpan..." : "+ Tambahkan Bahan"}
            </button>
          </form>

          {pesan && (
            <p className="mt-4 rounded-xl bg-[#f8f1e8] p-3 text-sm text-[#795238]">
              {pesan}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Daftar Bahan Baku</h2>
              <p className="mt-1 text-sm text-[#88796e]">
                Bahan yang sudah terdaftar.
              </p>
            </div>

            <button
              onClick={ambilBahan}
              className="rounded-lg border border-[#e5d8c8] px-4 py-2 text-sm font-medium hover:bg-[#f8f5ef]"
            >
              Muat ulang
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-center text-[#88796e]">
              Memuat data bahan...
            </p>
          ) : bahan.length === 0 ? (
            <p className="py-10 text-center text-[#88796e]">
              Belum ada bahan baku yang dicatat.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eadfce] text-[#88796e]">
                    <th className="px-3 py-4">No.</th>
                    <th className="px-3 py-4">Nama bahan</th>
                    <th className="px-3 py-4">Stok minimum</th>
                    <th className="px-3 py-4 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {bahan.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#f0e9df] last:border-0"
                    >
                      <td className="px-3 py-4">{index + 1}</td>
                      <td className="px-3 py-4 font-semibold">
                        {item.nama_bahan}
                      </td>
                      <td className="px-3 py-4">
                        {item.stok_minimum}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <button
                          onClick={() => hapusBahan(item.id)}
                          className="rounded-lg px-3 py-2 font-medium text-red-600 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}