
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Plus,
  Users,
  UserRound,
  BriefcaseBusiness,
  Wallet,
  Phone,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Check,
  UserCheck,
  UserX,
  SlidersHorizontal,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock3,
  CalendarCheck,
  Banknote,
  History,
  Cloud,
  CloudOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ServiceNavigation from "../service-navigation";

type Employee = {
  id: number;
  clientId: string;
  nama: string;
  jabatan: string;
  telepon: string;
  tanggalMasuk: string;
  gaji: number;
  status: "Aktif" | "Nonaktif";
  diarsipkan: boolean;
};

type PayrollPayment = {
  id: number;
  clientId: string;
  employeeClientId: string;
  karyawanId: number;
  employeeName: string;
  tanggalPembayaran: string;
  periodeBulan: string;
  jumlahGaji: number;
  catatan: string;
};

type OfflineData = {
  employees: Employee[];
  payments: PayrollPayment[];
  pendingEmployees: Employee[];
  pendingPayments: PayrollPayment[];
  pendingPaymentDeletes: string[];
};

type PayrollForm = {
  employeeClientId: string;
  tanggalPembayaran: string;
  periodeBulan: string;
  jumlahGaji: string;
  catatan: string;
};

const dataOfflineKosong: OfflineData = {
  employees: [],
  payments: [],
  pendingEmployees: [],
  pendingPayments: [],
  pendingPaymentDeletes: [],
};

function dengarkanKoneksi(perbarui: () => void) {
  window.addEventListener("online", perbarui);
  window.addEventListener("offline", perbarui);
  return () => {
    window.removeEventListener("online", perbarui);
    window.removeEventListener("offline", perbarui);
  };
}

const statusKoneksi = () => navigator.onLine;
const statusKoneksiServer = () => false;

const bulanIni = () => {
  const sekarang = new Date();
  return `${sekarang.getFullYear()}-${String(
    sekarang.getMonth() + 1
  ).padStart(2, "0")}-01`;
};

const hariIni = () => {
  const sekarang = new Date();
  return `${sekarang.getFullYear()}-${String(
    sekarang.getMonth() + 1
  ).padStart(2, "0")}-${String(sekarang.getDate()).padStart(2, "0")}`;
};

function ubahBulan(tanggal: string, jumlah: number) {
  const [tahun, bulan] = tanggal.slice(0, 7).split("-").map(Number);
  const hasil = new Date(tahun, bulan - 1 + jumlah, 1);
  return `${hasil.getFullYear()}-${String(hasil.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

function formatBulan(periode: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periode)) return "Pilih periode";
  return new Date(`${periode.slice(0, 7)}-01T00:00:00`).toLocaleDateString(
    "id-ID",
    { month: "long", year: "numeric" }
  );
}

function gabungkanLokal(
  remote: OfflineData,
  lokal: OfflineData
): OfflineData {
  const employees = new Map(
    remote.employees.map((employee) => [employee.clientId, employee])
  );
  lokal.pendingEmployees.forEach((employee) =>
    employees.set(employee.clientId, employee)
  );

  const payments = new Map(
    remote.payments.map((payment) => [payment.clientId, payment])
  );
  lokal.pendingPaymentDeletes.forEach((clientId) => payments.delete(clientId));
  lokal.pendingPayments.forEach((payment) =>
    payments.set(payment.clientId, payment)
  );

  return {
    ...lokal,
    employees: [...employees.values()],
    payments: [...payments.values()],
  };
}

function validasiCache(value: unknown): OfflineData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<OfflineData>;
  if (
    !Array.isArray(data.employees) ||
    !Array.isArray(data.payments) ||
    !Array.isArray(data.pendingEmployees) ||
    !Array.isArray(data.pendingPayments) ||
    !Array.isArray(data.pendingPaymentDeletes)
  ) {
    return null;
  }
  return data as OfflineData;
}

const formatRupiah = (nominal: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nominal);

const formatTanggal = (tanggal: string) => {
  if (!tanggal) return "-";

  return new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formAwal = {
  nama: "",
  jabatan: "",
  telepon: "",
  tanggalMasuk: "",
  gaji: "",
  status: "Aktif" as "Aktif" | "Nonaktif",
};

export default function DataKaryawanPage() {
  const [data, setData] = useState<OfflineData>(dataOfflineKosong);
  const [siap, setSiap] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const online = useSyncExternalStore(
    dengarkanKoneksi,
    statusKoneksi,
    statusKoneksiServer
  );
  const [sinkronisasi, setSinkronisasi] = useState(false);
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState<"sukses" | "error">("sukses");
  const [pencarian, setPencarian] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [modeEdit, setModeEdit] = useState(false);
  const [idEdit, setIdEdit] = useState<string | null>(null);
  const [form, setForm] = useState(formAwal);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<string | null>(null);
  const [periode, setPeriode] = useState(bulanIni());
  const [formGajiTerbuka, setFormGajiTerbuka] = useState(false);
  const [pembayaranEdit, setPembayaranEdit] =
    useState<PayrollPayment | null>(null);
  const [konfirmasiHapusGaji, setKonfirmasiHapusGaji] =
    useState<PayrollPayment | null>(null);
  const [formGaji, setFormGaji] = useState<PayrollForm>({
    employeeClientId: "",
    tanggalPembayaran: hariIni(),
    periodeBulan: bulanIni(),
    jumlahGaji: "",
    catatan: "",
  });
  const [filterRiwayat, setFilterRiwayat] = useState("");
  const dataRef = useRef(dataOfflineKosong);
  const storageKeyRef = useRef("");
  const idLokalBerikutnya = useRef(-1);
  const sinkronisasiAktif = useRef(false);

  const karyawan = data.employees.filter((item) => !item.diarsipkan);
  const pembayaranPeriode = data.payments.filter(
    (item) => item.periodeBulan === periode
  );
  const pembayaranTampil = pembayaranPeriode.filter((item) => {
    const employee = data.employees.find(
      (karyawan) => karyawan.clientId === item.employeeClientId
    );
    const kata = filterRiwayat.trim().toLocaleLowerCase("id-ID");
    return (
      !kata ||
      item.employeeName.toLocaleLowerCase("id-ID").includes(kata) ||
      (employee?.jabatan || "").toLocaleLowerCase("id-ID").includes(kata)
    );
  });

  const jumlahAktif = karyawan.filter(
    (item) => item.status === "Aktif"
  ).length;

  const jumlahNonaktif = karyawan.filter(
    (item) => item.status === "Nonaktif"
  ).length;

  const totalGaji = karyawan
    .filter((item) => item.status === "Aktif")
    .reduce((total, item) => total + item.gaji, 0);

  const totalSudahDibayar = pembayaranPeriode.reduce(
    (total, item) => total + item.jumlahGaji,
    0
  );
  const lunasCount = karyawan.filter((item) => {
    if (item.status !== "Aktif") return false;
    const totalKaryawan = pembayaranPeriode
      .filter((pembayaran) => pembayaran.employeeClientId === item.clientId)
      .reduce((total, pembayaran) => total + pembayaran.jumlahGaji, 0);
    return totalKaryawan >= item.gaji;
  }).length;
  const totalTertunda = karyawan
    .filter((item) => item.status === "Aktif")
    .reduce((total, item) => {
      const sudahDibayar = pembayaranPeriode
        .filter((pembayaran) => pembayaran.employeeClientId === item.clientId)
        .reduce((jumlah, pembayaran) => jumlah + pembayaran.jumlahGaji, 0);
      return total + Math.max(item.gaji - sudahDibayar, 0);
    }, 0);
  const jumlahPerubahanTertunda =
    data.pendingEmployees.length +
    data.pendingPayments.length +
    data.pendingPaymentDeletes.length;

  const hasilFilter = karyawan.filter((item) => {
    const cocokNama =
      item.nama.toLocaleLowerCase("id-ID").includes(pencarian.toLocaleLowerCase("id-ID")) ||
      item.jabatan.toLocaleLowerCase("id-ID").includes(pencarian.toLocaleLowerCase("id-ID"));
    const cocokStatus =
      filterStatus === "Semua" || item.status === filterStatus;
    return cocokNama && cocokStatus;
  });

  const simpanCache = useCallback(
    (berikutnya: OfflineData): boolean => {
      dataRef.current = berikutnya;
      setData(berikutnya);
      if (!storageKeyRef.current) return true;

      try {
        localStorage.setItem(
          storageKeyRef.current,
          JSON.stringify(berikutnya)
        );
        return true;
      } catch {
        setJenisPesan("error");
        setPesan(
          "Perubahan tampil di halaman, tetapi cache offline gagal disimpan di perangkat."
        );
        return false;
      }
    },
    []
  );

  const muatDariSupabase = useCallback(
    async (dataLokal: OfflineData = dataRef.current) => {
      const [hasilKaryawan, hasilPembayaran] = await Promise.all([
        supabase
          .from("karyawan")
          .select(
            "id,client_id,nama,jabatan,telepon,tanggal_masuk,gaji_pokok,status,diarsipkan"
          )
          .order("id", { ascending: false }),
        supabase
          .from("pembayaran_gaji")
          .select(
            "id,client_id,karyawan_id,tanggal_pembayaran,periode_bulan,jumlah_gaji,catatan"
          )
          .order("tanggal_pembayaran", { ascending: false }),
      ]);

      if (hasilKaryawan.error) {
        throw new Error(
          "Gagal memuat data karyawan: " + hasilKaryawan.error.message
        );
      }
      if (hasilPembayaran.error) {
        throw new Error(
          "Gagal memuat riwayat gaji: " + hasilPembayaran.error.message
        );
      }

      const karyawanServer: Employee[] = (hasilKaryawan.data || []).map(
        (row) => ({
          id: Number(row.id),
          clientId: String(row.client_id),
          nama: row.nama || "",
          jabatan: row.jabatan || "",
          telepon: row.telepon || "",
          tanggalMasuk: row.tanggal_masuk || "",
          gaji: Number(row.gaji_pokok || 0),
          status: row.status === "Nonaktif" ? "Nonaktif" : "Aktif",
          diarsipkan: Boolean(row.diarsipkan),
        })
      );
      const namaKaryawan = new Map(
        karyawanServer.map((item) => [item.id, item])
      );
      const pembayaranServer: PayrollPayment[] = (
        hasilPembayaran.data || []
      ).map((row) => {
        const karyawanRow = namaKaryawan.get(Number(row.karyawan_id));
        return {
          id: Number(row.id),
          clientId: String(row.client_id),
          employeeClientId: karyawanRow?.clientId || "",
          karyawanId: Number(row.karyawan_id),
          employeeName: karyawanRow?.nama || "Karyawan tidak ditemukan",
          tanggalPembayaran: row.tanggal_pembayaran,
          periodeBulan: String(row.periode_bulan).slice(0, 10),
          jumlahGaji: Number(row.jumlah_gaji || 0),
          catatan: row.catatan || "",
        };
      });

      const hasilGabung = gabungkanLokal(
        {
          employees: karyawanServer,
          payments: pembayaranServer,
          pendingEmployees: dataLokal.pendingEmployees,
          pendingPayments: dataLokal.pendingPayments,
          pendingPaymentDeletes: dataLokal.pendingPaymentDeletes,
        },
        dataLokal
      );
      simpanCache(hasilGabung);
      return hasilGabung;
    },
    [simpanCache]
  );

  const sinkronkanPerubahan = useCallback(
    async (queue: OfflineData = dataRef.current): Promise<OfflineData> => {
      if (sinkronisasiAktif.current || !navigator.onLine) return queue;
      if (
        !queue.pendingEmployees.length &&
        !queue.pendingPayments.length &&
        !queue.pendingPaymentDeletes.length
      ) {
        return queue;
      }

      sinkronisasiAktif.current = true;
      setSinkronisasi(true);
      try {
        if (queue.pendingEmployees.length) {
          const { error } = await supabase.from("karyawan").upsert(
            queue.pendingEmployees.map((item) => ({
              client_id: item.clientId,
              nama: item.nama,
              jabatan: item.jabatan,
              telepon: item.telepon,
              tanggal_masuk: item.tanggalMasuk,
              gaji_pokok: item.gaji,
              status: item.status,
              diarsipkan: item.diarsipkan,
            })),
            { onConflict: "client_id" }
          );
          if (error) throw new Error("Gagal menyinkronkan karyawan: " + error.message);
        }

        if (queue.pendingPaymentDeletes.length) {
          const { error } = await supabase
            .from("pembayaran_gaji")
            .delete()
            .in("client_id", queue.pendingPaymentDeletes);
          if (error) throw new Error("Gagal menghapus pembayaran: " + error.message);
        }

        if (queue.pendingPayments.length) {
          const { data: daftarId, error: errorId } = await supabase
            .from("karyawan")
            .select("id,client_id");
          if (errorId) {
            throw new Error("Gagal mencocokkan karyawan: " + errorId.message);
          }
          const idKaryawan = new Map(
            (daftarId || []).map((item) => [
              String(item.client_id),
              Number(item.id),
            ])
          );
          const pembayaranSiap = queue.pendingPayments.map((item) => {
            const karyawanId = idKaryawan.get(item.employeeClientId);
            if (!karyawanId) {
              throw new Error(
                `Karyawan untuk pembayaran ${item.employeeName} belum tersinkron.`
              );
            }
            return {
              client_id: item.clientId,
              karyawan_id: karyawanId,
              tanggal_pembayaran: item.tanggalPembayaran,
              periode_bulan: item.periodeBulan,
              jumlah_gaji: item.jumlahGaji,
              catatan: item.catatan || null,
            };
          });
          const { error } = await supabase
            .from("pembayaran_gaji")
            .upsert(pembayaranSiap, { onConflict: "client_id" });
          if (error) {
            throw new Error("Gagal menyinkronkan pembayaran gaji: " + error.message);
          }
        }

        const terkini = dataRef.current;
        const pendingEmployees = terkini.pendingEmployees.filter(
          (item) =>
            !queue.pendingEmployees.some(
              (terkirim) =>
                terkirim.clientId === item.clientId &&
                JSON.stringify(terkirim) === JSON.stringify(item)
            )
        );
        const pendingPayments = terkini.pendingPayments.filter(
          (item) =>
            !queue.pendingPayments.some(
              (terkirim) =>
                terkirim.clientId === item.clientId &&
                JSON.stringify(terkirim) === JSON.stringify(item)
            )
        );
        const pendingPaymentDeletes = terkini.pendingPaymentDeletes.filter(
          (id) => !queue.pendingPaymentDeletes.includes(id)
        );
        const antreanSelesai = {
          ...terkini,
          pendingEmployees,
          pendingPayments,
          pendingPaymentDeletes,
        };
        const cacheTersimpan = simpanCache(antreanSelesai);
        if (cacheTersimpan) {
          setJenisPesan("sukses");
          setPesan("Perubahan berhasil disinkronkan ke Supabase.");
        }
        return antreanSelesai;
      } catch (error) {
        setJenisPesan("error");
        setPesan(
          error instanceof Error
            ? error.message
            : "Sinkronisasi gagal. Perubahan tetap tersimpan di perangkat."
        );
        return dataRef.current;
      } finally {
        sinkronisasiAktif.current = false;
        setSinkronisasi(false);
      }
    },
    [simpanCache]
  );

  const muatDanSinkronkan = useCallback(async () => {
    if (!navigator.onLine) return;
    const antrean = await sinkronkanPerubahan(dataRef.current);
    try {
      await muatDariSupabase(antrean);
    } catch (error) {
      setJenisPesan("error");
      setPesan(
        error instanceof Error
          ? error.message
          : "Gagal memuat data dari Supabase."
      );
    }
  }, [muatDariSupabase, sinkronkanPerubahan]);

  useEffect(() => {
    let masihAktif = true;

    const ketikaOnline = () => {
      void muatDanSinkronkan();
    };

    window.addEventListener("online", ketikaOnline);

    async function mulai() {
      try {
        const { data: sesi, error } = await supabase.auth.getSession();
        if (error) throw new Error("Gagal membaca sesi akun: " + error.message);
        const userId = sesi.session?.user.id;
        if (!userId) {
          throw new Error("Sesi akun tidak ditemukan. Silakan masuk kembali.");
        }

        storageKeyRef.current = `puri-donuts:payroll:${userId}`;
        let dataLokal = dataOfflineKosong;
        try {
          const tersimpan = localStorage.getItem(storageKeyRef.current);
          if (tersimpan) {
            const cache = validasiCache(JSON.parse(tersimpan));
            if (!cache) throw new Error("Format cache tidak sesuai.");
            dataLokal = cache;
          }
        } catch (errorCache) {
          throw new Error(
            errorCache instanceof Error
              ? "Cache offline rusak: " + errorCache.message
              : "Cache offline tidak dapat dibaca."
          );
        }
        const idLokalTerkecil = [
          ...dataLokal.employees.map((item) => item.id),
          ...dataLokal.payments.map((item) => item.id),
        ].filter((id) => id < 0);
        idLokalBerikutnya.current =
          idLokalTerkecil.length > 0
            ? Math.min(...idLokalTerkecil) - 1
            : -1;

        if (!masihAktif) return;
        dataRef.current = dataLokal;
        setData(dataLokal);
        if (navigator.onLine) {
          const antrean = await sinkronkanPerubahan(dataLokal);
          try {
            await muatDariSupabase(antrean);
          } catch (errorServer) {
            if (masihAktif) {
              setJenisPesan("error");
              setPesan(
                errorServer instanceof Error
                  ? `Data offline dimuat; Supabase belum dapat diakses: ${errorServer.message}`
                  : "Data offline dimuat; Supabase belum dapat diakses."
              );
            }
          }
        } else {
          const jumlahOffline =
            dataLokal.pendingEmployees.length +
            dataLokal.pendingPayments.length +
            dataLokal.pendingPaymentDeletes.length;
          setPesan(
            jumlahOffline
              ? "Offline. Perubahan yang belum tersinkron tetap tersimpan di perangkat."
              : "Offline. Data terakhir yang tersimpan di perangkat sedang ditampilkan."
          );
        }
      } catch (error) {
        if (masihAktif) {
          setJenisPesan("error");
          setPesan(
            error instanceof Error
              ? error.message
              : "Gagal menyiapkan penyimpanan data karyawan."
          );
        }
      } finally {
        if (masihAktif) {
          setSiap(Boolean(storageKeyRef.current));
          setMemuat(false);
        }
      }
    }

    void mulai();
    return () => {
      masihAktif = false;
      window.removeEventListener("online", ketikaOnline);
    };
  }, [muatDanSinkronkan, muatDariSupabase, sinkronkanPerubahan]);

  function simpanPerubahan(berikutnya: OfflineData) {
    const cacheTersimpan = simpanCache(berikutnya);
    if (!cacheTersimpan) return false;
    if (navigator.onLine) void muatDanSinkronkan();
    else {
      setJenisPesan("sukses");
      setPesan("Tersimpan offline. Perubahan akan dikirim saat koneksi pulih.");
    }
    return true;
  }

  function bukaTambah() {
    setForm(formAwal);
    setModeEdit(false);
    setIdEdit(null);
    setModalTerbuka(true);
  }

  function bukaEdit(item: Employee) {
    setForm({
      nama: item.nama,
      jabatan: item.jabatan,
      telepon: item.telepon,
      tanggalMasuk: item.tanggalMasuk,
      gaji: String(item.gaji),
      status: item.status,
    });
    setModeEdit(true);
    setIdEdit(item.clientId);
    setModalTerbuka(true);
  }

  function simpanKaryawan() {
    if (
      !form.nama.trim() ||
      !form.jabatan.trim() ||
      !form.telepon.trim() ||
      !form.tanggalMasuk ||
      !form.gaji ||
      !Number.isFinite(Number(form.gaji)) ||
      Number(form.gaji) <= 0
    ) {
      setJenisPesan("error");
      setPesan("Mohon lengkapi semua data karyawan dengan benar.");
      return;
    }

    const sebelumnya = dataRef.current;
    let dataKaryawan: Employee | undefined;
    if (modeEdit) {
      const item = sebelumnya.employees.find(
        (karyawan) => karyawan.clientId === idEdit
      );
      if (item) {
        dataKaryawan = {
          ...item,
          nama: form.nama.trim(),
          jabatan: form.jabatan.trim(),
          telepon: form.telepon.trim(),
          tanggalMasuk: form.tanggalMasuk,
          gaji: Number(form.gaji),
          status: form.status,
        };
      }
    } else {
      dataKaryawan = {
        id: idLokalBerikutnya.current--,
        clientId: crypto.randomUUID(),
        nama: form.nama.trim(),
        jabatan: form.jabatan.trim(),
        telepon: form.telepon.trim(),
        tanggalMasuk: form.tanggalMasuk,
        gaji: Number(form.gaji),
        status: form.status,
        diarsipkan: false,
      };
    }

    if (!dataKaryawan) {
      setJenisPesan("error");
      setPesan("Data karyawan yang akan diubah tidak ditemukan.");
      return;
    }

    const dataBerikutnya: OfflineData = {
      ...sebelumnya,
      employees: [
        dataKaryawan,
        ...sebelumnya.employees.filter(
          (item) => item.clientId !== dataKaryawan.clientId
        ),
      ],
      pendingEmployees: [
        dataKaryawan,
        ...sebelumnya.pendingEmployees.filter(
          (item) => item.clientId !== dataKaryawan.clientId
        ),
      ],
    };
    const cacheTersimpan = simpanPerubahan(dataBerikutnya);

    setModalTerbuka(false);
    setForm(formAwal);
    if (cacheTersimpan) {
      setJenisPesan("sukses");
      setPesan(
        online
          ? "Data karyawan tersimpan dan sedang disinkronkan."
          : "Data karyawan tersimpan offline dan akan disinkronkan saat online."
      );
    }
  }

  function hapusKaryawan(clientId: string) {
    const anterior = dataRef.current;
    const karyawanDiarsipkan = anterior.employees.find(
      (item) => item.clientId === clientId
    );
    if (!karyawanDiarsipkan) return;
    const karyawanBerikutnya = {
      ...karyawanDiarsipkan,
      status: "Nonaktif" as const,
      diarsipkan: true,
    };
    simpanPerubahan({
      ...anterior,
      employees: anterior.employees.map((item) =>
        item.clientId === clientId ? karyawanBerikutnya : item
      ),
      pendingEmployees: [
        karyawanBerikutnya,
        ...anterior.pendingEmployees.filter(
          (item) => item.clientId !== clientId
        ),
      ],
    });
    setKonfirmasiHapus(null);
  }

  function ubahStatus(item: Employee) {
    const karyawanBerikutnya = {
      ...item,
      status: item.status === "Aktif" ? "Nonaktif" as const : "Aktif" as const,
    };
    const anterior = dataRef.current;
    simpanPerubahan({
      ...anterior,
      employees: anterior.employees.map((data) =>
        data.clientId === item.clientId ? karyawanBerikutnya : data
      ),
      pendingEmployees: [
        karyawanBerikutnya,
        ...anterior.pendingEmployees.filter(
          (data) => data.clientId !== item.clientId
        ),
      ],
    });
  }

  function bukaFormGaji(karyawanTerpilih: Employee) {
    const telahDibayar = pembayaranPeriode
      .filter(
        (pembayaran) =>
          pembayaran.employeeClientId === karyawanTerpilih.clientId
      )
      .reduce((total, pembayaran) => total + pembayaran.jumlahGaji, 0);
    setPembayaranEdit(null);
    setFormGaji({
      employeeClientId: karyawanTerpilih.clientId,
      tanggalPembayaran: hariIni(),
      periodeBulan: periode,
      jumlahGaji: String(Math.max(karyawanTerpilih.gaji - telahDibayar, 1)),
      catatan: "",
    });
    setFormGajiTerbuka(true);
  }

  function bukaEditGaji(item: PayrollPayment) {
    setPembayaranEdit(item);
    setFormGaji({
      employeeClientId: item.employeeClientId,
      tanggalPembayaran: item.tanggalPembayaran,
      periodeBulan: item.periodeBulan,
      jumlahGaji: String(item.jumlahGaji),
      catatan: item.catatan,
    });
    setFormGajiTerbuka(true);
  }

  function simpanPembayaran() {
    const karyawanGaji = dataRef.current.employees.find(
      (item) => item.clientId === formGaji.employeeClientId
    );
    const jumlah = Number(formGaji.jumlahGaji);
    if (
      !karyawanGaji ||
      !formGaji.tanggalPembayaran ||
      !/^\d{4}-\d{2}-01$/.test(formGaji.periodeBulan) ||
      !Number.isFinite(jumlah) ||
      jumlah <= 0
    ) {
      setJenisPesan("error");
      setPesan("Lengkapi karyawan, periode, tanggal, dan nominal gaji.");
      return;
    }

    const anterior = dataRef.current;
    const pembayaran: PayrollPayment = {
      id: pembayaranEdit?.id ?? idLokalBerikutnya.current--,
      clientId: pembayaranEdit?.clientId ?? crypto.randomUUID(),
      employeeClientId: karyawanGaji.clientId,
      karyawanId: karyawanGaji.id,
      employeeName: karyawanGaji.nama,
      tanggalPembayaran: formGaji.tanggalPembayaran,
      periodeBulan: formGaji.periodeBulan,
      jumlahGaji: jumlah,
      catatan: formGaji.catatan.trim(),
    };
    const cacheTersimpan = simpanPerubahan({
      ...anterior,
      payments: [
        pembayaran,
        ...anterior.payments.filter(
          (item) => item.clientId !== pembayaran.clientId
        ),
      ],
      pendingPayments: [
        pembayaran,
        ...anterior.pendingPayments.filter(
          (item) => item.clientId !== pembayaran.clientId
        ),
      ],
      pendingPaymentDeletes: anterior.pendingPaymentDeletes.filter(
        (id) => id !== pembayaran.clientId
      ),
    });
    setFormGajiTerbuka(false);
    if (cacheTersimpan) {
      setJenisPesan("sukses");
      setPesan(
        online
          ? "Pembayaran gaji tersimpan dan sedang disinkronkan."
          : "Pembayaran gaji tersimpan offline dan akan disinkronkan saat online."
      );
    }
  }

  function hapusPembayaran(item: PayrollPayment) {
    const anterior = dataRef.current;
    const masihTertunda = anterior.pendingPayments.some(
      (pembayaran) => pembayaran.clientId === item.clientId
    );
    simpanPerubahan({
      ...anterior,
      payments: anterior.payments.filter(
        (pembayaran) => pembayaran.clientId !== item.clientId
      ),
      pendingPayments: anterior.pendingPayments.filter(
        (pembayaran) => pembayaran.clientId !== item.clientId
      ),
      pendingPaymentDeletes: masihTertunda
        ? anterior.pendingPaymentDeletes
        : [...anterior.pendingPaymentDeletes, item.clientId],
    });
    setKonfirmasiHapusGaji(null);
  }

  function ubahPeriode(jumlah: number) {
    setPeriode((sebelumnya) => ubahBulan(sebelumnya, jumlah));
  }

  return (
    <main className="dashboard-background min-h-screen text-[#443328]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-9">
        <ServiceNavigation activeHref="/dashboard/karyawan" />

        <section className="dashboard-enter relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#38271f] via-[#5b3e2e] to-[#805a3d] px-5 py-7 text-white shadow-[0_26px_60px_-34px_rgba(54,34,23,0.65)] sm:px-8 sm:py-9 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border-[32px] border-white/[0.06]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-48 h-56 w-56 rounded-full border border-white/[0.08]" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e7c9a4]">
                PURI DONUT&apos;S <span className="px-1 text-white/40">/</span>{" "}
                TIM & PENGGAJIAN
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Karyawan & Gaji
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">
                Kelola data tim, catat pembayaran gaji bulanan, dan lanjutkan
                bekerja meski koneksi sedang terputus.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${online ? "border-emerald-200/20 bg-emerald-300/10 text-emerald-100" : "border-amber-200/20 bg-amber-300/10 text-amber-100"}`}>
                  {online ? <Wifi size={14} /> : <WifiOff size={14} />}
                  {online ? "Online" : "Offline"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                  {sinkronisasi ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : jumlahPerubahanTertunda ? (
                    <CloudOff size={14} />
                  ) : (
                    <Cloud size={14} />
                  )}
                  {sinkronisasi
                    ? "Menyinkronkan..."
                    : jumlahPerubahanTertunda
                      ? `${jumlahPerubahanTertunda} perubahan tertunda`
                      : "Data tersinkron"}
                </span>
                {online && jumlahPerubahanTertunda > 0 && (
                  <button
                    type="button"
                    onClick={() => void muatDanSinkronkan()}
                    disabled={sinkronisasi}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/15 disabled:opacity-60"
                  >
                    <RefreshCw
                      size={13}
                      className={sinkronisasi ? "animate-spin" : ""}
                    />
                    Coba sinkronkan
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none"
                >
                  <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={bukaTambah}
                  disabled={!siap}
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f2d5a5] px-4 py-2.5 text-sm font-bold text-[#493221] shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#f7dfb8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2d5a5] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
                >
                  <Plus size={17} className="transition-transform group-hover:rotate-90" />
                  Tambah karyawan
                </button>
              </div>
            </div>
          </div>
        </section>

        {pesan && (
          <div
            role={jenisPesan === "error" ? "alert" : "status"}
            className={`dashboard-enter flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${jenisPesan === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-[#e8dac7] bg-[#fffaf2] text-[#755334]"}`}
          >
            {online ? <Cloud size={17} className="mt-0.5 shrink-0" /> : <WifiOff size={17} className="mt-0.5 shrink-0" />}
            <p>{pesan}</p>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { judul: "Total karyawan", angka: memuat ? "…" : karyawan.length, catatan: "Data terdaftar", ikon: Users, warna: "bg-[#f5ecdf] text-[#936c45]" },
            { judul: "Karyawan aktif", angka: memuat ? "…" : jumlahAktif, catatan: `${jumlahNonaktif} nonaktif`, ikon: UserCheck, warna: "bg-emerald-50 text-emerald-700" },
            { judul: "Total gaji bulanan", angka: memuat ? "…" : formatRupiah(totalGaji), catatan: "Estimasi karyawan aktif", ikon: Wallet, warna: "bg-amber-50 text-amber-700" },
            { judul: `Terbayar · ${formatBulan(periode)}`, angka: memuat ? "…" : formatRupiah(totalSudahDibayar), catatan: `${lunasCount} dari ${jumlahAktif} karyawan lunas`, ikon: Banknote, warna: "bg-sky-50 text-sky-700" },
          ].map((item, index) => {
            const Icon = item.ikon;
            return (
              <article
                key={item.judul}
                className="dashboard-enter dashboard-card rounded-2xl border border-[#eae2d8]/90 bg-white/90 p-4 shadow-[0_12px_34px_-26px_rgba(64,43,26,0.36)] sm:p-5"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold text-[#88796e] sm:text-sm">{item.judul}</p>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.warna}`}>
                    <Icon size={19} />
                  </span>
                </div>
                <p className="mt-4 break-words text-xl font-bold tracking-tight text-[#49372a] sm:text-2xl">
                  {item.angka}
                </p>
                <p className="mt-1 text-xs text-[#a09285]">{item.catatan}</p>
              </article>
            );
          })}
        </section>

        <section className="dashboard-enter overflow-hidden rounded-3xl border border-[#eae2d8]/90 bg-white/95 shadow-[0_16px_40px_-30px_rgba(64,43,26,0.4)]">
          <div className="flex flex-col gap-5 border-b border-[#f0e8de] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5ecdf] text-[#936c45]">
                  <CalendarCheck size={18} />
                </span>
                <h2 className="text-lg font-bold">Penggajian bulanan</h2>
              </div>
              <p className="mt-2 text-sm text-[#998a7c]">
                Catat pembayaran penuh atau bertahap. Status lunas dihitung dari gaji bulanan.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee5da] bg-[#fcfaf7] p-2 sm:justify-start">
              <button
                type="button"
                onClick={() => ubahPeriode(-1)}
                aria-label="Bulan sebelumnya"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#755334] transition hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#a96732]"
              >
                <ArrowLeft size={17} />
              </button>
              <div className="min-w-[140px] text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a09285]">Periode gaji</p>
                <p className="mt-0.5 text-sm font-bold capitalize text-[#49372a]">{formatBulan(periode)}</p>
              </div>
              <button
                type="button"
                onClick={() => ubahPeriode(1)}
                aria-label="Bulan berikutnya"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#755334] transition hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#a96732]"
              >
                <ArrowLeft size={17} className="rotate-180" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-[#f0e8de] bg-[#fcfaf7]/70 p-4 sm:grid-cols-3 sm:p-6">
            <div className="rounded-2xl border border-[#eee5da] bg-white p-4">
              <p className="text-xs text-[#88796e]">Gaji yang dianggarkan</p>
              <p className="mt-2 text-lg font-bold text-[#49372a]">{formatRupiah(totalGaji)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-xs text-emerald-800/70">Sudah dibayarkan</p>
              <p className="mt-2 text-lg font-bold text-emerald-800">{formatRupiah(totalSudahDibayar)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <p className="text-xs text-amber-900/70">Sisa estimasi pembayaran</p>
              <p className="mt-2 text-lg font-bold text-amber-900">{formatRupiah(totalTertunda)}</p>
            </div>
          </div>

          <div className="divide-y divide-[#f1ebe3]">
            {memuat ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-[#88796e]">
                <RefreshCw size={17} className="animate-spin" />
                Memuat data gaji...
              </div>
            ) : karyawan.filter((item) => item.status === "Aktif").length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Users size={30} className="mx-auto text-[#c6b7a6]" />
                <p className="mt-3 font-semibold text-[#806d5d]">Belum ada karyawan aktif</p>
                <p className="mt-1 text-sm text-[#ad9e90]">Tambahkan karyawan untuk mulai mencatat pembayaran gaji.</p>
              </div>
            ) : (
              karyawan
                .filter((item) => item.status === "Aktif")
                .map((item, index) => {
                  const pembayaranKaryawan = pembayaranPeriode.filter(
                    (pembayaran) => pembayaran.employeeClientId === item.clientId
                  );
                  const telahDibayar = pembayaranKaryawan.reduce(
                    (jumlah, pembayaran) => jumlah + pembayaran.jumlahGaji,
                    0
                  );
                  const persen = Math.min(
                    item.gaji > 0 ? (telahDibayar / item.gaji) * 100 : 0,
                    100
                  );
                  const lunas = telahDibayar >= item.gaji;
                  return (
                    <article
                      key={item.clientId}
                      className="dashboard-enter flex flex-col gap-4 px-4 py-5 transition-colors hover:bg-[#fdfbf8] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6ead8] to-[#ead6bc] text-[#795238]">
                          <UserRound size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-bold text-[#49372a]">{item.nama}</p>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${lunas ? "bg-emerald-50 text-emerald-700" : telahDibayar > 0 ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-800"}`}>
                              {lunas ? "Lunas" : telahDibayar > 0 ? "Dibayar sebagian" : "Belum dibayar"}
                            </span>
                            {data.pendingEmployees.some((employee) => employee.clientId === item.clientId) && (
                              <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">Offline</span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs text-[#998a7c]">{item.jabatan || "Tanpa jabatan"}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-[#f0e8de]">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#a4774d] to-[#d3a66e] transition-[width] duration-700" style={{ width: `${persen}%` }} />
                            </div>
                            <span className="shrink-0 text-[11px] font-medium text-[#88796e]">
                              {formatRupiah(telahDibayar)} / {formatRupiah(item.gaji)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => bukaFormGaji(item)}
                        disabled={!siap || lunas || sinkronisasi}
                        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] disabled:cursor-not-allowed disabled:opacity-60 sm:shrink-0 ${lunas ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-[#704d35] text-white shadow-md shadow-[#704d35]/15 hover:-translate-y-0.5 hover:bg-[#523824] motion-reduce:transform-none"}`}
                      >
                        {lunas ? <Check size={15} /> : <Banknote size={15} />}
                        {lunas ? "Gaji lunas" : "Catat pembayaran"}
                      </button>
                    </article>
                  );
                })
            )}
          </div>
        </section>

        <section className="dashboard-enter overflow-hidden rounded-3xl border border-[#eae2d8]/90 bg-white/95 shadow-[0_16px_40px_-30px_rgba(64,43,26,0.4)]">
          <div className="flex flex-col gap-4 border-b border-[#f0e8de] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5ecdf] text-[#936c45]">
                  <History size={18} />
                </span>
                <h2 className="text-lg font-bold">Riwayat pembayaran gaji</h2>
              </div>
              <p className="mt-2 text-sm text-[#998a7c]">Catatan pembayaran pada {formatBulan(periode)}.</p>
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#eee5da] bg-[#fcfaf7] px-3 sm:w-72">
              <Search size={17} className="shrink-0 text-[#a99a8b]" />
              <input
                value={filterRiwayat}
                onChange={(event) => setFilterRiwayat(event.target.value)}
                placeholder="Cari nama karyawan..."
                className="w-full bg-transparent py-2 text-sm outline-none"
              />
            </label>
          </div>
          {pembayaranTampil.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Clock3 size={28} className="mx-auto text-[#c6b7a6]" />
              <p className="mt-3 text-sm font-semibold text-[#806d5d]">Belum ada pembayaran di periode ini</p>
              <p className="mt-1 text-xs text-[#ad9e90]">Pembayaran yang dicatat akan muncul di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f1ebe3]">
              {pembayaranTampil.map((item) => (
                <article key={item.clientId} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-[#fdfbf8] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Banknote size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#49372a]">{item.employeeName}</p>
                      <p className="mt-1 text-xs text-[#998a7c]">
                        Dibayar {formatTanggal(item.tanggalPembayaran)}
                        {item.catatan ? ` · ${item.catatan}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-sm font-bold text-[#49372a]">{formatRupiah(item.jumlahGaji)}</span>
                    {data.pendingPayments.some((payment) => payment.clientId === item.clientId) && (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">Menunggu sinkron</span>
                    )}
                    <button
                      type="button"
                      onClick={() => bukaEditGaji(item)}
                      disabled={sinkronisasi}
                      aria-label={`Edit pembayaran ${item.employeeName}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#987b5d] transition hover:bg-[#f5ecdf] focus-visible:outline-2 focus-visible:outline-[#a96732] disabled:opacity-50"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setKonfirmasiHapusGaji(item)}
                      disabled={sinkronisasi}
                      aria-label={`Hapus pembayaran ${item.employeeName}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-enter overflow-hidden rounded-3xl border border-[#eae2d8]/90 bg-white/95 shadow-[0_16px_40px_-30px_rgba(64,43,26,0.4)]">
          <div className="border-b border-[#f0e8de] p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Daftar karyawan</h2>
                <p className="mt-1 text-sm text-[#a09285]">Kelola profil, status kerja, dan gaji bulanan.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#eee5da] bg-[#fcfaf7] px-3 sm:w-72">
                  <Search size={17} className="shrink-0 text-[#a99a8b]" />
                  <input
                    value={pencarian}
                    onChange={(event) => setPencarian(event.target.value)}
                    placeholder="Cari nama atau jabatan..."
                    className="w-full bg-transparent py-2 text-sm outline-none"
                  />
                </label>
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#eee5da] bg-[#fcfaf7] px-3">
                  <SlidersHorizontal size={16} className="shrink-0 text-[#9a826a]" />
                  <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                    className="w-full bg-transparent py-2 text-sm outline-none"
                  >
                    <option value="Semua">Semua status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {memuat ? (
            <div className="flex items-center justify-center gap-3 py-14 text-sm text-[#88796e]">
              <RefreshCw size={17} className="animate-spin" />
              Memuat data karyawan...
            </div>
          ) : hasilFilter.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Users size={32} className="mx-auto text-[#c6b7a6]" />
              <p className="mt-3 font-semibold text-[#806d5d]">
                {karyawan.length ? "Data tidak ditemukan" : "Belum ada karyawan"}
              </p>
              <p className="mt-1 text-sm text-[#ad9e90]">
                {karyawan.length
                  ? "Coba kata pencarian atau filter status lain."
                  : "Tambahkan data karyawan pertama untuk memulai."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {hasilFilter.map((item) => (
                  <article key={item.clientId} className="rounded-2xl border border-[#eee5da] bg-[#fffdfa] p-4 shadow-[0_8px_24px_-22px_rgba(64,43,26,0.5)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4e9da] text-[#886342]">
                          <UserRound size={20} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#49372a]">{item.nama}</p>
                          <p className="mt-1 truncate text-xs text-[#998a7c]">{item.jabatan}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f0e8de] pt-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-[#a09285]">Gaji bulanan</p>
                        <p className="mt-1 text-sm font-bold text-[#49372a]">{formatRupiah(item.gaji)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-[#a09285]">Bergabung</p>
                        <p className="mt-1 text-xs font-medium text-[#705c4b]">{formatTanggal(item.tanggalMasuk)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-1 border-t border-[#f0e8de] pt-2">
                      <button type="button" onClick={() => bukaEdit(item)} disabled={sinkronisasi} aria-label={`Edit ${item.nama}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#987b5d] transition hover:bg-[#f5ecdf] focus-visible:outline-2 focus-visible:outline-[#a96732] disabled:opacity-50">
                        <Pencil size={17} />
                      </button>
                      <button type="button" onClick={() => ubahStatus(item)} disabled={sinkronisasi} aria-label={`Ubah status ${item.nama}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#987b5d] transition hover:bg-[#f5ecdf] focus-visible:outline-2 focus-visible:outline-[#a96732] disabled:opacity-50">
                        {item.status === "Aktif" ? <UserX size={17} /> : <UserCheck size={17} />}
                      </button>
                      <button type="button" onClick={() => setKonfirmasiHapus(item.clientId)} disabled={sinkronisasi} aria-label={`Arsipkan ${item.nama}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-[#eee6dc] bg-[#fcfaf7] text-[10px] uppercase tracking-wider text-[#a29486]">
                      <th className="px-5 py-4 font-semibold">Karyawan</th>
                      <th className="px-4 py-4 font-semibold">Jabatan & kontak</th>
                      <th className="px-4 py-4 font-semibold">Tanggal masuk</th>
                      <th className="px-4 py-4 font-semibold">Gaji bulanan</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-4 py-4 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasilFilter.map((item) => (
                      <tr key={item.clientId} className="border-b border-[#f2ece4] transition-colors hover:bg-[#fdfaf6]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e9da] text-[#886342]">
                              <UserRound size={19} />
                            </span>
                            <div>
                              <p className="font-semibold text-[#49372a]">{item.nama}</p>
                              <p className="mt-1 text-[10px] text-[#aa9b8d]">ID-{String(item.id).slice(-5)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-[#705c4b]">{item.jabatan || "-"}</p>
                          <p className="mt-1 text-xs text-[#998a7c]">{item.telepon || "-"}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#857467]">{formatTanggal(item.tanggalMasuk)}</td>
                        <td className="px-4 py-4 text-sm font-bold text-[#49372a]">{formatRupiah(item.gaji)}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${item.status === "Aktif" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => bukaEdit(item)} disabled={sinkronisasi} aria-label={`Edit ${item.nama}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#987b5d] transition hover:bg-[#f5ecdf] disabled:opacity-50">
                              <Pencil size={16} />
                            </button>
                            <button type="button" onClick={() => ubahStatus(item)} disabled={sinkronisasi} aria-label={`Ubah status ${item.nama}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#987b5d] transition hover:bg-[#f5ecdf] disabled:opacity-50">
                              {item.status === "Aktif" ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            <button type="button" onClick={() => setKonfirmasiHapus(item.clientId)} disabled={sinkronisasi} aria-label={`Arsipkan ${item.nama}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:opacity-50">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="flex flex-wrap justify-between gap-2 border-t border-[#f0e8de] px-5 py-4 text-xs text-[#aa9b8d]">
            <span>Menampilkan {hasilFilter.length} dari {karyawan.length} karyawan</span>
            <span>Data disimpan offline dan disinkronkan ke Supabase</span>
          </div>
        </section>
      </div>

      {/* FORM TAMBAH / EDIT */}
      {modalTerbuka && (
        <div
          className="dashboard-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#30251e]/55 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setModalTerbuka(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-form-title"
            className="dashboard-modal my-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/60 bg-white p-5 shadow-[0_30px_90px_-30px_rgba(35,23,15,0.55)] sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#a47b51]">
                  PURI DONUT&apos;S
                </p>
                <h2 id="employee-form-title" className="mt-1 text-xl font-bold">
                  {modeEdit ? "Edit Data Karyawan" : "Tambah Karyawan"}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Tutup formulir"
                onClick={() => setModalTerbuka(false)}
                className="rounded-xl p-2 text-[#958477] transition hover:rotate-90 hover:bg-[#f5eee5]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <InputField label="Nama Lengkap" icon={<UserRound size={17} />}>
                <input
                  required
                  value={form.nama}
                  onChange={(e) =>
                    setForm({ ...form, nama: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap"
                  className="input-style"
                />
              </InputField>

              <InputField label="Jabatan" icon={<BriefcaseBusiness size={17} />}>
                <input
                  required
                  value={form.jabatan}
                  onChange={(e) =>
                    setForm({ ...form, jabatan: e.target.value })
                  }
                  placeholder="Contoh: Bagian Produksi"
                  className="input-style"
                />
              </InputField>

              <InputField label="Nomor HP" icon={<Phone size={17} />}>
                <input
                  type="tel"
                  required
                  value={form.telepon}
                  onChange={(e) =>
                    setForm({ ...form, telepon: e.target.value })
                  }
                  placeholder="08xxxxxxxxxx"
                  className="input-style"
                />
              </InputField>

              <InputField label="Tanggal Bergabung" icon={<CalendarDays size={17} />}>
                <input
                  type="date"
                  required
                  value={form.tanggalMasuk}
                  onChange={(e) =>
                    setForm({ ...form, tanggalMasuk: e.target.value })
                  }
                  className="input-style"
                />
              </InputField>

              <InputField label="Gaji Bulanan" icon={<Wallet size={17} />}>
                <input
                  type="number"
                  min="1"
                  required
                  step="1"
                  value={form.gaji}
                  onChange={(e) =>
                    setForm({ ...form, gaji: e.target.value })
                  }
                  placeholder="Contoh: 1500000"
                  className="input-style"
                />
              </InputField>

              <InputField label="Status Karyawan" icon={<UserCheck size={17} />}>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "Aktif" | "Nonaktif",
                    })
                  }
                  className="input-style"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </InputField>

              <button
                type="button"
                onClick={simpanKaryawan}
                disabled={sinkronisasi}
                className="group mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#795238] to-[#5c3c29] py-3.5 font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] motion-reduce:transform-none"
              >
                <Check size={18} className="transition-transform group-hover:scale-110" />
                {modeEdit ? "Simpan Perubahan" : "Simpan Karyawan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {formGajiTerbuka && (
        <div
          className="dashboard-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#30251e]/55 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setFormGajiTerbuka(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payroll-form-title"
            className="dashboard-modal my-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/60 bg-white p-5 shadow-[0_30px_90px_-30px_rgba(35,23,15,0.55)] sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5ecdf] text-[#936c45]">
                  <Banknote size={21} />
                </span>
                <h2 id="payroll-form-title" className="mt-4 text-xl font-bold text-[#49372a]">
                  {pembayaranEdit ? "Ubah pembayaran gaji" : "Catat pembayaran gaji"}
                </h2>
                <p className="mt-1 text-sm text-[#998a7c]">
                  Perubahan dapat disimpan offline dan disinkronkan saat online.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup formulir pembayaran"
                onClick={() => setFormGajiTerbuka(false)}
                className="rounded-xl p-2 text-[#958477] transition hover:rotate-90 hover:bg-[#f5eee5]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <InputField label="Karyawan" icon={<UserRound size={17} />}>
                <select
                  value={formGaji.employeeClientId}
                  onChange={(event) =>
                    setFormGaji({
                      ...formGaji,
                      employeeClientId: event.target.value,
                      jumlahGaji: String(
                        data.employees.find(
                          (item) => item.clientId === event.target.value
                        )?.gaji || ""
                      ),
                    })
                  }
                  className="input-style"
                  disabled={Boolean(pembayaranEdit)}
                >
                  {karyawan
                    .filter((item) => item.status === "Aktif")
                    .map((item) => (
                      <option key={item.clientId} value={item.clientId}>
                        {item.nama}
                      </option>
                    ))}
                </select>
              </InputField>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Periode gaji" icon={<CalendarDays size={17} />}>
                  <input
                    type="month"
                    required
                    value={formGaji.periodeBulan.slice(0, 7)}
                    onChange={(event) =>
                      setFormGaji({
                        ...formGaji,
                        periodeBulan: event.target.value
                          ? `${event.target.value}-01`
                          : "",
                      })
                    }
                    className="input-style"
                  />
                </InputField>
                <InputField label="Tanggal dibayar" icon={<CalendarCheck size={17} />}>
                  <input
                    type="date"
                    required
                    value={formGaji.tanggalPembayaran}
                    onChange={(event) =>
                      setFormGaji({
                        ...formGaji,
                        tanggalPembayaran: event.target.value,
                      })
                    }
                    className="input-style"
                  />
                </InputField>
              </div>

              <InputField label="Jumlah dibayarkan" icon={<Wallet size={17} />}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={formGaji.jumlahGaji}
                  onChange={(event) =>
                    setFormGaji({ ...formGaji, jumlahGaji: event.target.value })
                  }
                  placeholder="Masukkan nominal pembayaran"
                  className="input-style"
                />
              </InputField>

              <InputField label="Catatan (opsional)" icon={<Pencil size={17} />}>
                <input
                  value={formGaji.catatan}
                  onChange={(event) =>
                    setFormGaji({ ...formGaji, catatan: event.target.value })
                  }
                  placeholder="Contoh: pembayaran gaji tahap pertama"
                  className="input-style"
                />
              </InputField>

              <div className="rounded-2xl border border-[#eee5da] bg-[#fcfaf7] p-4">
                <p className="text-xs text-[#88796e]">Nominal dicatat untuk periode</p>
                <p className="mt-1 font-bold capitalize text-[#49372a]">
                  {formatBulan(formGaji.periodeBulan)}
                </p>
              </div>

              <button
                type="button"
                onClick={simpanPembayaran}
                disabled={sinkronisasi}
                className="group mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#795238] to-[#5c3c29] px-5 py-3 font-bold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none"
              >
                <Check size={18} className="transition-transform group-hover:scale-110" />
                {pembayaranEdit ? "Simpan perubahan" : "Simpan pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KONFIRMASI HAPUS */}
      {konfirmasiHapus !== null && (
        <div
          className="dashboard-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-[#30251e]/55 p-4 backdrop-blur-sm"
          onClick={() => setKonfirmasiHapus(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-title"
            className="dashboard-modal w-full max-w-sm rounded-3xl border border-white/60 bg-white p-6 text-center shadow-[0_30px_90px_-30px_rgba(35,23,15,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Trash2 size={24} />
            </div>

            <h3 id="archive-title" className="mt-4 text-lg font-bold">Arsipkan Karyawan?</h3>
            <p className="mt-2 text-sm text-[#998a7c]">
              Karyawan akan dinonaktifkan dan disembunyikan dari daftar. Riwayat gaji tetap tersimpan.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setKonfirmasiHapus(null)}
                className="flex-1 rounded-xl border border-[#eadfce] py-3 text-sm font-semibold text-[#806d5d] transition hover:bg-[#faf6f0]"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => hapusKaryawan(konfirmasiHapus)}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Arsipkan
              </button>
            </div>
          </div>
        </div>
      )}

      {konfirmasiHapusGaji && (
        <div
          className="dashboard-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-[#30251e]/55 p-4 backdrop-blur-sm"
          onClick={() => setKonfirmasiHapusGaji(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-payroll-title"
            className="dashboard-modal w-full max-w-sm rounded-3xl border border-white/60 bg-white p-6 text-center shadow-[0_30px_90px_-30px_rgba(35,23,15,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Trash2 size={24} />
            </div>
            <h3 id="delete-payroll-title" className="mt-4 text-lg font-bold">
              Hapus catatan pembayaran?
            </h3>
            <p className="mt-2 text-sm text-[#998a7c]">
              Catatan gaji {konfirmasiHapusGaji.employeeName} sebesar{" "}
              {formatRupiah(konfirmasiHapusGaji.jumlahGaji)} akan dihapus dari
              periode {formatBulan(konfirmasiHapusGaji.periodeBulan)}.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setKonfirmasiHapusGaji(null)}
                className="flex-1 rounded-xl border border-[#eadfce] py-3 text-sm font-semibold text-[#806d5d] transition hover:bg-[#faf6f0]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => hapusPembayaran(konfirmasiHapusGaji)}
                disabled={sinkronisasi}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
              >
                Hapus catatan
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-style {
          width: 100%;
          border: 1px solid #e9dfd3;
          background: #fcfaf7;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: #49372a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-style:focus {
          border-color: #a4774b;
          box-shadow: 0 0 0 3px rgba(164, 119, 75, 0.1);
        }
      `}</style>
    </main>
  );
}

function InputField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6d5948]">
        <span className="text-[#a47b51]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
