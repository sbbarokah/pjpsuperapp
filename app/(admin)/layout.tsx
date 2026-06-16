// app/(admin)/layout.tsx (server)
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getAuthenticatedUserAndProfile();
  
  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />

      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />
        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
