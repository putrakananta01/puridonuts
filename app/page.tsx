
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError("Email atau password salah. Silakan coba lagi.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Koneksi bermasalah. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dashboard-background flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="dashboard-enter w-full max-w-md rounded-3xl border border-[#e9e1d6] bg-white/95 p-7 shadow-[0_24px_70px_-38px_rgba(64,43,26,0.3)] backdrop-blur sm:p-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#946b49]">
            Puri Donut&apos;s
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#33261e] sm:text-[1.75rem]">
            Welcome Back, Admin
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#83776b]">
            Welcome to the puri donut's.
          </p>
        </header>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#493a30]"
            >
              Alamat email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="login"
              required
              className="min-h-12 w-full rounded-xl border border-[#e5ded4] bg-[#fffefa] px-4 py-3 text-sm text-[#33261e] outline-none transition placeholder:text-[#b0a69b] hover:border-[#cdbca8] focus:border-[#8c6241] focus:ring-4 focus:ring-[#8c6241]/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#493a30]"
            >
              Kata sandi
            </label>
            <div className="flex min-h-12 items-center rounded-xl border border-[#e5ded4] bg-[#fffefa] pr-3 transition hover:border-[#cdbca8] focus-within:border-[#8c6241] focus-within:ring-4 focus-within:ring-[#8c6241]/10">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="password"
                required
                className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-[#33261e] outline-none placeholder:text-[#b0a69b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="rounded-md px-2 py-1 text-xs font-medium text-[#78583d] transition hover:text-[#4b3024] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c6241]"
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 min-h-12 w-full rounded-xl bg-[#70452d] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(74,48,36,0.8)] transition hover:-translate-y-0.5 hover:bg-[#593824] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70452d] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Memverifikasi akun..." : "Masuk"}
          </button>
        </form>

        <footer className="mt-7 border-t border-[#eee8df] pt-5 text-center">
          <p className="text-xs leading-5 text-[#968a7e]">
            Akses untuk admin usaha.
          </p>
          <p className="mt-2 text-[11px] text-[#b0a69b]">
            © {new Date().getFullYear()} Puri Donut&apos;s
          </p>
        </footer>
      </div>
    </main>
  );
}
