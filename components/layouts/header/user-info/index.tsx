"use client";

import { ChevronUpIcon } from "@/assets/icons";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { FaUserCircle } from "react-icons/fa";

function UserInfoSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-12 animate-pulse rounded-full bg-gray-2 dark:bg-boxdark-2"></div>
      <div className="hidden h-5 w-24 animate-pulse rounded bg-gray-2 dark:bg-boxdark-2 lg:block"></div>
    </div>
  );
}

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 5. Gunakan useEffect untuk mengambil data user saat komponen dimuat
  useEffect(() => {
    // Buat fungsi async di dalam effect
    async function getUserData() {
      const supabase = createClient(); // Buat client Supabase (sisi klien)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUserData(); // Panggil fungsi tersebut
  }, []);

  if (loading) {
    return <UserInfoSkeleton />;
  }

  // 7. Jika user tidak login, tampilkan tombol login (atau null)
  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-primary px-4 py-2 text-white"
      >
        Log In
      </Link>
    );
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0];
  const userEmail = user.email || "No email";
  const userImg = user.user_metadata?.avatar_url || "/images/user/user-03.png"; // Fallback image

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">Akun Saya</span>

        <figure className="flex items-center gap-3">
          {/* <Image
            src={userImg} // Gunakan data dinamis
            className="size-12 rounded-full" // Tambahkan rounded-full
            alt={`Avatar of ${userName}`}
            role="presentation"
            width={200} // Sesuaikan dengan size-12
            height={200} // Sesuaikan dengan size-12
          /> */}
          <FaUserCircle 
            className="size-12 text-gray-400" // size-12 untuk ukuran, text-gray untuk warna
          />
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{userName}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">Informasi</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          {/* <Image
            src={userImg}
            className="size-12"
            alt={`Avatar for ${userName}`}
            role="presentation"
            width={200}
            height={200}
          /> */}
          <FaUserCircle 
            className="size-12 text-gray-400" // size-12 untuk ukuran, text-gray untuk warna
          />

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {userName}
            </div>

            <div className="leading-none text-gray-6">{userEmail}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          {/* <Link
            href={"/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">View profile</span>
          </Link> */}

          {/* <Link
            href={"/pages/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Account Settings
            </span>
          </Link> */}
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={async () => {
              // 1. Buat client
              const supabase = createClient();
              
              // 2. Panggil signOut
              const { error } = await supabase.auth.signOut();
              
              if (error) {
                console.error("Error logging out:", error.message);
              }
              
              // 3. Tutup dropdown
              setIsOpen(false);
              
              // 4. Reload halaman untuk membersihkan state
              //    dan memicu redirect ke halaman login
              window.location.reload();
            }}
          >
            <LogOutIcon />
            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
