
"use client";

import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  return (
    <main className="dashboard-background relative flex min-h-screen min-h-dvh items-center justify-center overflow-hidden px-5 py-12 text-[#33261e] sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full border border-[#8e6e4c]/10 sm:-right-20 sm:-top-48 sm:h-[34rem] sm:w-[34rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-36 h-[30rem] w-[30rem] rounded-full border border-[#8e6e4c]/10"
      />

      <section className="dashboard-enter relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 px-7 py-10 text-center shadow-[0_30px_90px_-48px_rgba(64,43,26,0.38)] backdrop-blur-xl sm:px-14 sm:py-14">
        <div
          aria-hidden="true"
          className="mx-auto mb-8 h-px w-12 bg-[#b38a61]"
        />

        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#946b49]">
          Welcome to KEPUDO
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#38281f] sm:text-5xl">
          Puri Donut&apos;s
        </h1>
        <p className="mt-4 text-sm font-medium tracking-wide text-[#826d5b] sm:text-base">
          Kelola usaha dengan lebih terarah.
        </p>

        <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-[#807569]">
          Pantau penjualan, operasional, dan keuangan usaha dalam satu sistem
          yang praktis dan terintegrasi.
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="group mt-9 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#61412e] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(74,48,36,0.8)] transition hover:-translate-y-0.5 hover:bg-[#4b3024] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#61412e] active:translate-y-0 sm:w-auto sm:min-w-52"
        >
          Lets Go
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </button>

        <div
          aria-label="Fitur utama"
          className="mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium text-[#8b7b6c]"
        >
          <span>Finance</span>
          <span aria-hidden="true" className="text-[#c5b29d]">·</span>
          <span>Operational</span>
          <span aria-hidden="true" className="text-[#c5b29d]">·</span>
          <span>Income</span>
        </div>
      </section>

      <footer className="absolute inset-x-0 bottom-5 text-center text-[11px] tracking-wide text-[#9b8b7c]">
        © {new Date().getFullYear()} Puri Donut&apos;s
      </footer>
    </main>
  );
}
