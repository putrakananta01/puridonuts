"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function PeriodFilter({ value }: { value: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextPeriod: string) {
    startTransition(() => {
      router.replace(`/dashboard?periode=${encodeURIComponent(nextPeriod)}`, {
        scroll: false,
      });
    });
  }

  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block text-xs font-semibold text-[#776C62]">
        Periode laporan
      </span>
      <input
        aria-label="Pilih bulan dan tahun laporan"
        type="month"
        defaultValue={value}
        onChange={(event) => handleChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[#E6DED5] bg-white px-3 text-sm text-[#45372B] outline-none transition focus:border-[#D38A39] focus:ring-2 focus:ring-[#D38A39]/15 sm:w-44"
      />
      <span aria-live="polite" className="sr-only">
        {isPending ? "Memperbarui ringkasan periode" : ""}
      </span>
    </label>
  );
}
