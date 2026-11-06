import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { readAccountPreferences } from "@/lib/account-preferences";
import LogoutButton from "../logout-button";
import ServiceNavigation from "../service-navigation";
import AccountProfileForm from "./account-profile-form";
import PreferencesForm from "./preferences-form";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/");
  }

  if (authError) {
    throw new Error(`Gagal memuat akun: ${authError.message}`);
  }

  const { data: profil, error: profileError } = await supabase
    .from("profiles")
    .select("nama")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Gagal memuat profil: ${profileError.message}`);
  }

  const nama = profil?.nama || "Administrator";
  const preferences = readAccountPreferences(authData.user.user_metadata);

  return (
    <main className="dashboard-background min-h-screen px-4 py-5 text-[#38251c] sm:px-8 sm:py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <ServiceNavigation activeHref="/dashboard/pengaturan" />

        <header className="dashboard-enter relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#38251f] via-[#65412f] to-[#875640] p-6 text-white shadow-[0_24px_54px_-32px_rgba(64,43,26,0.65)] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 -z-10 h-56 w-56 rounded-full border-[30px] border-white/[0.06]"
          />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8c9a7]">
              Akun <span className="px-1 text-white/40">/</span> Preferensi
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Pengaturan
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Tinjau informasi akun dan preferensi yang digunakan di sistem
              Puri Donut&apos;s.
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <section className="dashboard-enter rounded-3xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:p-7">
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1856c]">
                Informasi akun
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-[#493426]">
                Profil pemilik usaha
              </h2>
              <p className="mt-1 text-sm text-[#927e6c]">
                Informasi akun yang sedang digunakan untuk masuk.
              </p>
            </div>

            <AccountProfileForm
              nama={nama}
              email={authData.user.email || ""}
            />
            <dl className="divide-y divide-[#f0ebe4]">
              <div className="flex flex-col gap-1 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <dt className="text-sm text-[#927e6c]">Status akun</dt>
                <dd className="inline-flex items-center gap-2 text-sm font-semibold text-[#55724b] sm:justify-end">
                  <span className="h-2 w-2 rounded-full bg-[#7e9c70]" />
                  Aktif
                </dd>
              </div>
            </dl>
          </section>

          <div className="space-y-5">
            <section className="dashboard-enter rounded-3xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1856c]">
                Preferensi sistem
              </p>
              <h2 className="mt-2 text-lg font-bold tracking-tight text-[#493426]">
                Pengaturan aplikasi
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#927e6c]">
                Preferensi tersimpan di akun dan dapat digunakan di perangkat lain.
              </p>
              <div className="mt-5">
                <PreferencesForm preferences={preferences} />
              </div>
            </section>

            <section className="dashboard-enter flex flex-col gap-4 rounded-3xl border border-[#eae4db] bg-white/95 p-5 shadow-[0_14px_38px_-28px_rgba(64,43,26,0.35)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1856c]">
                  Keamanan
                </p>
                <h2 className="mt-2 text-base font-bold text-[#493426]">
                  Akhiri sesi akun
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#927e6c]">
                  Keluar dari sistem pada perangkat ini.
                </p>
              </div>
              <LogoutButton />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
