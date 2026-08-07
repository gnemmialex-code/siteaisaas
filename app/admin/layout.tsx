import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";

const ADMIN_EMAIL = "gnemmialex@gmail.com";

/** Back-office : hors index. */
export const metadata: Metadata = {
  title: "Administration — AstraCrea",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/login");
  }

  return <>{children}</>;
}
