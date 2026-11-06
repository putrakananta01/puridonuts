
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

const menuUtama = [
  { label: "Dashboard", labelEn: "Overview", href: "/dashboard", icon: "dashboard" },
  { label: "Pemasukan", labelEn: "Sales", href: "/dashboard/penjualan", icon: "sales" },
  { label: "Pengeluaran", labelEn: "Expenses", href: "/dashboard/pengeluaran", icon: "expenses" },
  { label: "Pengaturan", labelEn: "Settings", href: "/dashboard/pengaturan", icon: "settings" },
] as const;

const menuKeuangan = [
  {
    label: "Laporan Keuangan",
    labelEn: "Financial reports",
    href: "/dashboard/laporan",
    icon: "report",
  },
  {
    label: "Karyawan & Gaji",
    labelEn: "Team & payroll",
    href: "/dashboard/karyawan",
    icon: "employees",
  },
] as const;

type IconName =
  | (typeof menuUtama)[number]["icon"]
  | (typeof menuKeuangan)[number]["icon"];

function NavigationIcon({ name }: { name: IconName }) {
  const icons: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
    sales: (
      <>
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </>
    ),
    expenses: (
      <>
        <path d="m7 7 10 10" />
        <path d="M8 17h9V8" />
      </>
    ),
    report: (
      <>
        <path d="M4 19.5h16" />
        <path d="M7 16v-4M12 16V7M17 16v-7" />
      </>
    ),
    employees: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 1.2-1.6v-2.8A1.7 1.7 0 0 0 19 9l-.2-.1a1.7 1.7 0 0 1-.8-2.1l.1-.2a1.7 1.7 0 0 0-2.4-2.4l-.2.1a1.7 1.7 0 0 1-2.1-.8l-.1-.2a1.7 1.7 0 0 0-3.4 0l-.1.2a1.7 1.7 0 0 1-2.1.8l-.2-.1a1.7 1.7 0 0 0-2.4 2.4l.1.2a1.7 1.7 0 0 1-.8 2.1L4.2 9a1.7 1.7 0 0 0 0 3.4l.2.1a1.7 1.7 0 0 1 .8 2.1l-.1.2a1.7 1.7 0 0 0 2.4 2.4l.2-.1a1.7 1.7 0 0 1 2.1.8l.1.2a1.7 1.7 0 0 0 3.4 0l.1-.2a1.7 1.7 0 0 1 2.1-.8l.2.1a1.7 1.7 0 0 0 2.4-2.4l-.1-.2a1.7 1.7 0 0 1 .8-2.1Z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
}

export default function ServiceNavigation({
  activeHref,
}: {
  activeHref?: string;
}) {
  const pathname = usePathname();
  const activePath = activeHref ?? pathname;

  const keuanganAktif = menuKeuangan.some(
    (item) =>
      activePath === item.href || activePath.startsWith(`${item.href}/`)
  );

  const [terbuka, setTerbuka] = useState(false);
  const [keuanganTerbuka, setKeuanganTerbuka] = useState(keuanganAktif);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!terbuka) return;

    const overflowSebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTerbuka(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflowSebelumnya;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [terbuka]);

  function tutupMenu() {
    setTerbuka(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#eadfce]/80 bg-[#fffdfa]/90 shadow-[0_8px_28px_-24px_rgba(70,46,29,0.5)] backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setTerbuka((v) => !v)}
              aria-label={terbuka ? "Close menu / Tutup menu" : "Open menu / Buka menu"}
              aria-expanded={terbuka}
              aria-controls="dashboard-navigation"
              className="group flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] rounded-2xl border border-[#eadfce] bg-white text-[#593923] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#c5a77e] hover:bg-[#fbf6ee] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span className={`h-[2px] w-5 rounded-full bg-current transition duration-300 ${terbuka ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`h-[2px] w-5 rounded-full bg-current transition duration-300 ${terbuka ? "scale-x-0 opacity-0" : ""}`} />
              <span className={`h-[2px] w-5 rounded-full bg-current transition duration-300 ${terbuka ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>

            <Link href="/dashboard" className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold tracking-[0.15em] text-[#563721] sm:text-[17px]">
                PURI DONUT&apos;S
              </span>
              <span className="mt-0.5 block text-[8px] font-medium tracking-[0.2em] text-[#a58a6b]">
                FINANCIAL MANAGEMENT
              </span>
            </Link>
          </div>

          <div className="hidden items-center gap-2.5 rounded-full border border-[#eadfce] bg-white px-3.5 py-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#8d9b70]" aria-hidden="true" />
            <span className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#65412f]">
                Business finance
              </span>
              <span className="mt-0.5 block text-[9px] text-[#8a7568]">
                Sistem Keuangan UMKM
              </span>
            </span>
          </div>
        </div>
      </header>

      <button
        type="button"
        aria-label="Close navigation / Tutup navigasi"
        aria-hidden={!terbuka}
        tabIndex={terbuka ? 0 : -1}
        disabled={!terbuka}
        onClick={tutupMenu}
        className={`fixed inset-0 z-[60] bg-[#21170f]/45 backdrop-blur-[3px] transition-opacity duration-300 ${
          terbuka ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="dashboard-navigation"
        aria-label="Main navigation / Navigasi utama"
        aria-hidden={!terbuka}
        inert={!terbuka}
        className={`fixed bottom-0 left-0 top-0 z-[70] flex w-[min(360px,90vw)] flex-col border-r border-[#eadfce] bg-[#fffdfa] shadow-[20px_0_70px_-30px_rgba(37,24,16,0.5)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          terbuka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#70452d] via-[#60402d] to-[#43291e] px-6 pb-7 pt-8 text-white">
          <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full border border-white/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e5c58e]/35 bg-[#e5c58e]/10 text-lg font-bold text-[#f3d69e]">
                PD
              </div>
              <p className="text-lg font-extrabold tracking-[0.13em]">
                PURI DONUT&apos;S
              </p>
              <p className="mt-1 text-[9px] tracking-[0.2em] text-[#ead7c0]">
                FINANCIAL MANAGEMENT
              </p>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={tutupMenu}
              aria-label="Close menu / Tutup menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-xl transition duration-200 hover:rotate-90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f3d69e] motion-reduce:transform-none motion-reduce:transition-none"
            >
              ×
            </button>
          </div>

          <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#ead7c0]">
              Business workspace
            </p>
            <span className="rounded-full border border-white/15 bg-white/[0.07] px-2.5 py-1 text-[9px] font-medium text-white/70">
              Keuangan &amp; operasional
            </span>
          </div>
        </div>

        <nav
          aria-label="Service navigation / Navigasi layanan"
          className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-6 sm:px-5"
        >
          <section>
            <h2 className="mb-3 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a18d79]">
              <span>Main menu</span>
              <span className="h-px flex-1 bg-[#eee5da]" aria-hidden="true" />
            </h2>

            <div className="space-y-1">
              {menuUtama.slice(0, 3).map((item) => {
                const aktif =
                  activePath === item.href ||
                  (item.href !== "/dashboard" &&
                    activePath.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={aktif ? "page" : undefined}
                    onClick={() => setTerbuka(false)}
                    className={`group flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2.5 transition duration-200 hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none ${
                      aktif
                        ? "border-[#563721] bg-[#563721] text-white shadow-[0_8px_20px_-12px_rgba(65,39,23,0.75)]"
                        : "border-transparent text-[#765b43] hover:border-[#eee3d4] hover:bg-[#f8f3ec]"
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      aktif ? "bg-white/10 text-[#e7c68e]" : "bg-[#f1e7d8] text-[#8a6846]"
                    }`}>
                      <NavigationIcon name={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">{item.label}</span>
                      <span className={`mt-0.5 block text-[9px] font-medium tracking-wide ${aktif ? "text-white/60" : "text-[#a18d79]"}`}>
                        {item.labelEn}
                      </span>
                    </span>
                    <span className={`text-sm transition-transform duration-200 group-hover:translate-x-0.5 ${aktif ? "text-[#e7c68e]" : "opacity-50"}`} aria-hidden="true">›</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-1">
              <button
                type="button"
                onClick={() => setKeuanganTerbuka((v) => !v)}
                aria-expanded={keuanganTerbuka}
                className={`group flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition duration-200 hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none ${
                  keuanganAktif
                    ? "border-[#563721] bg-[#563721] text-white shadow-[0_8px_20px_-12px_rgba(65,39,23,0.75)]"
                    : "border-transparent text-[#765b43] hover:border-[#eee3d4] hover:bg-[#f8f3ec]"
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  keuanganAktif
                    ? "bg-white/10 text-[#e7c68e]"
                    : "bg-[#f1e7d8] text-[#8a6846]"
                }`}>
                  <NavigationIcon name="report" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold">Keuangan</span>
                  <span className={`mt-0.5 block text-[9px] font-medium tracking-wide ${keuanganAktif ? "text-white/60" : "text-[#a18d79]"}`}>
                    Finance
                  </span>
                </span>
                <span className={`text-sm transition-transform duration-300 ${keuanganTerbuka ? "rotate-90" : ""}`}>
                  ›
                </span>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${
                  keuanganTerbuka
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="ml-7 mt-2 space-y-1 border-l border-[#e5d7c5] pl-3">
                    {menuKeuangan.map((item) => {
                      const aktif = activePath === item.href ||
                        activePath.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={aktif ? "page" : undefined}
                          onClick={() => setTerbuka(false)}
                          className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition duration-200 hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none ${
                            aktif
                              ? "bg-[#f0e5d5] font-bold text-[#563721]"
                              : "text-[#806b55] hover:bg-[#f7f1e9] hover:text-[#563721]"
                          }`}
                        >
                          <NavigationIcon name={item.icon} />
                          <span>
                            <span className="block text-xs font-semibold">{item.label}</span>
                            <span className="mt-0.5 block text-[9px] font-normal text-[#a18d79]">
                              {item.labelEn}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-1">
              {menuUtama.slice(3).map((item) => {
                const aktif = activePath === item.href ||
                  activePath.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={aktif ? "page" : undefined}
                    onClick={() => setTerbuka(false)}
                    className={`group flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2.5 transition duration-200 hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none ${
                      aktif
                        ? "border-[#563721] bg-[#563721] text-white shadow-[0_8px_20px_-12px_rgba(65,39,23,0.75)]"
                        : "border-transparent text-[#765b43] hover:border-[#eee3d4] hover:bg-[#f8f3ec]"
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1e7d8] text-[#8a6846]">
                      <NavigationIcon name={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">{item.label}</span>
                      <span className={`mt-0.5 block text-[9px] font-medium tracking-wide ${aktif ? "text-white/60" : "text-[#a18d79]"}`}>
                        {item.labelEn}
                      </span>
                    </span>
                    <span className={`text-sm transition-transform duration-200 group-hover:translate-x-0.5 ${aktif ? "text-[#e7c68e]" : "opacity-50"}`} aria-hidden="true">›</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </nav>

        <footer className="border-t border-[#eee5da] p-4 sm:p-5">
          <div className="mb-4 rounded-2xl border border-[#eee5da] bg-[#fcfaf7] p-3.5">
            <p className="text-xs font-bold text-[#563721]">
              Kelola usaha lebih teratur
            </p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#a18d79]">
              Better business, at a glance
            </p>
            <p className="mt-1 text-[10px] leading-4 text-[#9b8267]">
              Pantau operasional dan keuangan dalam satu tempat.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a18d79]">
                Account
              </p>
              <p className="mt-1 text-xs font-semibold text-[#5b4637]">
                Pemilik usaha · Business owner
              </p>
            </div>
            <LogoutButton />
          </div>
        </footer>
      </aside>
    </>
  );
}
