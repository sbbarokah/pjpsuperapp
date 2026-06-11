import { Suspense } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/server_user";
import { getControlDashboardData } from "@/lib/services/controlService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { ControlDashboardClient } from "./_components/control_dashboard_client";
import { fetchGenerusForControlAction } from "./actions";

export const metadata = {
  title: "Lembar Kontrol Materi | Admin",
};

interface PageProps {
  searchParams: Promise<{
    group?: string;
    category?: string;
    user?: string;
  }>;
}

export default async function ControlDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="text-center py-6">Sesi tidak valid.</p>;

  // Ambil profil admin yang login
  const { data: adminProfile } = await supabase
    .from("profile")
    .select("role, village_id, group_id")
    .eq("user_id", user.id)
    .single();

  if (!adminProfile) return <p>Data profil tidak ditemukan.</p>;

  // Resolve Filter Parameters
  const villageId = adminProfile.role === "admin_desa" ? adminProfile.village_id : undefined;
  const groupId = params.group ? Number(params.group) : (adminProfile.role === "admin_kelompok" ? adminProfile.group_id : undefined);
  const categoryId = params.category ? Number(params.category) : undefined;
  const userId = params.user || undefined;

  // Fetch Master Data untuk Dropdown (Group & Category)
  const [groups, categories] = await Promise.all([
    adminProfile.role === 'admin_desa' 
      ? getGroupsByVillage(adminProfile.village_id) 
      : getGroupsByVillage(adminProfile.village_id).then(g => g.filter(x => x.id === adminProfile.group_id)),
    getCategories()
  ]);

  // Fetch Data Metrik Dashboard berdasarkan Filter
  const { progressCards, materials, history } = await getControlDashboardData(villageId, groupId, categoryId, userId);

  return (
    <>
      <div className="mb-6">
        <Breadcrumb pageName="Lembar Kontrol Materi" showNav={false} />
      </div>
      <Suspense fallback={<div className="text-center py-10 font-medium">Memuat Analisis Kontrol Materi...</div>}>
        <ControlDashboardClient 
          progressCards={progressCards} 
          materials={materials} 
          history={history} 
          admin={adminProfile}
          groups={groups || []}
          categories={categories || []}
          onFetchGenerus={fetchGenerusForControlAction}
        />
      </Suspense>
    </>
  );
}