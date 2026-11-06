"use client";

import { useState, useTransition, type FormEvent } from "react";
import { updateAccountEmail, updateProfileName } from "./actions";

type AccountProfileFormProps = {
  nama: string;
  email: string;
};

export default function AccountProfileForm({
  nama,
  email,
}: AccountProfileFormProps) {
  const [namaProfil, setNamaProfil] = useState(nama);
  const [emailAkun, setEmailAkun] = useState(email);
  const [pesanNama, setPesanNama] = useState("");
  const [pesanEmail, setPesanEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function simpanNama(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm("Simpan perubahan nama profil?")) return;

    const formData = new FormData(event.currentTarget);
    setPesanNama("");

    startTransition(async () => {
      const result = await updateProfileName(formData);
      setPesanNama(result.message);
    });
  }

  function simpanEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm(`Kirim permintaan perubahan email ke ${emailAkun}?`)) return;

    const formData = new FormData(event.currentTarget);
    setPesanEmail("");

    startTransition(async () => {
      const result = await updateAccountEmail(formData);
      setPesanEmail(result.message);
    });
  }

  return (
    <div className="divide-y divide-[#f0ebe4]">
      <form
        onSubmit={simpanNama}
        className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
      >
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-sm text-[#927e6c]">Nama profil</span>
          <input
            name="nama"
            type="text"
            autoComplete="name"
            maxLength={80}
            required
            value={namaProfil}
            onChange={(event) => setNamaProfil(event.target.value)}
            className="h-10 w-full rounded-xl border border-[#e5d8c7] bg-white px-3 text-sm text-[#493426] outline-none transition focus:border-[#a96732] focus:ring-2 focus:ring-[#a96732]/15"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-[#70452d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5d3925] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : "Simpan nama"}
        </button>
        {pesanNama && (
          <p role="status" className="text-xs text-[#806b55] sm:basis-full">
            {pesanNama}
          </p>
        )}
      </form>

      <form
        onSubmit={simpanEmail}
        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
      >
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-sm text-[#927e6c]">Email akun</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={emailAkun}
            onChange={(event) => setEmailAkun(event.target.value)}
            className="h-10 w-full rounded-xl border border-[#e5d8c7] bg-white px-3 text-sm text-[#493426] outline-none transition focus:border-[#a96732] focus:ring-2 focus:ring-[#a96732]/15"
          />
          <span className="mt-1.5 block text-xs leading-5 text-[#927e6c]">
            Selesaikan konfirmasi dari Supabase agar perubahan email aktif.
          </span>
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[#e5d8c7] bg-white px-4 py-2 text-sm font-semibold text-[#70452d] transition hover:border-[#cdb79b] hover:bg-[#f8f2e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Memproses..." : "Ubah email"}
        </button>
        {pesanEmail && (
          <p role="status" className="text-xs text-[#806b55] sm:basis-full">
            {pesanEmail}
          </p>
        )}
      </form>
    </div>
  );
}
