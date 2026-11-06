"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrencyLocale,
  type AccountPreferences,
} from "@/lib/account-preferences";
import { updateDisplayPreferences } from "./actions";

const bahasa = {
  id: {
    note: "Pilihan bahasa disimpan untuk preferensi akun.",
  },
  en: {
    label: "English",
    note: "Language preference is saved to your account.",
  },
};

const mataUang = [
  { code: "IDR", name: "Rupiah Indonesia" },
  { code: "USD", name: "US Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "MYR", name: "Ringgit Malaysia" },
  { code: "EUR", name: "Euro" },
] as const;

export default function PreferencesForm({
  preferences,
}: {
  preferences: AccountPreferences;
}) {
  const router = useRouter();
  const [language, setLanguage] = useState(preferences.language);
  const [currency, setCurrency] = useState(preferences.currency);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm("Simpan perubahan bahasa dan mata uang?")) return;

    const formData = new FormData(event.currentTarget);
    setMessage("");

    startTransition(async () => {
      const result = await updateDisplayPreferences(formData);
      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) router.refresh();
    });
  }

  const sampleAmount = new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(125000);

  return (
    <form onSubmit={savePreferences} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="group rounded-2xl border border-[#eee4d8] bg-gradient-to-br from-[#fffdf9] to-[#f8f2e9] p-4 transition hover:border-[#d8c3a9]">
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
              🌐
            </span>
            <span>
              <span className="block text-sm font-bold text-[#493426]">
                Bahasa
              </span>
              <span className="mt-0.5 block text-xs text-[#927e6c]">
                Pilih bahasa preferensi
              </span>
            </span>
          </span>
          <select
            name="language"
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as AccountPreferences["language"])
            }
            className="mt-4 h-11 w-full rounded-xl border border-[#e5d8c7] bg-white px-3 text-sm font-semibold text-[#493426] outline-none transition focus:border-[#a96732] focus:ring-2 focus:ring-[#a96732]/15"
          >
            <option value="id">🇮🇩 Bahasa Indonesia</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </label>

        <label className="group rounded-2xl border border-[#eee4d8] bg-gradient-to-br from-[#fffdf9] to-[#f8f2e9] p-4 transition hover:border-[#d8c3a9]">
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
              💱
            </span>
            <span>
              <span className="block text-sm font-bold text-[#493426]">
                Mata uang tampilan
              </span>
              <span className="mt-0.5 block text-xs text-[#927e6c]">
                Tanpa konversi nilai
              </span>
            </span>
          </span>
          <select
            name="currency"
            value={currency}
            onChange={(event) =>
              setCurrency(event.target.value as AccountPreferences["currency"])
            }
            className="mt-4 h-11 w-full rounded-xl border border-[#e5d8c7] bg-white px-3 text-sm font-semibold text-[#493426] outline-none transition focus:border-[#a96732] focus:ring-2 focus:ring-[#a96732]/15"
          >
            {mataUang.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} · {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-[#38251f] p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e8c9a7]">
            Pratinjau format
          </p>
          <p className="mt-1 text-xs text-white/65">
            Contoh tampilan nominal
          </p>
        </div>
        <p className="text-2xl font-bold tracking-tight text-[#f0c99d]">
          {sampleAmount}
        </p>
      </div>

      <p className="text-xs leading-5 text-[#927e6c]">
        Format simbol dan angka akan mengikuti pilihan mata uang. Nilai
        transaksi tidak dikonversi dan tetap menggunakan nominal yang tersimpan.
        {` ${bahasa[language].note}`}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-[#806b55]">
          {message}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#70452d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(70,43,27,0.65)] transition hover:-translate-y-0.5 hover:bg-[#5d3925] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] disabled:cursor-wait disabled:opacity-60"
        >
          <span aria-hidden="true">{isPending ? "…" : "✓"}</span>
          {isPending ? "Menyimpan..." : "Simpan preferensi"}
        </button>
      </div>
      {message && (
        <p
          role={success ? "status" : "alert"}
          className={`text-xs ${success ? "text-[#55724b]" : "text-rose-700"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
