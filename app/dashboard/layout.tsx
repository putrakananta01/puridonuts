import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { readAccountPreferences } from "@/lib/account-preferences";
import PreferencesProvider from "./preferences-provider";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error?.name === "AuthSessionMissingError" || (!error && !data.user)) {
    redirect("/");
  }

  if (error) {
    throw new Error(`Gagal memuat preferensi akun: ${error.message}`);
  }

  return (
    <PreferencesProvider
      preferences={readAccountPreferences(data.user?.user_metadata)}
    >
      {children}
    </PreferencesProvider>
  );
}
