import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server_user";
import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { SantriCardPrint } from "../../_components/santri-card-print";
import { createAdminClient } from "@/lib/supabase/server_admin";
import { getUserDetailForDetailPage } from "@/lib/services/userService";

export const metadata = {
  title: "Detail Generus | Admin",
};

export default async function DetailGenerusPage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = await params;

  const { profile: adminProfile } = await getAuthenticatedUserAndProfile();
  const user = await getUserDetailForDetailPage(userId);

  // console.log("=== isi user ===", user);

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