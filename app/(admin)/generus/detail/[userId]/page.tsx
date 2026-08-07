import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server_user";
import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { SantriCardPrint } from "../../_components/santri-card-print";

export const metadata = {
  title: "Detail Generus | Admin",
};

interface DetailPageProps {
  params: Promise<{ userId: string }>;
}

async function getUserDetail(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profile")
    .select(`*, village(name), group(name), category(name)`)
    .eq("user_id", userId)
    .single();

  if (error || !profile) return null;

  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  const email = authData?.user?.email || "N/A";

  return {
    ...profile,
    email,
    village: profile.village ? { name: profile.village.name } : null,
    group: profile.group ? { name: profile.group.name } : null,
    category: profile.category ? { name: profile.category.name } : null,
  };
}

export default async function DetailGenerusPage({ params }: DetailPageProps) {
  const { userId } = await params;
  const { profile: adminProfile } = await getAuthenticatedUserAndProfile();
  const user = await getUserDetail(userId);

  if (!user) notFound();

  return (
    <div>
      <Breadcrumb pageName="Detail Generus" />
      <Suspense fallback={<div className="py-8 text-center">Memuat...</div>}>
        <SantriCardPrint user={user} admin={adminProfile} />
      </Suspense>
    </div>
  );
}