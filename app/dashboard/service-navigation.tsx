import Link from "next/link";
import LogoutButton from "./logout-button";

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Penjualan", href: "/dashboard/penjualan" },
  { name: "Produksi", href: "/dashboard/produksi" },
  { name: "Pengeluaran", href: "/dashboard/pengeluaran" },
  { name: "Karyawan & Gaji", href: "/dashboard/karyawan" },
  { name: "Laporan", href: "/dashboard/laporan" },
];

export default function ServiceNavigation({
  activeHref,
}: {
  activeHref: string;
}) {
  return (
    <div className="dashboard-enter flex flex-col gap-3 rounded-2xl border border-[#eae4db] bg-white/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <nav
        aria-label="Navigasi layanan"
        className="flex min-w-0 gap-1 overflow-x-auto pb-1 sm:pb-0"
      >
        {links.map((link) => {
          const aktif = link.href === activeHref;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={aktif ? "page" : undefined}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] sm:text-sm ${
                aktif
                  ? "bg-[#70452d] text-white shadow-sm"
                  : "text-[#78695b] hover:bg-[#f8f2e9] hover:text-[#70452d]"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
      <LogoutButton />
    </div>
  );
}
