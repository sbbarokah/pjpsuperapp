"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { FaUserCircle } from "react-icons/fa";

function UserInfoSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-10 animate-pulse rounded-full bg-gray-200 dark:bg-boxdark-2 shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200 dark:bg-boxdark-2" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-boxdark-2" />
      </div>
    </div>
  );
}

export function UserInfoLabel() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUserData();
  }, []);

  if (loading) {
    return <UserInfoSkeleton />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white font-medium"
      >
        Log In
      </Link>
    );
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0];
  const userEmail = user.email || "No email";

  return (
    <div className="flex items-center gap-3 min-w-0">
      <FaUserCircle className="size-10 text-gray-400 shrink-0 dark:text-gray-500" />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate text-xs font-bold text-dark dark:text-white leading-tight">
          {userName}
        </span>
        <span className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {userEmail}
        </span>
      </div>
    </div>
  );
}