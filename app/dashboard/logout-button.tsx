"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("Sesi belum berhasil diakhiri. Silakan coba kembali.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Koneksi bermasalah. Silakan coba keluar kembali.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loading}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#e5d8c7] bg-white px-4 py-2 text-sm font-semibold text-[#70452d] transition hover:border-[#cdb79b] hover:bg-[#f8f2e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96732] disabled:cursor-wait disabled:opacity-60"
      >
        <span aria-hidden="true">↪</span>
        {loading ? "Mengakhiri sesi..." : "Keluar"}
      </button>
      {error && (
        <p role="alert" className="mt-2 max-w-52 text-xs text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
