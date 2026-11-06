"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import {
  isAppCurrency,
  isAppLanguage,
} from "@/lib/account-preferences";

type ActionResult = {
  success: boolean;
  message: string;
};

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      supabase,
      user: null,
      error: "Sesi akun tidak valid. Silakan masuk kembali.",
    };
  }

  return { supabase, user: data.user, error: null };
}

export async function updateProfileName(formData: FormData): Promise<ActionResult> {
  const nama = formData.get("nama");

  if (typeof nama !== "string" || !nama.trim() || nama.trim().length > 80) {
    return {
      success: false,
      message: "Nama profil wajib diisi dan maksimal 80 karakter.",
    };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, message: authError ?? "Sesi akun tidak valid." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ nama: nama.trim() })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, message: `Nama profil gagal disimpan: ${error.message}` };
  }

  if (!data) {
    return {
      success: false,
      message: "Profil tidak ditemukan atau tidak memiliki izin untuk diubah.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pengaturan");

  return { success: true, message: "Nama profil berhasil diperbarui." };
}

export async function updateAccountEmail(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email");

  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return { success: false, message: "Masukkan alamat email yang valid." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, message: authError ?? "Sesi akun tidak valid." };
  }

  if (email.trim().toLowerCase() === user.email?.toLowerCase()) {
    return { success: false, message: "Email baru sama dengan email yang digunakan saat ini." };
  }

  const { error } = await supabase.auth.updateUser({ email: email.trim() });

  if (error) {
    return { success: false, message: `Email gagal diperbarui: ${error.message}` };
  }

  revalidatePath("/dashboard/pengaturan");

  return {
    success: true,
    message:
      "Permintaan perubahan email berhasil. Silakan ikuti tautan konfirmasi dari Supabase untuk menyelesaikannya.",
  };
}

export async function updateDisplayPreferences(
  formData: FormData
): Promise<ActionResult> {
  const language = formData.get("language");
  const currency = formData.get("currency");

  if (
    typeof language !== "string" ||
    !isAppLanguage(language) ||
    typeof currency !== "string" ||
    !isAppCurrency(currency)
  ) {
    return {
      success: false,
      message: "Pilih bahasa dan mata uang yang tersedia.",
    };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, message: authError ?? "Sesi akun tidak valid." };
  }

  const metadata = user.user_metadata ?? {};
  const { error } = await supabase.auth.updateUser({
    data: {
      ...metadata,
      preferences: { language, currency },
    },
  });

  if (error) {
    return {
      success: false,
      message: `Preferensi gagal disimpan: ${error.message}`,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pengaturan");

  return {
    success: true,
    message: "Preferensi berhasil disimpan pada akun Anda.",
  };
}
