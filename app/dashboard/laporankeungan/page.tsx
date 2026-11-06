
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF, { type jsPDF as JsPDFDocument } from "jspdf";
import autoTable, { type Table } from "jspdf-autotable";

type Penjualan = {
  total_penjualan: number;
  tanggal_penjualan: string;
};

type Pengeluaran = {
  kategori: string;
  jumlah: number;
  tanggal_pengeluaran: string;
};

type LaporanData = {
  penjualan: Penjualan[];
  pengeluaran: Pengeluaran[];
};

type JsPdfWithAutoTable = JsPDFDocument & {
  lastAutoTable: Table;
};

async function ambilDataLaporan(
  tanggalMulai: string,
  tanggalAkhir: string
): Promise<LaporanData> {
  const { data: dataPenjualan, error: errorPenjualan } = await supabase
    .from("penjualan")
    .select("total_penjualan, tanggal_penjualan")
    .is("deleted_at", null)
    .gte("tanggal_penjualan", tanggalMulai)
    .lte("tanggal_penjualan", tanggalAkhir);

  if (errorPenjualan) {
    throw new Error("Gagal mengambil pemasukan: " + errorPenjualan.message);
  }

  const { data: dataPengeluaran, error: errorPengeluaran } = await supabase
    .from("pengeluaran")
    .select("kategori, jumlah, tanggal_pengeluaran")
    .gte("tanggal_pengeluaran", tanggalMulai)
    .lte("tanggal_pengeluaran", tanggalAkhir);

  if (errorPengeluaran) {
    throw new Error("Gagal mengambil pengeluaran: " + errorPengeluaran.message);
  }

  return {
    penjualan: dataPenjualan || [],
    pengeluaran: dataPengeluaran || [],
  };
}

function pesanKesalahan(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan saat mengambil laporan.";
}

export default function LaporanKeuanganPage() {
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [tanggalMulai, setTanggalMulai] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10)
  );
  const [tanggalAkhir, setTanggalAkhir] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const periodeAwal = useRef({ tanggalMulai, tanggalAkhir });
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(true);
  const [pesan, setPesan] = useState("");

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka || 0);

  const totalPemasukan = penjualan.reduce(
    (total, item) => total + Number(item.total_penjualan || 0),
    0
  );

  const totalPengeluaran = pengeluaran.reduce(
    (total, item) => total + Number(item.jumlah || 0),
    0
  );

  const hasilLabaRugi = totalPemasukan - totalPengeluaran;

  async function ambilLaporan() {
    if (tanggalMulai > tanggalAkhir) {
      setPesan("Tanggal mulai tidak boleh melebihi tanggal akhir.");
      return;
    }

    setLoading(true);
    setPesan("");

    try {
      const data = await ambilDataLaporan(tanggalMulai, tanggalAkhir);
      setPenjualan(data.penjualan);
      setPengeluaran(data.pengeluaran);
    } catch (error) {
      setPesan(pesanKesalahan(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let masihAktif = true;
    const { tanggalMulai: mulai, tanggalAkhir: akhir } = periodeAwal.current;

    void ambilDataLaporan(mulai, akhir)
      .then((data) => {
        if (!masihAktif) return;
        setPenjualan(data.penjualan);
        setPengeluaran(data.pengeluaran);
      })
      .catch((error: unknown) => {
        if (masihAktif) setPesan(pesanKesalahan(error));
      })
      .finally(() => {
        if (masihAktif) setLoading(false);
      });

    return () => {
      masihAktif = false;
    };
  }, []);

  function unduhPDF() {
    const pdf = new jsPDF();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("PURI DONUT'S", 105, 18, { align: "center" });

    pdf.setFontSize(14);
    pdf.text("LAPORAN LABA RUGI", 105, 28, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Periode: ${tanggalMulai} sampai ${tanggalAkhir}`, 14, 40);

    autoTable(pdf, {
      startY: 48,
      head: [["Keterangan", "Jumlah"]],
      body: [
        ["Total Pemasukan", formatRupiah(totalPemasukan)],
        ["Total Pengeluaran", formatRupiah(totalPengeluaran)],
        [
          hasilLabaRugi >= 0 ? "Laba Bersih" : "Rugi Bersih",
          formatRupiah(Math.abs(hasilLabaRugi)),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [121, 82, 56] },
    });

    const posisi =
      (pdf as JsPdfWithAutoTable).lastAutoTable.finalY! + 15;

    pdf.setFont("helvetica", "bold");
    pdf.text("CATATAN PEMILIK", 14, posisi);

    pdf.setFont("helvetica", "normal");
    const barisCatatan = pdf.splitTextToSize(
      catatan.trim() || "Tidak ada catatan.",
      180
    );
    pdf.text(barisCatatan, 14, posisi + 8);

    const posisiDetail = posisi + 20 + barisCatatan.length * 5;

    autoTable(pdf, {
      startY: posisiDetail,
      head: [["No.", "Tanggal", "Kategori", "Jumlah"]],
      body:
        pengeluaran.length > 0
          ? pengeluaran.map((item, index) => [
              index + 1,
              item.tanggal_pengeluaran,
              item.kategori,
              formatRupiah(Number(item.jumlah)),
            ])
          : [["-", "-", "Belum ada pengeluaran", "-"]],
      theme: "striped",
      headStyles: { fillColor: [121, 82, 56] },
    });

    pdf.save(`Laporan-Keuangan-Puri-Donuts-${tanggalMulai}.pdf`);
  }

  function cetakLaporan() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-4 py-8 text-[#38271f] md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-bold tracking-[0.25em] text-[#a4774d]">
            PURI DONUT&apos;S
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Laporan Keuangan
          </h1>
          <p className="mt-2 text-sm text-[#88796e]">
            Ringkasan pemasukan, pengeluaran, dan hasil laba rugi usaha.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Pilih Periode Laporan</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Tanggal mulai
              </label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full rounded-xl border border-[#e5d8c8] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Tanggal akhir
              </label>
              <input
                type="date"
                value={tanggalAkhir}
                onChange={(e) => setTanggalAkhir(e.target.value)}
                className="w-full rounded-xl border border-[#e5d8c8] px-4 py-3"
              />
            </div>

            <button
              onClick={ambilLaporan}
              disabled={loading}
              className="self-end rounded-xl bg-[#795238] px-5 py-3 font-semibold text-white hover:bg-[#5f3e2b] disabled:opacity-60"
            >
              {loading ? "Memuat..." : "Tampilkan Laporan"}
            </button>
          </div>

          {pesan && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {pesan}
            </p>
          )}
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#88796e]">Total Pemasukan</p>
            <h2 className="mt-3 text-2xl font-bold">
              {formatRupiah(totalPemasukan)}
            </h2>
          </div>

          <div className="rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#88796e]">Total Pengeluaran</p>
            <h2 className="mt-3 text-2xl font-bold">
              {formatRupiah(totalPengeluaran)}
            </h2>
          </div>

          <div className="rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#88796e]">
              {hasilLabaRugi >= 0 ? "Laba Bersih" : "Rugi Bersih"}
            </p>
            <h2
              className={`mt-3 text-2xl font-bold ${
                hasilLabaRugi >= 0 ? "text-green-700" : "text-red-600"
              }`}
            >
              {formatRupiah(Math.abs(hasilLabaRugi))}
            </h2>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Rincian Pengeluaran</h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#eadfce] text-[#88796e]">
                  <th className="px-3 py-3">No.</th>
                  <th className="px-3 py-3">Tanggal</th>
                  <th className="px-3 py-3">Kategori</th>
                  <th className="px-3 py-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {pengeluaran.map((item, index) => (
                  <tr key={index} className="border-b border-[#f0e9df]">
                    <td className="px-3 py-3">{index + 1}</td>
                    <td className="px-3 py-3">{item.tanggal_pengeluaran}</td>
                    <td className="px-3 py-3">{item.kategori}</td>
                    <td className="px-3 py-3 text-right">
                      {formatRupiah(Number(item.jumlah))}
                    </td>
                  </tr>
                ))}

                {pengeluaran.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#88796e]">
                      Belum ada data pengeluaran pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-[#eadfce] bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-bold">Catatan Laba Rugi</h2>
          <p className="mb-4 text-sm text-[#88796e]">
            Tambahkan keterangan atau evaluasi keuangan untuk periode ini.
          </p>

          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={4}
            placeholder="Tuliskan catatan pemilik di sini..."
            className="w-full rounded-xl border border-[#e5d8c8] p-4 outline-none focus:border-[#9b7049]"
          />
          <p className="mt-2 text-xs text-[#88796e]">
            Catatan ini akan disertakan dalam PDF, tetapi belum disimpan permanen.
          </p>
        </section>

        <section className="flex flex-wrap gap-3">
          <button
            onClick={unduhPDF}
            className="rounded-xl bg-[#795238] px-6 py-3 font-semibold text-white hover:bg-[#5f3e2b]"
          >
            Unduh PDF
          </button>

          <button
            onClick={cetakLaporan}
            className="rounded-xl border border-[#795238] px-6 py-3 font-semibold text-[#795238] hover:bg-[#f0e8df]"
          >
            Cetak Laporan
          </button>
        </section>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          button,
          input,
          textarea {
            display: none !important;
          }

          main {
            background: white !important;
            padding: 0 !important;
          }

          section {
            break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}
